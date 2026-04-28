import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

type SupabaseClient = ReturnType<typeof createServiceClient>

async function validateApiKey(apiKey: string): Promise<{ userId: string } | null> {
  const supabase = createServiceClient()
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')

  const { data, error } = await supabase
    .from('api_keys')
    .select('user_id, id')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) return null

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return { userId: data.user_id }
}

async function logActivity(
  supabase: SupabaseClient,
  userId: string,
  projectId: string | null,
  action: string,
  details: Record<string, unknown>
) {
  await supabase.from('activity_log').insert({ user_id: userId, project_id: projectId, action, details })
}

export async function handleMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  apiKey: string
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const auth = await validateApiKey(apiKey)
  if (!auth) {
    return { content: [{ type: 'text', text: 'Invalid API key.' }], isError: true }
  }

  const supabase = createServiceClient()
  const { userId } = auth

  try {
    // Support both prefixed (nokloo_*) and legacy unprefixed names
    const normalizedTool = toolName.startsWith('nokloo_') ? toolName.slice(7) : toolName

    switch (normalizedTool) {
      case 'create_project': {
        const { name, description, raw_idea, project_type, complexity, features } = args as {
          name: string; description: string; raw_idea?: string; project_type?: string
          complexity?: string; features?: string[]
        }

        const { data, error } = await supabase
          .from('projects')
          .insert({ user_id: userId, name, description, raw_idea, project_type, complexity, features: features ?? [], status: 'idea' })
          .select()
          .single()

        if (error) throw error

        await logActivity(supabase, userId, data.id, 'project_created', { name })
        return { content: [{ type: 'text', text: JSON.stringify({ project_id: data.id, name: data.name, status: 'created' }) }] }
      }

      case 'update_project': {
        const { project_id, ...updates } = args as { project_id: string; [key: string]: unknown }

        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', project_id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        await logActivity(supabase, userId, project_id, 'project_updated', updates)
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'updated', project: data }) }] }
      }

      case 'set_phases': {
        const { project_id, version_name, version_description, phases } = args as {
          project_id: string; version_name?: string; version_description?: string
          phases: Array<{ name: string; phase_type: string; tasks?: Array<{ title: string; description?: string }> }>
        }

        // Verify project ownership
        const { data: project, error: projError } = await supabase
          .from('projects')
          .select('id')
          .eq('id', project_id)
          .eq('user_id', userId)
          .single()

        if (projError || !project) throw new Error('Project not found')

        // Get current version count
        const { count } = await supabase
          .from('versions')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project_id)

        const versionName = version_name ?? `V${(count ?? 0) + 1}`

        const { data: version, error: versionError } = await supabase
          .from('versions')
          .insert({ project_id, name: versionName, description: version_description, order_index: count ?? 0 })
          .select()
          .single()

        if (versionError) throw versionError

        const createdPhases = []
        for (let i = 0; i < phases.length; i++) {
          const phase = phases[i]
          const isFirst = i === 0

          const { data: phaseData, error: phaseError } = await supabase
            .from('phases')
            .insert({
              version_id: version.id,
              name: phase.name,
              phase_type: phase.phase_type,
              order_index: i,
              status: isFirst ? 'active' : 'pending',
            })
            .select()
            .single()

          if (phaseError) throw phaseError

          if (phase.tasks?.length) {
            const taskInserts = phase.tasks.map((t, ti) => ({
              phase_id: phaseData.id,
              title: t.title,
              description: t.description ?? null,
              order_index: ti,
            }))
            await supabase.from('tasks').insert(taskInserts)
          }

          createdPhases.push({ id: phaseData.id, name: phaseData.name, phase_type: phaseData.phase_type })
        }

        // Update project status to planning
        await supabase.from('projects').update({ status: 'planning' }).eq('id', project_id)
        await logActivity(supabase, userId, project_id, 'phases_set', { version: versionName, phase_count: phases.length })

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ version_id: version.id, phases: createdPhases }),
          }],
        }
      }

      case 'add_task': {
        const { phase_id, title, description, task_type } = args as {
          phase_id: string; title: string; description?: string; task_type?: string
        }

        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('phase_id', phase_id)

        const { data, error } = await supabase
          .from('tasks')
          .insert({ phase_id, title, description, task_type: task_type ?? 'task', order_index: count ?? 0 })
          .select()
          .single()

        if (error) throw error

        const { data: phase } = await supabase.from('phases').select('version_id').eq('id', phase_id).single()
        const { data: version } = phase ? await supabase.from('versions').select('project_id').eq('id', phase.version_id).single() : { data: null }
        if (version) await logActivity(supabase, userId, version.project_id, 'task_added', { title, phase_id })

        return { content: [{ type: 'text', text: JSON.stringify({ task_id: data.id, title: data.title }) }] }
      }

      case 'update_task': {
        const { task_id, ...updates } = args as { task_id: string; [key: string]: unknown }

        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', task_id)
          .select()
          .single()

        if (error) throw error
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'updated', task: data }) }] }
      }

      case 'generate_uat_checklist': {
        const { phase_id, feature_name, checklist_items } = args as {
          phase_id: string; feature_name: string; checklist_items: string[]
        }

        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('phase_id', phase_id)

        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .insert({
            phase_id,
            title: `UAT: ${feature_name}`,
            description: `User acceptance testing checklist for ${feature_name}`,
            task_type: 'checklist',
            order_index: count ?? 0,
          })
          .select()
          .single()

        if (taskError) throw taskError

        const items = checklist_items.map((item, i) => ({
          task_id: task.id,
          item,
          order_index: i,
          checked: false,
        }))

        const { error: itemsError } = await supabase.from('checklist_items').insert(items)
        if (itemsError) throw itemsError

        const { data: phase } = await supabase.from('phases').select('version_id').eq('id', phase_id).single()
        const { data: version } = phase ? await supabase.from('versions').select('project_id').eq('id', phase.version_id).single() : { data: null }
        if (version) await logActivity(supabase, userId, version.project_id, 'uat_generated', { feature: feature_name })

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ task_id: task.id, feature: feature_name, item_count: checklist_items.length }),
          }],
        }
      }

      case 'transition_phase': {
        const { phase_id, next_phase_id } = args as { phase_id: string; next_phase_id?: string }

        await supabase.from('phases').update({ status: 'completed' }).eq('id', phase_id)

        if (next_phase_id) {
          await supabase.from('phases').update({ status: 'active' }).eq('id', next_phase_id)
        }

        const { data: phase } = await supabase.from('phases').select('version_id, name').eq('id', phase_id).single()
        const { data: version } = phase ? await supabase.from('versions').select('project_id').eq('id', phase.version_id).single() : { data: null }
        if (version) await logActivity(supabase, userId, version.project_id, 'phase_transitioned', { from_phase: phase?.name })

        return { content: [{ type: 'text', text: JSON.stringify({ status: 'transitioned', phase_id, next_phase_id }) }] }
      }

      case 'add_version': {
        const { project_id, name, description } = args as { project_id: string; name: string; description?: string }

        const { count } = await supabase
          .from('versions')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project_id)

        const { data, error } = await supabase
          .from('versions')
          .insert({ project_id, name, description, order_index: count ?? 0 })
          .select()
          .single()

        if (error) throw error
        await logActivity(supabase, userId, project_id, 'version_added', { name })
        return { content: [{ type: 'text', text: JSON.stringify({ version_id: data.id, name: data.name }) }] }
      }

      case 'get_project_status': {
        const { project_id } = args as { project_id: string }

        const { data: project } = await supabase
          .from('projects')
          .select('*')
          .eq('id', project_id)
          .eq('user_id', userId)
          .single()

        if (!project) throw new Error('Project not found')

        const { data: versions } = await supabase
          .from('versions')
          .select('*, phases(*, tasks(id, status))')
          .eq('project_id', project_id)
          .order('order_index')

        const summary = versions?.map((v: { name: string; phases?: Array<{ name: string; status: string; tasks: Array<{ status: string }> }> }) => ({
          version: v.name,
          phases: v.phases?.map((p) => ({
            name: p.name,
            status: p.status,
            tasks_total: p.tasks?.length ?? 0,
            tasks_done: p.tasks?.filter((t) => t.status === 'done').length ?? 0,
          })),
        }))

        return { content: [{ type: 'text', text: JSON.stringify({ project: { id: project.id, name: project.name, status: project.status }, versions: summary }) }] }
      }

      case 'get_phase_tasks': {
        const { phase_id } = args as { phase_id: string }

        const { data: tasks } = await supabase
          .from('tasks')
          .select('*, checklist_items(*)')
          .eq('phase_id', phase_id)
          .order('order_index')

        return { content: [{ type: 'text', text: JSON.stringify({ tasks }) }] }
      }

      case 'list_projects': {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, name, status, created_at, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })

        return { content: [{ type: 'text', text: JSON.stringify({ projects }) }] }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true }
  }
}

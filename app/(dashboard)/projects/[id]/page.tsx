import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectView } from '@/components/kanban/ProjectView'
import type { Project, VersionWithPhases } from '@/types'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: versions } = await supabase
    .from('versions')
    .select('*, phases(*, tasks(*, checklist_items(*)))')
    .eq('project_id', id)
    .order('order_index')

  const processedVersions: VersionWithPhases[] = (versions ?? []).map((v) => ({
    ...v,
    phases: (v.phases ?? [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((p: { tasks?: Array<{ order_index: number }> }) => ({
        ...p,
        tasks: (p.tasks ?? []).sort((a, b) => a.order_index - b.order_index),
      })),
  }))

  return (
    <div className="h-full">
      <ProjectView
        project={project as Project}
        initialVersions={processedVersions}
      />
    </div>
  )
}

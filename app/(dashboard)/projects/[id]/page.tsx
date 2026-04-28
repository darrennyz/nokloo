import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Badge } from '@/components/ui/badge'
import type { Project, VersionWithPhases } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  planning: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  building: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  testing: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  deployed: 'bg-green-400/10 text-green-400 border-green-400/20',
}

const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea',
  planning: 'Planning',
  building: 'Building',
  testing: 'Testing',
  deployed: 'Deployed',
}

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

  // Fetch the first (most recent) active version with phases and tasks
  const { data: versions } = await supabase
    .from('versions')
    .select(`
      *,
      phases (
        *,
        tasks (
          *,
          checklist_items (*)
        )
      )
    `)
    .eq('project_id', id)
    .order('order_index')

  const proj = project as Project

  // Sort phases and tasks by order_index
  const processedVersions: VersionWithPhases[] = (versions ?? []).map((v) => ({
    ...v,
    phases: (v.phases ?? [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((p: { tasks?: Array<{ order_index: number }> }) => ({
        ...p,
        tasks: (p.tasks ?? []).sort((a, b) => a.order_index - b.order_index),
      })),
  }))

  // Show the first version by default (version selector is V2 scope)
  const activeVersion = processedVersions[0] ?? null

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="px-8 py-5 border-b border-border flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold tracking-tight">{proj.name}</h1>
            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[proj.status]}`}>
              {STATUS_LABELS[proj.status]}
            </Badge>
          </div>
          {proj.description && (
            <p className="text-sm text-muted-foreground">{proj.description}</p>
          )}
          {proj.features && proj.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {proj.features.map((f: string) => (
                <Badge key={f} variant="secondary" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {processedVersions.length > 0 && (
          <div className="text-xs text-muted-foreground flex-shrink-0">
            {processedVersions[0]?.name}
          </div>
        )}
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden">
        {activeVersion ? (
          <KanbanBoard initialVersion={activeVersion} />
        ) : (
          <div className="flex items-center justify-center h-full text-center px-8">
            <div className="max-w-sm space-y-3">
              <p className="text-sm font-medium">No phases generated yet</p>
              <p className="text-xs text-muted-foreground">
                This project is in the <strong>Idea</strong> phase. Keep chatting with Claude to refine your idea. When you&apos;re ready, tell Claude to build it and the phases will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

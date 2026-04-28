import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { ArrowLeft, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project, VersionWithPhases } from '@/types'

const STATUS_DOT: Record<string, string> = {
  idea: 'bg-amber-400', planning: 'bg-blue-400', building: 'bg-orange-400',
  testing: 'bg-violet-400', deployed: 'bg-emerald-400',
}
const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea', planning: 'Planning', building: 'Building', testing: 'Testing', deployed: 'Deployed',
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

  const { data: versions } = await supabase
    .from('versions')
    .select('*, phases(*, tasks(*, checklist_items(*)))')
    .eq('project_id', id)
    .order('order_index')

  const proj = project as Project

  const processedVersions: VersionWithPhases[] = (versions ?? []).map((v) => ({
    ...v,
    phases: (v.phases ?? [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((p: { tasks?: Array<{ order_index: number }> }) => ({
        ...p,
        tasks: (p.tasks ?? []).sort((a, b) => a.order_index - b.order_index),
      })),
  }))

  const activeVersion = processedVersions[0] ?? null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-8 py-3 md:py-4 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/projects"
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Back to projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-700 tracking-tight truncate">{proj.name}</h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[proj.status])} />
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[proj.status]}</span>
              </div>
            </div>
            {proj.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{proj.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {proj.features && proj.features.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {proj.features.slice(0, 3).map((f: string) => (
                <span key={f} className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  {f}
                </span>
              ))}
              {proj.features.length > 3 && (
                <span className="text-[11px] text-muted-foreground">+{proj.features.length - 3}</span>
              )}
            </div>
          )}
          {activeVersion && (
            <span className="text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
              {activeVersion.name}
            </span>
          )}
        </div>
      </div>

      {/* Kanban — min-h-0 is required so the flex child doesn't escape its allocation */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeVersion ? (
          <KanbanBoard initialVersion={activeVersion} />
        ) : (
          <div className="flex items-center justify-center h-full px-8">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <p className="font-display text-base font-600 tracking-tight">No phases yet</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This project is in the <strong>Idea</strong> phase. Keep refining your idea with Claude, then tell it to build — phases will appear here instantly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

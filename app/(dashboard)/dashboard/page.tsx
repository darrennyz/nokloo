import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { ArrowRight, Plus, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project, DashboardStats } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea', planning: 'Planning', building: 'Building', testing: 'Testing', deployed: 'Deployed',
}
const STATUS_DOT: Record<string, string> = {
  idea: 'bg-amber-400', planning: 'bg-blue-400', building: 'bg-orange-400',
  testing: 'bg-violet-400', deployed: 'bg-emerald-400',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]
  const stats: DashboardStats = {
    ideas:    projectList.filter((p) => p.status === 'idea').length,
    planning: projectList.filter((p) => p.status === 'planning').length,
    building: projectList.filter((p) => p.status === 'building').length,
    testing:  projectList.filter((p) => p.status === 'testing').length,
    deployed: projectList.filter((p) => p.status === 'deployed').length,
  }
  const recent = projectList.slice(0, 6)

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-10 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-700 tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your projects at a glance</p>
        </div>
        <Link href="/projects" className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 text-xs')}>
          <Plus className="h-3.5 w-3.5" />
          New project
        </Link>
      </div>

      <StatsCards data={stats} />

      {/* Recent projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent projects</h2>
          <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          /* Empty state — Claude connection prompt */
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-base font-600 tracking-tight">Connect Claude to get started</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Go to Settings, generate an API key, add the Nokloo MCP server to Claude, then describe your idea. Your project will appear here instantly.
              </p>
            </div>
            <Link href="/setup" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-xs')}>
              Connect Claude
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {recent.map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors group',
                  i !== recent.length - 1 && 'border-b border-border'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[project.status]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[11px] text-muted-foreground hidden sm:block">
                    {STATUS_LABELS[project.status]}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

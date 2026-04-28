import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project, DashboardStats } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea',
  planning: 'Planning',
  building: 'Building',
  testing: 'Testing',
  deployed: 'Deployed',
}

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  planning: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  building: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  testing: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  deployed: 'bg-green-400/10 text-green-400 border-green-400/20',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const projectList = (projects ?? []) as Project[]

  const stats: DashboardStats = {
    ideas: projectList.filter((p) => p.status === 'idea').length,
    ongoing: projectList.filter((p) => ['planning', 'building'].includes(p.status)).length,
    testing: projectList.filter((p) => p.status === 'testing').length,
    deployed: projectList.filter((p) => p.status === 'deployed').length,
  }

  const recent = projectList.slice(0, 5)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your project overview at a glance
          </p>
        </div>
        <Link href="/projects" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4 mr-1" />
          New project
        </Link>
      </div>

      <StatsCards data={stats} />

      {/* Recent projects */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent projects</CardTitle>
          <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center">
            View all <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm mb-3">No projects yet.</p>
              <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                Tell Claude about your idea and it will push the project structure here automatically. Or create one manually from Projects.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between py-3 hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[project.status]}`}
                    >
                      {STATUS_LABELS[project.status]}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claude connection hint */}
      {projectList.length === 0 && (
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm font-medium">Connect Claude to Nokloo</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Go to <strong>Settings</strong> to generate your API key, then add the Nokloo MCP server to your Claude config. After that, just describe your idea to Claude and watch your project appear here.
            </p>
            <Link href="/settings" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Go to Settings
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Plus, Lightbulb, Hammer, FlaskConical, Rocket, PenLine, Zap } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Project } from '@/types'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; dot: string; bg: string; text: string }> = {
  idea:     { label: 'Idea',     icon: Lightbulb, dot: 'bg-amber-400',   bg: 'bg-amber-400/10',   text: 'text-amber-500' },
  planning: { label: 'Planning', icon: PenLine,   dot: 'bg-blue-400',    bg: 'bg-blue-400/10',    text: 'text-blue-500' },
  building: { label: 'Building', icon: Hammer,    dot: 'bg-orange-400',  bg: 'bg-orange-400/10',  text: 'text-orange-500' },
  testing:  { label: 'Testing',  icon: FlaskConical, dot: 'bg-violet-400', bg: 'bg-violet-400/10', text: 'text-violet-500' },
  deployed: { label: 'Deployed', icon: Rocket,    dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-500' },
}

interface ProjectListProps {
  initialProjects: Project[]
  userId: string
}

export function ProjectList({ initialProjects, userId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: name.trim(), description: description.trim() || null })
      .select()
      .single()
    if (error) { toast.error('Failed to create project'); setCreating(false); return }
    setProjects((prev) => [data as Project, ...prev])
    setDialogOpen(false)
    setName('')
    setDescription('')
    setCreating(false)
    toast.success('Project created')
  }

  return (
    <>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-700 tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-14 text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <p className="font-display text-base font-600 tracking-tight">No projects yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Projects appear here automatically when Claude pushes them via MCP, or create one manually.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create manually
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const meta = STATUS_META[project.status] ?? STATUS_META.idea
              const StatusIcon = meta.icon
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:bg-card/80 transition-all duration-150 cursor-pointer group h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                        <StatusIcon className={cn('h-3.5 w-3.5', meta.text)} />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors mt-0.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors leading-snug">
                        {project.name}
                      </p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                        <span className="text-[11px] text-muted-foreground">{meta.label}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(project.updated_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">New project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name" className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My project" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc" className="text-xs text-muted-foreground uppercase tracking-wider">
                Description <span className="normal-case">(optional)</span>
              </Label>
              <Textarea id="proj-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you building?" className="resize-none text-sm" rows={3} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? 'Creating…' : 'Create project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

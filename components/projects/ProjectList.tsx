'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, Lightbulb, Hammer, FlaskConical, Rocket, PenLine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Project } from '@/types'

const STATUS_ICONS = {
  idea: Lightbulb,
  planning: PenLine,
  building: Hammer,
  testing: FlaskConical,
  deployed: Rocket,
}

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
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New project
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="border-dashed border-border bg-card/50">
            <CardContent className="py-16 text-center space-y-3">
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Projects are created automatically when you tell Claude about your idea, or you can create one manually.
              </p>
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create manually
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const StatusIcon = STATUS_ICONS[project.status] ?? Lightbulb
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="border-border bg-card hover:border-primary/40 transition-colors cursor-pointer group h-full">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${STATUS_COLORS[project.status].split(' ').find(c => c.startsWith('bg-'))}`}>
                          <StatusIcon className={`h-4 w-4 ${STATUS_COLORS[project.status].split(' ').find(c => c.startsWith('text-'))}`} />
                        </div>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-1">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name">Name</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My project"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-desc">Description <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you building?"
                className="resize-none"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

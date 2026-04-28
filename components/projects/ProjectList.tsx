'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Plus, Lightbulb, Hammer, FlaskConical, Rocket, PenLine, Zap, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Project } from '@/types'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; dot: string; bg: string; text: string }> = {
  idea:     { label: 'Idea',     icon: Lightbulb,     dot: 'bg-amber-400',   bg: 'bg-amber-400/10',   text: 'text-amber-500' },
  planning: { label: 'Planning', icon: PenLine,        dot: 'bg-blue-400',    bg: 'bg-blue-400/10',    text: 'text-blue-500' },
  building: { label: 'Building', icon: Hammer,         dot: 'bg-orange-400',  bg: 'bg-orange-400/10',  text: 'text-orange-500' },
  testing:  { label: 'Testing',  icon: FlaskConical,   dot: 'bg-violet-400',  bg: 'bg-violet-400/10',  text: 'text-violet-500' },
  deployed: { label: 'Deployed', icon: Rocket,         dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-500' },
}

interface ProjectListProps {
  initialProjects: Project[]
  userId: string
}

export function ProjectList({ initialProjects, userId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openEdit(project: Project) {
    setEditProject(project)
    setEditName(project.name)
    setEditDesc(project.description ?? '')
    setEditStatus(project.status)
    setEditOpen(true)
  }

  function openDelete(project: Project) {
    setDeleteProject(project)
    setDeleteOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name: createName.trim(), description: createDesc.trim() || null })
      .select()
      .single()
    if (error) { toast.error('Failed to create project'); setCreating(false); return }
    setProjects((prev) => [data as Project, ...prev])
    setCreateOpen(false)
    setCreateName('')
    setCreateDesc('')
    setCreating(false)
    toast.success('Project created')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editProject || !editName.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .update({ name: editName.trim(), description: editDesc.trim() || null, status: editStatus })
      .eq('id', editProject.id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) { toast.error('Failed to save changes'); setSaving(false); return }
    setProjects((prev) => prev.map((p) => p.id === editProject.id ? data as Project : p))
    setEditOpen(false)
    setSaving(false)
    toast.success('Project updated')
  }

  async function handleDelete() {
    if (!deleteProject) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', deleteProject.id)
      .eq('user_id', userId)
    if (error) { toast.error('Failed to delete project'); setDeleting(false); return }
    setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id))
    setDeleteOpen(false)
    setDeleting(false)
    toast.success(`"${deleteProject.name}" deleted`)
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
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 text-xs">
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
            <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)} className="text-xs gap-1.5">
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
                <div key={project.id} className="relative group">
                  <Link href={`/projects/${project.id}`}>
                    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:bg-card/80 transition-all duration-150 cursor-pointer h-full flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                          <StatusIcon className={cn('h-3.5 w-3.5', meta.text)} />
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors mt-0.5 mr-5" />
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

                  {/* Actions menu — sits above the Link */}
                  <div
                    className="absolute top-3 right-3 z-10"
                    onClick={(e) => e.preventDefault()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="gap-2 text-xs cursor-pointer"
                          onSelect={() => openEdit(project)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-xs cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                          onSelect={() => openDelete(project)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">New project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name" className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input id="proj-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="My project" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc" className="text-xs text-muted-foreground uppercase tracking-wider">
                Description <span className="normal-case">(optional)</span>
              </Label>
              <Textarea id="proj-desc" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="What are you building?" className="resize-none text-sm" rows={3} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={creating}>
                {creating ? 'Creating…' : 'Create project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Edit project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Project name" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Description <span className="normal-case">(optional)</span>
              </Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="What are you building?" className="resize-none text-sm" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(STATUS_META).map(([value, meta]) => {
                  const Icon = meta.icon
                  const active = editStatus === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditStatus(value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-all',
                        active
                          ? `border-primary/40 ${meta.bg}`
                          : 'border-border hover:border-border hover:bg-accent'
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', active ? meta.text : 'text-muted-foreground')} />
                      <span className={cn('text-[10px] font-medium leading-none', active ? meta.text : 'text-muted-foreground')}>
                        {meta.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Delete project?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deleteProject?.name}</span> and all its phases, tasks, and history will be permanently deleted.
            </p>
            <p className="text-xs text-muted-foreground">This cannot be undone.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? 'Deleting…' : 'Delete project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

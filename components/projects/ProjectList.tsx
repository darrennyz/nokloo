'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight, Plus, Lightbulb, Hammer, FlaskConical, Rocket,
  PenLine, Zap, MoreHorizontal, Pencil, Archive, Trash2, ArchiveRestore,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Project } from '@/types'

const STATUS_META: Record<string, { label: string; icon: React.ElementType; dot: string; bg: string; text: string }> = {
  idea:     { label: 'Idea',     icon: Lightbulb,   dot: 'bg-amber-400',   bg: 'bg-amber-400/10',   text: 'text-amber-500' },
  planning: { label: 'Planning', icon: PenLine,      dot: 'bg-blue-400',    bg: 'bg-blue-400/10',    text: 'text-blue-500' },
  building: { label: 'Building', icon: Hammer,       dot: 'bg-orange-400',  bg: 'bg-orange-400/10',  text: 'text-orange-500' },
  testing:  { label: 'Testing',  icon: FlaskConical, dot: 'bg-violet-400',  bg: 'bg-violet-400/10',  text: 'text-violet-500' },
  deployed: { label: 'Deployed', icon: Rocket,       dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-500' },
}

interface ProjectListProps {
  initialProjects: Project[]
  initialArchived: Project[]
  userId: string
}

export function ProjectList({ initialProjects, initialArchived, userId }: ProjectListProps) {
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [archived, setArchived] = useState<Project[]>(initialArchived)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit
  const [editOpen, setEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete permanently
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

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() || null }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create project'); setCreating(false); return }
    setProjects((prev) => [data.project as Project, ...prev])
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
    const res = await fetch(`/api/projects/${editProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null, status: editStatus }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to save changes'); setSaving(false); return }
    setProjects((prev) => prev.map((p) => p.id === editProject.id ? data.project as Project : p))
    setEditOpen(false)
    setSaving(false)
    toast.success('Project updated')
  }

  async function handleArchive(project: Project) {
    const archivedAt = new Date().toISOString()
    // Optimistic update
    setProjects((prev) => prev.filter((p) => p.id !== project.id))
    setArchived((prev) => [{ ...project, archived_at: archivedAt }, ...prev])

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived_at: archivedAt }),
    })
    if (!res.ok) {
      // Rollback
      setProjects((prev) => [project, ...prev])
      setArchived((prev) => prev.filter((p) => p.id !== project.id))
      toast.error('Failed to archive project')
      return
    }
    toast.success(`"${project.name}" archived`, {
      action: { label: 'Undo', onClick: () => handleRestore({ ...project, archived_at: archivedAt }) },
    })
  }

  async function handleRestore(project: Project) {
    // Optimistic update
    setArchived((prev) => prev.filter((p) => p.id !== project.id))
    setProjects((prev) => [{ ...project, archived_at: null }, ...prev])

    const res = await fetch(`/api/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived_at: null }),
    })
    if (!res.ok) {
      // Rollback
      setArchived((prev) => [project, ...prev])
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      toast.error('Failed to restore project')
      return
    }
    toast.success(`"${project.name}" restored`)
  }

  async function handleDeletePermanently() {
    if (!deleteProject) return
    setDeleting(true)
    const res = await fetch(`/api/projects/${deleteProject.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to delete')
      setDeleting(false)
      return
    }
    setArchived((prev) => prev.filter((p) => p.id !== deleteProject.id))
    setDeleteOpen(false)
    setDeleting(false)
    toast.success(`"${deleteProject.name}" permanently deleted`)
  }

  // ── Render helpers ───────────────────────────────────────────────────────

  function ProjectCard({ project, isArchived }: { project: Project; isArchived: boolean }) {
    const meta = STATUS_META[project.status] ?? STATUS_META.idea
    const StatusIcon = meta.icon

    return (
      <div className="relative group">
        <Link href={isArchived ? '#' : `/projects/${project.id}`} onClick={isArchived ? (e) => e.preventDefault() : undefined}>
          <div className={cn(
            'rounded-xl border border-border bg-card p-5 transition-all duration-150 h-full flex flex-col',
            !isArchived && 'hover:border-primary/30 hover:bg-card/80 cursor-pointer',
            isArchived && 'opacity-60 cursor-default'
          )}>
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                <StatusIcon className={cn('h-3.5 w-3.5', meta.text)} />
              </div>
              {!isArchived && (
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors mt-0.5 mr-5" />
              )}
              {isArchived && <div className="w-5 mr-5" />}
            </div>
            <div className="flex-1 space-y-1">
              <p className={cn('text-sm font-semibold tracking-tight leading-snug', !isArchived && 'group-hover:text-primary transition-colors')}>
                {project.name}
              </p>
              {project.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{project.description}</p>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                <span className="text-[11px] text-muted-foreground">{meta.label}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {isArchived && project.archived_at
                  ? `Archived ${new Date(project.archived_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
                  : new Date(project.updated_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </Link>

        {/* Actions menu */}
        <div className="absolute top-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {!isArchived ? (
                <>
                  <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onSelect={() => openEdit(project)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onSelect={() => handleArchive(project)}>
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="gap-2 text-xs cursor-pointer" onSelect={() => handleRestore(project)}>
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-xs cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                    onSelect={() => { setDeleteProject(project); setDeleteOpen(true) }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  const activeCount = projects.length
  const archivedCount = archived.length

  return (
    <>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-700 tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeCount} active{archivedCount > 0 ? `, ${archivedCount} archived` : ''}
            </p>
          </div>
          {tab === 'active' && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              New project
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {[
            { key: 'active', label: 'Active', count: activeCount },
            { key: 'archived', label: 'Archived', count: archivedCount },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key as 'active' | 'archived')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px flex items-center gap-2',
                tab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn(
                  'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                  tab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active projects */}
        {tab === 'active' && (
          projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-14 text-center space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <p className="font-display text-base font-600 tracking-tight">No active projects</p>
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
              {projects.map((p) => <ProjectCard key={p.id} project={p} isArchived={false} />)}
            </div>
          )
        )}

        {/* Archived projects */}
        {tab === 'archived' && (
          archived.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-14 text-center space-y-3">
              <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">No archived projects</p>
                <p className="text-xs text-muted-foreground/60">Archived projects appear here before permanent deletion.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Archive className="h-3.5 w-3.5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">
                  Archived projects are hidden from your dashboard. Restore or permanently delete them below.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map((p) => <ProjectCard key={p.id} project={p} isArchived={true} />)}
              </div>
            </div>
          )
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
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="My project" required className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Description <span className="normal-case">(optional)</span>
              </Label>
              <Textarea value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} placeholder="What are you building?" className="resize-none text-sm" rows={3} />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={creating}>{creating ? 'Creating…' : 'Create project'}</Button>
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
                    <button key={value} type="button" onClick={() => setEditStatus(value)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-center transition-all',
                        active ? `border-primary/40 ${meta.bg}` : 'border-border hover:bg-accent'
                      )}>
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
              <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permanent delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Delete permanently?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deleteProject?.name}</span> and all its phases, tasks, and history will be gone forever.
            </p>
            <p className="text-xs text-muted-foreground">This cannot be undone. Restore the project instead if you might need it later.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
            <Button size="sm" disabled={deleting} onClick={handleDeletePermanently}
              className="bg-red-500 hover:bg-red-600 text-white border-0">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? 'Deleting…' : 'Delete forever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

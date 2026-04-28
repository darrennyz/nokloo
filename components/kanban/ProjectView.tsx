'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Zap, GitBranch } from 'lucide-react'
import { KanbanBoard } from './KanbanBoard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Project, VersionWithPhases } from '@/types'

const STATUS_DOT: Record<string, string> = {
  idea: 'bg-amber-400', planning: 'bg-blue-400', building: 'bg-orange-400',
  testing: 'bg-violet-400', deployed: 'bg-emerald-400',
}
const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea', planning: 'Planning', building: 'Building', testing: 'Testing', deployed: 'Deployed',
}

interface ProjectViewProps {
  project: Project
  initialVersions: VersionWithPhases[]
}

export function ProjectView({ project, initialVersions }: ProjectViewProps) {
  const [versions, setVersions] = useState<VersionWithPhases[]>(initialVersions)
  const [selectedId, setSelectedId] = useState<string | null>(initialVersions[0]?.id ?? null)
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  const selectedVersion = versions.find((v) => v.id === selectedId) ?? versions[0] ?? null

  async function handleCreateVersion(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('versions')
      .insert({
        project_id: project.id,
        name: newName.trim(),
        description: newDesc.trim() || null,
        order_index: versions.length,
        status: 'active',
      })
      .select()
      .single()
    if (error) { toast.error(error.message); setCreating(false); return }
    const newVersion: VersionWithPhases = { ...data, phases: [] }
    setVersions((prev) => [...prev, newVersion])
    setSelectedId(newVersion.id)
    setNewOpen(false)
    setNewName('')
    setNewDesc('')
    setCreating(false)
    toast.success(`"${newVersion.name}" created — ask Claude to set up phases`)
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="border-b border-border shrink-0">

        {/* Row 1: back + project name + status + features */}
        <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-3">
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
                <h1 className="font-display text-lg font-700 tracking-tight truncate">{project.name}</h1>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[project.status])} />
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[project.status]}</span>
                </div>
              </div>
              {project.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
              )}
            </div>
          </div>

          {project.features && project.features.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              {project.features.slice(0, 3).map((f: string) => (
                <span key={f} className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                  {f}
                </span>
              ))}
              {project.features.length > 3 && (
                <span className="text-[11px] text-muted-foreground">+{project.features.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Row 2: version tabs */}
        <div className="px-4 md:px-8 pb-0 flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {versions.map((v) => {
            const isSelected = v.id === selectedId
            return (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap',
                  isSelected
                    ? 'border-primary text-foreground bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <GitBranch className="h-3 w-3 shrink-0" />
                {v.name}
                {v.status === 'completed' && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </button>
            )
          })}

          {/* New version button */}
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground/60 hover:text-muted-foreground border-b-2 border-transparent hover:bg-accent/50 rounded-t-lg transition-all whitespace-nowrap"
          >
            <Plus className="h-3 w-3" />
            New version
          </button>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {versions.length === 0 ? (
          <div className="flex items-center justify-center h-full px-8">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1.5">
                <p className="font-display text-base font-600 tracking-tight">No versions yet</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Create a version to get started, or ask Claude to build your project — it will create phases automatically.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNewOpen(true)} className="text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create version
              </Button>
            </div>
          </div>
        ) : selectedVersion ? (
          <KanbanBoard key={selectedVersion.id} initialVersion={selectedVersion} />
        ) : null}
      </div>

      {/* ── New version dialog ── */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">New version</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateVersion} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Version name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. V1.1 — Token optimisation"
                required
                className="h-9"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Description <span className="normal-case">(optional)</span>
              </Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="What's changing in this version?"
                className="resize-none text-sm"
                rows={2}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The new version starts empty. Ask Claude to set up phases, or add them manually later.
            </p>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={creating || !newName.trim()}>
                {creating ? 'Creating…' : 'Create version'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Task, TaskStatus, ChecklistItem } from '@/types'

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo:        'bg-muted/60 text-muted-foreground',
  in_progress: 'bg-blue-500/10 text-blue-500',
  done:        'bg-emerald-500/10 text-emerald-500',
  blocked:     'bg-red-500/10 text-red-500',
}
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do', in_progress: 'In progress', done: 'Done', blocked: 'Blocked',
}

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onClose: () => void
  onUpdate: (task: Task) => void
}

export function TaskDetailPanel({ task, open, onClose, onUpdate }: TaskDetailPanelProps) {
  const [notes, setNotes] = useState('')
  const [description, setDescription] = useState('')
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setNotes(task.notes ?? '')
      setDescription(task.description ?? '')
      setChecklistItems(task.checklist_items ?? [])
    }
  }, [task?.id])

  async function handleSave() {
    if (!task) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ notes, description }).eq('id', task.id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    onUpdate({ ...task, notes, description })
    setSaving(false)
    toast.success('Saved')
  }

  async function handleChecklistToggle(item: ChecklistItem) {
    const newChecked = !item.checked
    // Optimistic
    setChecklistItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: newChecked } : i))
    const supabase = createClient()
    const { error } = await supabase.from('checklist_items').update({ checked: newChecked }).eq('id', item.id)
    if (error) {
      setChecklistItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: item.checked } : i))
      toast.error('Failed to update')
    }
  }

  if (!task) return null

  const checkedCount = checklistItems.filter((i) => i.checked).length

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md bg-card border-l border-border flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-[15px] font-600 tracking-tight leading-snug">{task.title}</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors shrink-0">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_STYLES[task.status])}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context…"
              className="text-sm resize-none min-h-[72px] bg-background/50"
            />
          </div>

          {/* UAT Checklist */}
          {checklistItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">UAT Checklist</label>
                <span className="text-[11px] text-muted-foreground">{checkedCount}/{checklistItems.length}</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${checklistItems.length ? (checkedCount / checklistItems.length) * 100 : 0}%` }}
                />
              </div>
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => handleChecklistToggle(item)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={item.id}
                      className={cn('text-sm leading-snug cursor-pointer select-none', item.checked && 'line-through text-muted-foreground')}
                    >
                      {item.item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Links, decisions, context…"
              className="text-sm resize-none min-h-[100px] bg-background/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

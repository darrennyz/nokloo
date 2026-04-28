'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Task, TaskStatus, ChecklistItem } from '@/types'

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
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
  }, [task])

  async function handleSave() {
    if (!task) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ notes, description })
      .eq('id', task.id)

    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Saved')
    onUpdate({ ...task, notes, description })
    setSaving(false)
  }

  async function handleChecklistToggle(item: ChecklistItem) {
    const supabase = createClient()
    const newChecked = !item.checked
    const { error } = await supabase
      .from('checklist_items')
      .update({ checked: newChecked })
      .eq('id', item.id)

    if (error) { toast.error('Failed to update'); return }

    setChecklistItems((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, checked: newChecked } : i)
    )
  }

  if (!task) return null

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <SheetTitle className="text-base font-semibold leading-snug text-left">
              {task.title}
            </SheetTitle>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors mt-0.5">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <Badge
            variant="outline"
            className="w-fit text-xs mt-1"
          >
            {STATUS_LABELS[task.status]}
          </Badge>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              className="text-sm resize-none min-h-[80px]"
            />
          </div>

          {/* Checklist (UAT) */}
          {checklistItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    UAT Checklist
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {checklistItems.filter((i) => i.checked).length}/{checklistItems.length}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${checklistItems.length ? (checklistItems.filter(i => i.checked).length / checklistItems.length) * 100 : 0}%`,
                    }}
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
                        className={cn(
                          'text-sm leading-snug cursor-pointer',
                          item.checked && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes, links, or context…"
              className="text-sm resize-none min-h-[120px]"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

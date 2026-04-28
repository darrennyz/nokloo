'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TaskCard } from './TaskCard'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Phase, Task, TaskStatus } from '@/types'

const PHASE_ICONS = {
  pending:   Circle,
  active:    Clock,
  completed: CheckCircle2,
}
const PHASE_COLORS = {
  pending:   'text-muted-foreground/40',
  active:    'text-primary',
  completed: 'text-emerald-500',
}
const HEADER_COLORS = {
  pending:   'opacity-50',
  active:    '',
  completed: '',
}

interface PhaseColumnProps {
  phase: Phase
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskAdded: (task: Task) => void
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void
}

export function PhaseColumn({ phase, tasks, onTaskClick, onTaskAdded, onTaskStatusChange }: PhaseColumnProps) {
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const StatusIcon = PHASE_ICONS[phase.status]
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const progress = tasks.length ? (doneCount / tasks.length) * 100 : 0

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return
    setSubmitting(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ phase_id: phase.id, title, order_index: tasks.length })
      .select()
      .single()

    if (error) { toast.error('Failed to add task'); setSubmitting(false); return }
    onTaskAdded(data as Task)
    setNewTaskTitle('')
    setAddingTask(false)
    setSubmitting(false)
  }

  return (
    <div className={cn('flex flex-col w-56 md:w-64 shrink-0 h-full', HEADER_COLORS[phase.status])}>
      {/* Column header — fixed, doesn't scroll */}
      <div className="flex items-center justify-between mb-2.5 px-0.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={cn('h-3.5 w-3.5 shrink-0', PHASE_COLORS[phase.status])} />
          <span className="text-[13px] font-semibold truncate tracking-tight">{phase.name}</span>
          <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-1.5 py-0 shrink-0">
            {tasks.length}
          </span>
        </div>
        {tasks.length > 0 && (
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{doneCount}/{tasks.length}</span>
        )}
      </div>

      {/* Progress bar — fixed */}
      {tasks.length > 0 && (
        <div className="h-px bg-border rounded-full mb-3 overflow-hidden shrink-0">
          <div
            className={cn('h-full rounded-full transition-all duration-500', phase.status === 'completed' ? 'bg-emerald-500' : 'bg-primary')}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Cards — scrollable, takes remaining height */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 pr-0.5
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:transparent
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-border">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onStatusChange={onTaskStatusChange}
          />
        ))}

        {/* Add task */}
        {addingTask ? (
          <form onSubmit={handleAddTask} className="space-y-2 shrink-0">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title…"
              className="h-8 text-sm bg-card"
              onKeyDown={(e) => e.key === 'Escape' && setAddingTask(false)}
            />
            <div className="flex gap-1.5">
              <Button type="submit" size="sm" className="h-7 text-xs px-2.5" disabled={submitting}>Add</Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2.5"
                onClick={() => { setAddingTask(false); setNewTaskTitle('') }}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1 px-0.5 w-fit shrink-0"
          >
            <Plus className="h-3 w-3" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TaskCard } from './TaskCard'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Phase, Task, TaskStatus } from '@/types'

const PHASE_STATUS_ICONS = {
  pending: Circle,
  active: Clock,
  completed: CheckCircle2,
}

const PHASE_STATUS_COLORS = {
  pending: 'text-muted-foreground',
  active: 'text-blue-400',
  completed: 'text-green-400',
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

  const StatusIcon = PHASE_STATUS_ICONS[phase.status]
  const doneCount = tasks.filter((t) => t.status === 'done').length

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    setSubmitting(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        phase_id: phase.id,
        title: newTaskTitle.trim(),
        order_index: tasks.length,
      })
      .select()
      .single()

    if (error) { toast.error('Failed to add task'); setSubmitting(false); return }

    onTaskAdded(data as Task)
    setNewTaskTitle('')
    setAddingTask(false)
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Phase header */}
      <div className={cn(
        'flex items-center justify-between mb-3 px-1',
        phase.status === 'pending' && 'opacity-50'
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={cn('h-4 w-4 flex-shrink-0', PHASE_STATUS_COLORS[phase.status])} />
          <span className="text-sm font-semibold truncate">{phase.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1 flex-shrink-0">
            {tasks.length}
          </Badge>
        </div>
        {tasks.length > 0 && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {doneCount}/{tasks.length}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="h-0.5 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              phase.status === 'completed' ? 'bg-green-400' : 'bg-primary'
            )}
            style={{ width: `${(doneCount / tasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* Task cards */}
      <div className="flex flex-col gap-2 flex-1">
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
          <form onSubmit={handleAddTask} className="space-y-2">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title…"
              className="text-sm h-8"
              onKeyDown={(e) => e.key === 'Escape' && setAddingTask(false)}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="h-7 text-xs" disabled={submitting}>
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => { setAddingTask(false); setNewTaskTitle('') }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}

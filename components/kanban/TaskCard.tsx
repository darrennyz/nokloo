'use client'

import { useState } from 'react'
import { CheckSquare2, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Task, TaskStatus } from '@/types'

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo:        'text-muted-foreground/60 bg-muted/40 border-transparent',
  in_progress: 'text-blue-500 bg-blue-500/8 border-blue-500/15',
  done:        'text-emerald-500 bg-emerald-500/8 border-emerald-500/15',
  blocked:     'text-red-500 bg-red-500/8 border-red-500/15',
}
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do', in_progress: 'In progress', done: 'Done', blocked: 'Blocked',
}

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function TaskCard({ task, onClick, onStatusChange }: TaskCardProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const checklistCount = task.checklist_items?.length ?? 0
  const checkedCount = task.checklist_items?.filter((i) => i.checked).length ?? 0

  async function handleStatusChange(newStatus: TaskStatus) {
    // Optimistic update — instant
    setStatus(newStatus)
    onStatusChange(task.id, newStatus)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (error) {
      // Revert on failure
      setStatus(task.status)
      onStatusChange(task.id, task.status)
      toast.error('Failed to update')
    }
  }

  return (
    <div
      onClick={() => onClick({ ...task, status })}
      className={cn(
        'group relative bg-card border border-border rounded-lg p-3 cursor-pointer',
        'hover:border-border/80 hover:shadow-sm transition-all duration-100',
        status === 'done' && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn(
          'text-[13px] font-medium leading-snug flex-1',
          status === 'done' && 'line-through text-muted-foreground'
        )}>
          {task.title}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-0.5 rounded hover:bg-muted mt-0.5"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={(e) => { e.stopPropagation(); handleStatusChange(s) }}
                className={cn('text-xs', status === s && 'font-semibold text-primary')}
              >
                {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        {/* Status pill */}
        <span className={cn(
          'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
          STATUS_STYLES[status]
        )}>
          {STATUS_LABELS[status]}
        </span>

        {/* Checklist progress */}
        {checklistCount > 0 && (
          <div className="flex items-center gap-1 ml-auto">
            <CheckSquare2 className="h-3 w-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground">{checkedCount}/{checklistCount}</span>
          </div>
        )}
      </div>

      {/* Checklist progress bar */}
      {checklistCount > 0 && (
        <div className="mt-2 h-0.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(checkedCount / checklistCount) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}

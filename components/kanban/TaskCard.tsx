'use client'

import { useState } from 'react'
import { CheckSquare2, GripVertical, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Task, TaskStatus } from '@/types'

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  done: 'bg-green-400/10 text-green-400 border-green-400/20',
  blocked: 'bg-red-400/10 text-red-400 border-red-400/20',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
}

interface TaskCardProps {
  task: Task
  onClick: (task: Task) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function TaskCard({ task, onClick, onStatusChange }: TaskCardProps) {
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status)
  const checklistCount = task.checklist_items?.length ?? 0
  const checkedCount = task.checklist_items?.filter((i) => i.checked).length ?? 0

  async function handleStatusChange(status: TaskStatus) {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ status }).eq('id', task.id)
    if (error) { toast.error('Failed to update status'); return }
    setCurrentStatus(status)
    onStatusChange(task.id, status)
  }

  return (
    <div
      className="group bg-card border border-border rounded-md p-3 cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium leading-snug', currentStatus === 'done' && 'line-through text-muted-foreground')}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}
            {checklistCount > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <CheckSquare2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {checkedCount}/{checklistCount}
                </span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${checklistCount ? (checkedCount / checklistCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={(e) => { e.stopPropagation(); handleStatusChange(s) }}
                className={cn('text-xs', currentStatus === s && 'font-semibold')}
              >
                {STATUS_LABELS[s]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-2">
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', STATUS_STYLES[currentStatus])}>
          {STATUS_LABELS[currentStatus]}
        </Badge>
      </div>
    </div>
  )
}

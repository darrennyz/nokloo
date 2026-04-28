'use client'

import { useState, useEffect, useCallback } from 'react'
import { PhaseColumn } from './PhaseColumn'
import { TaskDetailPanel } from './TaskDetailPanel'
import { createClient } from '@/lib/supabase/client'
import type { Phase, Task, TaskStatus, VersionWithPhases } from '@/types'

interface KanbanBoardProps {
  initialVersion: VersionWithPhases
}

type PhaseTaskMap = Record<string, Task[]>

export function KanbanBoard({ initialVersion }: KanbanBoardProps) {
  const [phases, setPhases] = useState<Phase[]>(initialVersion.phases)
  const [taskMap, setTaskMap] = useState<PhaseTaskMap>(() => {
    const map: PhaseTaskMap = {}
    initialVersion.phases.forEach((p) => { map[p.id] = p.tasks ?? [] })
    return map
  })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Real-time subscriptions
  useEffect(() => {
    const supabase = createClient()
    const phaseIds = phases.map((p) => p.id)

    // Subscribe to task changes in this version's phases
    const taskChannel = supabase
      .channel(`tasks:${initialVersion.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `phase_id=in.(${phaseIds.join(',')})` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task
            // Fetch checklist items if any
            const { data: items } = await supabase
              .from('checklist_items')
              .select('*')
              .eq('task_id', newTask.id)
              .order('order_index')
            const task = { ...newTask, checklist_items: items ?? [] }
            setTaskMap((prev) => ({
              ...prev,
              [task.phase_id]: [...(prev[task.phase_id] ?? []), task],
            }))
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task
            setTaskMap((prev) => ({
              ...prev,
              [updatedTask.phase_id]: (prev[updatedTask.phase_id] ?? []).map((t) =>
                t.id === updatedTask.id ? { ...t, ...updatedTask } : t
              ),
            }))
          } else if (payload.eventType === 'DELETE') {
            const deletedTask = payload.old as Task
            setTaskMap((prev) => ({
              ...prev,
              [deletedTask.phase_id]: (prev[deletedTask.phase_id] ?? []).filter((t) => t.id !== deletedTask.id),
            }))
          }
        }
      )
      .subscribe()

    // Subscribe to phase changes
    const phaseChannel = supabase
      .channel(`phases:${initialVersion.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'phases', filter: `version_id=eq.${initialVersion.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPhase = payload.new as Phase
            setPhases((prev) => [...prev, newPhase].sort((a, b) => a.order_index - b.order_index))
            setTaskMap((prev) => ({ ...prev, [newPhase.id]: [] }))
          } else if (payload.eventType === 'UPDATE') {
            const updatedPhase = payload.new as Phase
            setPhases((prev) => prev.map((p) => p.id === updatedPhase.id ? updatedPhase : p))
          }
        }
      )
      .subscribe()

    // Subscribe to checklist item changes
    const checklistChannel = supabase
      .channel(`checklist:${initialVersion.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'checklist_items' },
        (payload) => {
          const updated = payload.new as { id: string; task_id: string; checked: boolean }
          setTaskMap((prev) => {
            const newMap = { ...prev }
            for (const phaseId of Object.keys(newMap)) {
              newMap[phaseId] = newMap[phaseId].map((task) => {
                if (task.id === updated.task_id) {
                  return {
                    ...task,
                    checklist_items: task.checklist_items?.map((ci) =>
                      ci.id === updated.id ? { ...ci, checked: updated.checked } : ci
                    ),
                  }
                }
                return task
              })
            }
            return newMap
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(phaseChannel)
      supabase.removeChannel(checklistChannel)
    }
  }, [initialVersion.id, phases])

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setPanelOpen(true)
  }, [])

  const handleTaskAdded = useCallback((task: Task) => {
    setTaskMap((prev) => ({
      ...prev,
      [task.phase_id]: [...(prev[task.phase_id] ?? []), task],
    }))
  }, [])

  const handleTaskStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    setTaskMap((prev) => {
      const newMap = { ...prev }
      for (const phaseId of Object.keys(newMap)) {
        newMap[phaseId] = newMap[phaseId].map((t) => t.id === taskId ? { ...t, status } : t)
      }
      return newMap
    })
  }, [])

  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTaskMap((prev) => ({
      ...prev,
      [updatedTask.phase_id]: (prev[updatedTask.phase_id] ?? []).map((t) =>
        t.id === updatedTask.id ? updatedTask : t
      ),
    }))
    setSelectedTask(updatedTask)
  }, [])

  if (phases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-center">
        <div>
          <p className="text-muted-foreground text-sm mb-2">No phases yet</p>
          <p className="text-muted-foreground text-xs max-w-xs">
            Tell Claude you&apos;re ready to build and it will generate the best-practice phases for your project type.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-5 overflow-x-auto pb-6 px-8 pt-4">
        {phases
          .sort((a, b) => a.order_index - b.order_index)
          .map((phase) => (
            <PhaseColumn
              key={phase.id}
              phase={phase}
              tasks={taskMap[phase.id] ?? []}
              onTaskClick={handleTaskClick}
              onTaskAdded={handleTaskAdded}
              onTaskStatusChange={handleTaskStatusChange}
            />
          ))}
      </div>

      <TaskDetailPanel
        task={selectedTask}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUpdate={handleTaskUpdate}
      />
    </>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Keep a ref to current phases so the auto-activation effect always has fresh data
  const phasesRef = useRef<Phase[]>(phases)
  useEffect(() => { phasesRef.current = phases }, [phases])

  // ── Phase auto-activation ────────────────────────────────────────────────
  // Rules:
  //   • any task in_progress  → phase becomes active
  //   • all tasks done        → phase becomes completed; next pending phase activates
  //   • otherwise             → phase becomes pending
  //   • multiple phases can be active simultaneously
  function computePhaseStatus(tasks: Task[]): Phase['status'] {
    if (tasks.length === 0) return 'pending'
    if (tasks.every((t) => t.status === 'done')) return 'completed'
    if (tasks.some((t) => t.status === 'in_progress')) return 'active'
    return 'pending'
  }

  useEffect(() => {
    const currentPhases = phasesRef.current
    if (currentPhases.length === 0) return

    const supabase = createClient()
    const updates: Array<{ id: string; newStatus: Phase['status'] }> = []

    for (const phase of currentPhases) {
      const tasks = taskMap[phase.id] ?? []
      const computed = computePhaseStatus(tasks)
      if (computed !== phase.status) {
        updates.push({ id: phase.id, newStatus: computed })
      }
    }

    if (updates.length === 0) return

    // Which phases are transitioning to completed right now?
    const newlyCompleted = new Set(
      updates.filter((u) => u.newStatus === 'completed').map((u) => u.id)
    )

    // Apply all status changes
    for (const { id, newStatus } of updates) {
      supabase.from('phases').update({ status: newStatus }).eq('id', id).then(({ error }) => {
        if (!error) {
          setPhases((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p))
        }
      })
    }

    // For each newly completed phase, activate its next pending successor
    if (newlyCompleted.size > 0) {
      const sorted = [...currentPhases].sort((a, b) => a.order_index - b.order_index)
      for (let i = 0; i < sorted.length; i++) {
        if (!newlyCompleted.has(sorted[i].id)) continue
        // Walk forward to find the first phase that isn't already active/completed
        for (let j = i + 1; j < sorted.length; j++) {
          const next = sorted[j]
          // Check both current DB status and any pending update we just scheduled
          const pendingNewStatus = updates.find((u) => u.id === next.id)?.newStatus
          const effectiveStatus = pendingNewStatus ?? next.status
          if (effectiveStatus === 'pending') {
            supabase.from('phases').update({ status: 'active' }).eq('id', next.id).then(({ error }) => {
              if (!error) {
                setPhases((prev) => prev.map((p) => p.id === next.id ? { ...p, status: 'active' } : p))
              }
            })
            break
          }
          // Skip phases that are already active or also completing — keep looking
          if (effectiveStatus === 'active') break
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskMap])

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
    <div className="h-full overflow-x-auto overflow-y-hidden">
      {/* inline-flex sizes to content width, enabling the outer scroll container to work */}
      <div className="inline-flex gap-4 md:gap-5 h-full px-4 md:px-8 pt-4 pb-4 align-top">
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
    </div>
  )
}

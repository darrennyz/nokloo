export type ProjectStatus = 'idea' | 'planning' | 'building' | 'testing' | 'deployed'
export type PhaseStatus = 'pending' | 'active' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked'
export type TaskType = 'task' | 'checklist'

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  raw_idea: string | null
  project_type: string | null
  complexity: string | null
  features: string[]
  status: ProjectStatus
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Version {
  id: string
  project_id: string
  name: string
  description: string | null
  order_index: number
  status: 'active' | 'completed'
  created_at: string
}

export interface Phase {
  id: string
  version_id: string
  name: string
  order_index: number
  status: PhaseStatus
  phase_type: string | null
  created_at: string
}

export interface Task {
  id: string
  phase_id: string
  title: string
  description: string | null
  status: TaskStatus
  task_type: TaskType
  order_index: number
  notes: string | null
  created_at: string
  updated_at: string
  checklist_items?: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  task_id: string
  item: string
  checked: boolean
  order_index: number
  created_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  project_id: string | null
  user_id: string | null
  action: string
  details: Record<string, unknown>
  created_at: string
}

export interface ProjectWithVersions extends Project {
  versions: VersionWithPhases[]
}

export interface VersionWithPhases extends Version {
  phases: PhaseWithTasks[]
}

export interface PhaseWithTasks extends Phase {
  tasks: Task[]
}

export interface DashboardStats {
  ideas: number
  ongoing: number
  testing: number
  deployed: number
}

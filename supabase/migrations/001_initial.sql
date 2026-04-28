-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  raw_idea TEXT,
  project_type TEXT,
  complexity TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'planning', 'building', 'testing', 'deployed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Versions
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phases
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'completed')),
  phase_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  task_type TEXT NOT NULL DEFAULT 'task'
    CHECK (task_type IN ('task', 'checklist')),
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checklist items (for UAT and other checklist tasks)
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API keys (stored as hashed, only prefix shown)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Projects: users own their projects
CREATE POLICY "users_own_projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Versions: accessible if user owns the parent project
CREATE POLICY "users_own_versions" ON versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = versions.project_id AND projects.user_id = auth.uid())
  );

-- Phases
CREATE POLICY "users_own_phases" ON phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM versions
      JOIN projects ON projects.id = versions.project_id
      WHERE versions.id = phases.version_id AND projects.user_id = auth.uid()
    )
  );

-- Tasks
CREATE POLICY "users_own_tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM phases
      JOIN versions ON versions.id = phases.version_id
      JOIN projects ON projects.id = versions.project_id
      WHERE phases.id = tasks.phase_id AND projects.user_id = auth.uid()
    )
  );

-- Checklist items
CREATE POLICY "users_own_checklist_items" ON checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN phases ON phases.id = tasks.phase_id
      JOIN versions ON versions.id = phases.version_id
      JOIN projects ON projects.id = versions.project_id
      WHERE tasks.id = checklist_items.task_id AND projects.user_id = auth.uid()
    )
  );

-- API keys
CREATE POLICY "users_own_api_keys" ON api_keys
  FOR ALL USING (auth.uid() = user_id);

-- Activity log
CREATE POLICY "users_own_activity" ON activity_log
  FOR ALL USING (auth.uid() = user_id);

-- Allow MCP server (service role) to bypass RLS for api key validation
-- This is handled via service role key on the server side

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_versions_project_id ON versions(project_id);
CREATE INDEX idx_phases_version_id ON phases(version_id);
CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX idx_checklist_items_task_id ON checklist_items(task_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_activity_log_project_id ON activity_log(project_id);

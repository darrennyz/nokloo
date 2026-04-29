export const MCP_TOOLS = [
  // ── Write tools ──────────────────────────────────────────────────────────

  {
    name: 'nokloo_setup_project',
    description:
      'Create a project AND set its phases+tasks in one call. Call immediately when a user describes any app or idea they want to build.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short project name' },
        description: { type: 'string', description: 'One-paragraph summary' },
        raw_idea: { type: 'string', description: "User's original idea verbatim" },
        project_type: { type: 'string', description: 'e.g. saas, ecommerce, bot, internal_tool, mobile_app' },
        complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] },
        features: { type: 'array', items: { type: 'string' } },
        version_name: { type: 'string', description: 'Version label e.g. "V1 - MVP"', default: 'V1' },
        version_description: { type: 'string' },
        phases: {
          type: 'array',
          description: 'Ordered phases. Simple bot: Build>Test>Deploy. SaaS: Planning>Design>Build>Security>Testing>UAT>Deploy. Include UAT for user-facing products.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phase_type: { type: 'string', description: 'idea|planning|design|build|security|testing|uat|deploy|review' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['title'],
                },
              },
            },
            required: ['name', 'phase_type'],
          },
        },
      },
      required: ['name', 'description', 'phases'],
    },
  },

  {
    name: 'nokloo_update_project',
    description: 'Update project metadata (name, description, status, complexity, features).',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        project_type: { type: 'string' },
        complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] },
        features: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['idea', 'planning', 'building', 'testing', 'deployed'] },
      },
      required: ['project_id'],
    },
  },

  {
    name: 'nokloo_set_phases',
    description:
      'Define phases (Kanban columns) for an existing project. Use nokloo_setup_project instead if creating a new project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        version_name: { type: 'string', default: 'V1' },
        version_description: { type: 'string' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phase_type: { type: 'string' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { title: { type: 'string' }, description: { type: 'string' } },
                  required: ['title'],
                },
              },
            },
            required: ['name', 'phase_type'],
          },
        },
      },
      required: ['project_id', 'phases'],
    },
  },

  {
    name: 'nokloo_add_task',
    description: 'Add a single task to a phase.',
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        task_type: { type: 'string', enum: ['task', 'checklist'], default: 'task' },
      },
      required: ['phase_id', 'title'],
    },
  },

  {
    name: 'nokloo_update_task',
    description: 'Update a single task status or notes.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'] },
        notes: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['task_id'],
    },
  },

  {
    name: 'nokloo_update_tasks_bulk',
    description:
      'Update status on multiple tasks in one call. Use instead of calling nokloo_update_task repeatedly when marking several tasks done/in_progress.',
    inputSchema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          description: 'List of task updates',
          items: {
            type: 'object',
            properties: {
              task_id: { type: 'string' },
              status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'] },
              notes: { type: 'string' },
            },
            required: ['task_id', 'status'],
          },
        },
      },
      required: ['updates'],
    },
  },

  {
    name: 'nokloo_generate_uat_checklist',
    description: 'Generate a UAT checklist task in a phase with tickable acceptance criteria.',
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string' },
        feature_name: { type: 'string' },
        checklist_items: { type: 'array', items: { type: 'string' } },
      },
      required: ['phase_id', 'feature_name', 'checklist_items'],
    },
  },

  {
    name: 'nokloo_transition_phase',
    description: "Mark a phase completed and optionally activate the next phase.",
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string' },
        next_phase_id: { type: 'string', description: 'Phase to activate next (optional)' },
      },
      required: ['phase_id'],
    },
  },

  {
    name: 'nokloo_add_version',
    description: 'Add a new version (e.g. V2) to an existing project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        name: { type: 'string', description: 'e.g. "V2 - Referrals"' },
        description: { type: 'string' },
      },
      required: ['project_id', 'name'],
    },
  },

  // ── Read tools ───────────────────────────────────────────────────────────

  {
    name: 'nokloo_get_project_status',
    description: 'Get project overview: versions, phases, and task completion counts.',
    inputSchema: {
      type: 'object',
      properties: { project_id: { type: 'string' } },
      required: ['project_id'],
    },
  },

  {
    name: 'nokloo_get_phase_tasks',
    description: 'Get tasks for a phase (id, title, status). Use to check what needs doing before updating.',
    inputSchema: {
      type: 'object',
      properties: { phase_id: { type: 'string' } },
      required: ['phase_id'],
    },
  },

  {
    name: 'nokloo_list_projects',
    description: "List all user projects (id, name, status). Use to find a project_id.",
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

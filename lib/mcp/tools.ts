export const MCP_TOOLS = [
  // ── Write tools ──────────────────────────────────────────────────────────

  {
    name: 'create_project',
    description:
      'Create a new Nokloo project from an idea. Call this the first time the user describes what they want to build. Returns a project_id to use in all subsequent calls.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short project name' },
        description: { type: 'string', description: 'One-paragraph summary of the project' },
        raw_idea: { type: 'string', description: 'The user\'s original idea text verbatim' },
        project_type: {
          type: 'string',
          description: 'Project category e.g. saas, ecommerce, bot, internal_tool, mobile_app',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'medium', 'complex'],
          description: 'Estimated complexity based on feature count and integrations',
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key features detected from the idea',
        },
      },
      required: ['name', 'description'],
    },
  },

  {
    name: 'update_project',
    description:
      'Update project metadata as more context is gathered during the Idea and Planning phases.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        project_type: { type: 'string' },
        complexity: { type: 'string', enum: ['simple', 'medium', 'complex'] },
        features: { type: 'array', items: { type: 'string' } },
        status: {
          type: 'string',
          enum: ['idea', 'planning', 'building', 'testing', 'deployed'],
        },
      },
      required: ['project_id'],
    },
  },

  {
    name: 'set_phases',
    description:
      'Define all phases for a project version. Call once the user confirms they are ready to build. Choose phases based on industry best practice for the project type — e.g. a simple bot needs Build > Test > Deploy; a SaaS needs Planning > Design > Build > Security Review > Testing > UAT > Deploy. Always include a UAT phase for any user-facing product.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
        version_name: {
          type: 'string',
          description: 'Version label e.g. "V1 - MVP"',
          default: 'V1',
        },
        version_description: { type: 'string' },
        phases: {
          type: 'array',
          description: 'Ordered list of phases. Order determines Kanban column sequence.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Phase display name e.g. "Security Review"' },
              phase_type: {
                type: 'string',
                description:
                  'Machine-readable type: idea | planning | design | build | security | testing | uat | deploy | review',
              },
              tasks: {
                type: 'array',
                description: 'Initial tasks to create inside this phase',
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
      required: ['project_id', 'phases'],
    },
  },

  {
    name: 'add_task',
    description: 'Add a single task to an existing phase.',
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
    name: 'update_task',
    description: 'Update a task\'s status or notes.',
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
    name: 'generate_uat_checklist',
    description:
      'Generate a UAT checklist for a specific task or feature. Creates tickable checklist items. Call when the project reaches the UAT phase.',
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: {
          type: 'string',
          description: 'The UAT phase ID to add the checklist task to',
        },
        feature_name: { type: 'string', description: 'The feature being tested e.g. "Payments"' },
        checklist_items: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of UAT scenarios e.g. "Successful checkout flow", "Failed card handling"',
        },
      },
      required: ['phase_id', 'feature_name', 'checklist_items'],
    },
  },

  {
    name: 'transition_phase',
    description:
      'Mark the current phase as completed and activate the next phase. Call when the user confirms they are ready to move forward.',
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string', description: 'The phase to mark as completed' },
        next_phase_id: {
          type: 'string',
          description: 'The phase to activate next (optional — if omitted, just completes current)',
        },
      },
      required: ['phase_id'],
    },
  },

  {
    name: 'add_version',
    description:
      'Add a new version (e.g. V2) to an existing project for post-MVP features.',
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
    name: 'get_project_status',
    description:
      'Get a full overview of a project: all versions, phases, and task completion counts. Use this to inform suggestions about next steps.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
      },
      required: ['project_id'],
    },
  },

  {
    name: 'get_phase_tasks',
    description: 'Get all tasks for a specific phase including their statuses and checklist items.',
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string' },
      },
      required: ['phase_id'],
    },
  },

  {
    name: 'list_projects',
    description: 'List all projects for the authenticated user.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

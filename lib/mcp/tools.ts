export const MCP_TOOLS = [
  // ── Write tools ──────────────────────────────────────────────────────────

  {
    name: 'nokloo_create_project',
    description:
      'Create a new project in Nokloo. Call this immediately when the user describes any app, tool, or idea they want to build — even casually e.g. "I want to build a booking app." Returns a project_id to use in all subsequent Nokloo calls.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short project name' },
        description: { type: 'string', description: 'One-paragraph summary of the project' },
        raw_idea: { type: 'string', description: "The user's original idea text verbatim" },
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
    name: 'nokloo_update_project',
    description:
      'Update metadata on an existing Nokloo project (name, description, status, complexity, features). Call this as more context is gathered or when the project status changes.',
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
    name: 'nokloo_set_phases',
    description:
      'Define the build phases (Kanban columns) for a Nokloo project. Call once the user is ready to start building. Choose phases based on project type — a simple bot: Build > Test > Deploy; a SaaS: Planning > Design > Build > Security Review > Testing > UAT > Deploy. Always include UAT for user-facing products.',
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
    name: 'nokloo_add_task',
    description: 'Add a single task to an existing phase in a Nokloo project.',
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
    description: "Update a Nokloo task's status or notes as work progresses.",
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
    name: 'nokloo_generate_uat_checklist',
    description:
      'Generate a UAT checklist for a feature in Nokloo. Call when the project reaches the UAT phase to create tickable acceptance criteria.',
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
    name: 'nokloo_transition_phase',
    description:
      "Mark a Nokloo phase as completed and activate the next phase. Call when the user confirms they're ready to move forward.",
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
    name: 'nokloo_add_version',
    description:
      'Add a new version (e.g. V2) to an existing Nokloo project for post-MVP features.',
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
    description:
      'Get a full overview of a Nokloo project: all versions, phases, and task completion counts. Use this to check progress and decide on next steps.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string' },
      },
      required: ['project_id'],
    },
  },

  {
    name: 'nokloo_get_phase_tasks',
    description: 'Get all tasks for a specific Nokloo phase including their statuses and checklist items.',
    inputSchema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string' },
      },
      required: ['phase_id'],
    },
  },

  {
    name: 'nokloo_list_projects',
    description: "List all of the user's Nokloo projects. Use this when the user asks what projects they have, or to find a project_id before updating it.",
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
]

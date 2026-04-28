# Nokloo

**AI-native project management for vibe coders.**

Nokloo is a visual Kanban board that Claude populates for you. Describe your project idea in Claude, and it automatically creates phases, tasks, and UAT checklists on your board in real time — no copy-pasting, no manual setup.

**Live app → [nokloo.vercel.app](https://nokloo.vercel.app)**

---

## How it works

Nokloo sits between Claude and a visual project board. You do the thinking in Claude; Nokloo handles the structure.

```
You → Claude (describe your idea)
         ↓
    Claude calls Nokloo MCP tools
         ↓
    Nokloo updates your board in real time
         ↓
    You see phases, tasks & UAT checklists appear live
```

### The workflow

1. **Connect Claude** — go to [claude.ai → Settings → Integrations](https://claude.ai/settings/integrations), add `https://nokloo.vercel.app/api/mcp`, and authorize with your Nokloo account. Done in 30 seconds, no config files or terminal needed.

2. **Describe your idea** — tell Claude what you're building in plain language. No special prompts required.

3. **Claude structures it** — Claude calls Nokloo's MCP tools to create a project, break it into industry-standard phases, and populate each phase with tasks.

4. **Work the board** — your Nokloo board updates live via Supabase Realtime. Move tasks, check off items, track progress. Claude can also read your board and suggest what to work on next.

### What Claude can do on your board

| Tool | What it does |
|---|---|
| `create_project` | Creates a new project with name, description, and type |
| `set_phases` | Builds a full phase plan (Discovery → Build → Test → Deploy) |
| `add_task` | Adds a task to any phase |
| `update_task` | Changes a task's status, description, or notes |
| `transition_phase` | Marks a phase complete and activates the next |
| `generate_uat_checklist` | Creates a UAT checklist for a feature |
| `get_project_status` | Reads current board state so Claude can advise |
| `get_phase_tasks` | Reads tasks in a specific phase |
| `list_projects` | Lists all your projects |

Claude decides which tools to call and when — you just have a conversation.

### Nokloo uses zero AI tokens

Nokloo itself is pure infrastructure — it has no AI. All intelligence lives in Claude. When Claude calls an MCP tool, Nokloo simply executes a database operation and returns the result. Your Claude subscription is the only AI cost.

---

## Security model

Nokloo uses **OAuth 2.0 with PKCE** to authenticate Claude sessions. Here's exactly how it keeps each user's data isolated on a shared domain.

### One unique token per user

When you click Connect on claude.ai, the full OAuth flow runs:

```
Claude → GET /api/mcp                                  → 401 (no token)
Claude → GET /.well-known/oauth-authorization-server   → discovers auth endpoints
Claude → POST /api/mcp/oauth/register                  → registers as a client
Claude → GET /api/mcp/oauth/authorize                  → redirects you to Nokloo login
You log in → click Authorize
Server creates a one-time code tied to your user_id
Claude → POST /api/mcp/oauth/token (+ PKCE verifier)
Server issues: nkl_a7f3c2... (unique Bearer token for you)
```

If another user connects their Claude, they go through the same flow and receive a completely different token tied to their own `user_id`. Tokens are never shared between users.

### Every MCP request is scoped to one user

Each tool call Claude makes includes the Bearer token:

```http
POST /api/mcp
Authorization: Bearer nkl_a7f3c2...
```

The server:
1. SHA-256 hashes the incoming token
2. Looks up the hash in the `api_keys` table → resolves to a `user_id`
3. Scopes **all** database queries to that `user_id`:

```ts
// Can only create projects owned by the authenticated user
supabase.from('projects').insert({ user_id: userId, ... })

// Can only read that user's projects
supabase.from('projects').select().eq('user_id', userId)

// The user_id check means another user's project ID is simply not found
supabase.from('projects').update(...).eq('id', id).eq('user_id', userId)
```

### Two independent layers of enforcement

| Layer | Mechanism |
|---|---|
| **Application code** | Every query includes `.eq('user_id', userId)` |
| **Supabase Row Level Security** | Database-level policies enforce `auth.uid() = user_id` — a buggy query still cannot leak data |

### Token storage

- The raw `nkl_...` token is **never stored** — only its SHA-256 hash lives in the database
- A compromised database cannot recover tokens from hashes
- Each Claude connection gets its own independent token
- Revoking one connection does not affect others
- Any connection can be revoked at any time from **Setup** in your Nokloo dashboard

---

## Tech stack

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Database** | Supabase (Postgres + Auth + Realtime) |
| **Auth** | Supabase Auth + OAuth 2.0 with PKCE for MCP |
| **AI integration** | MCP over Streamable HTTP (JSON-RPC 2.0) |
| **UI** | shadcn/ui + Tailwind CSS + OKLCH color tokens |
| **Fonts** | Bricolage Grotesque + DM Sans |
| **Deployment** | Vercel |

---

## Running locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- npm

### Setup

```bash
git clone https://github.com/darrennyz/nokloo.git
cd nokloo
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Run both database migrations in your Supabase SQL editor:
- `supabase/migrations/001_initial.sql`
- `supabase/migrations/002_oauth.sql`

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Connecting Claude locally

In [claude.ai → Settings → Integrations](https://claude.ai/settings/integrations), add:

```
http://localhost:3000/api/mcp
```

---

## Project structure

```
app/
  (auth)/               # Login & signup pages
  (dashboard)/          # Main app: dashboard, projects, setup, settings
  api/
    mcp/                # MCP server — JSON-RPC 2.0 over HTTP
    mcp/oauth/          # OAuth 2.0 endpoints (authorize, token, register)
  .well-known/          # OAuth discovery (RFC 8414 + RFC 9728)
  mcp-auth/             # OAuth consent page shown during Connect flow

components/
  kanban/               # KanbanBoard, TaskCard, TaskDetailPanel, PhaseColumn
  projects/             # ProjectList with create, edit, delete
  setup/                # MCP connection UI
  settings/             # Account settings
  layout/               # Sidebar navigation

lib/
  mcp/                  # Tool definitions, request handlers, CORS helpers
  supabase/             # Browser, server, and service role clients

supabase/
  migrations/           # SQL schema (001) and OAuth tables (002)
```

---

## License

MIT

import { NextRequest, NextResponse } from 'next/server'
import { MCP_TOOLS } from '@/lib/mcp/tools'
import { handleMcpTool } from '@/lib/mcp/handlers'
import { corsJson, corsOptions, withCors } from '@/lib/mcp/cors'

function getBaseUrl(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

// Preflight
export async function OPTIONS() {
  return corsOptions()
}

// MCP over Streamable HTTP (2025-03-26 spec)
export async function POST(request: NextRequest) {
  const base = getBaseUrl(request)
  const apiKey = request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace('Bearer ', '')

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { jsonrpc, id, method, params } = body as {
    jsonrpc: string; id: string | number; method: string; params?: Record<string, unknown>
  }

  if (jsonrpc !== '2.0') {
    return corsJson({ error: 'Only JSON-RPC 2.0 supported' }, { status: 400 })
  }

  // initialize and tools/list are public — Claude needs these to discover the server
  // tools/call requires a valid Bearer token
  const requiresAuth = method === 'tools/call'
  if (requiresAuth && !apiKey) {
    return withCors(NextResponse.json(
      { jsonrpc: '2.0', id, error: { code: -32001, message: 'Authentication required.' } },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer realm="${base}", error="invalid_token"`,
          'Link': `<${base}/.well-known/oauth-authorization-server>; rel="oauth-authorization-server"`,
        },
      }
    ))
  }

  switch (method) {
    case 'initialize':
      return corsJson({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'Nokloo',
            version: '1.0.0',
            description: 'Nokloo is a project tracker for indie developers. When a user describes an idea or app they want to build, use the Nokloo tools to capture it — create a project, define phases, and track tasks as the build progresses.',
          },
        },
      })

    case 'tools/list':
      return corsJson({ jsonrpc: '2.0', id, result: { tools: MCP_TOOLS } })

    case 'tools/call': {
      const { name, arguments: toolArgs } = (params ?? {}) as {
        name: string; arguments: Record<string, unknown>
      }

      if (!name) {
        return corsJson({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing tool name' } })
      }

      const result = await handleMcpTool(name, toolArgs ?? {}, apiKey!)
      return corsJson({ jsonrpc: '2.0', id, result })
    }

    case 'notifications/initialized':
      return corsJson({ jsonrpc: '2.0', id, result: {} })

    default:
      return corsJson({
        jsonrpc: '2.0', id,
        error: { code: -32601, message: `Method not found: ${method}` },
      })
  }
}

export async function GET() {
  return corsJson({
    name: 'Nokloo MCP Server',
    version: '1.0.0',
    description: 'Push project structure from Claude into Nokloo',
    tools: MCP_TOOLS.map((t) => t.name),
  })
}

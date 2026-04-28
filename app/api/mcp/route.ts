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
  const apiKey = request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    const base = getBaseUrl(request)
    return withCors(NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required.' },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': `Bearer realm="${base}", error="invalid_token"`,
          'Link': `<${base}/.well-known/oauth-authorization-server>; rel="oauth-authorization-server"`,
        },
      }
    ))
  }

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

  switch (method) {
    case 'initialize':
      return corsJson({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'nokloo', version: '1.0.0' },
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

      const result = await handleMcpTool(name, toolArgs ?? {}, apiKey)
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

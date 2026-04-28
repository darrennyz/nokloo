import { NextRequest, NextResponse } from 'next/server'
import { MCP_TOOLS } from '@/lib/mcp/tools'
import { handleMcpTool } from '@/lib/mcp/handlers'

// MCP over Streamable HTTP (2025-03-26 spec)
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') ?? request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API key. Pass via x-api-key header.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { jsonrpc, id, method, params } = body as {
    jsonrpc: string; id: string | number; method: string; params?: Record<string, unknown>
  }

  if (jsonrpc !== '2.0') {
    return NextResponse.json({ error: 'Only JSON-RPC 2.0 supported' }, { status: 400 })
  }

  // Handle MCP protocol methods
  switch (method) {
    case 'initialize':
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'nokloo', version: '1.0.0' },
        },
      })

    case 'tools/list':
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result: { tools: MCP_TOOLS },
      })

    case 'tools/call': {
      const { name, arguments: toolArgs } = (params ?? {}) as {
        name: string; arguments: Record<string, unknown>
      }

      if (!name) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing tool name' },
        })
      }

      const result = await handleMcpTool(name, toolArgs ?? {}, apiKey)

      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        result,
      })
    }

    case 'notifications/initialized':
      return NextResponse.json({ jsonrpc: '2.0', id, result: {} })

    default:
      return NextResponse.json({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      })
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Nokloo MCP Server',
    version: '1.0.0',
    description: 'Push project structure from Claude into Nokloo',
    tools: MCP_TOOLS.map((t) => t.name),
  })
}

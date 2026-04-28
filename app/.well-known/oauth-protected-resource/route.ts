import { NextRequest } from 'next/server'
import { corsJson, corsOptions } from '@/lib/mcp/cors'

function getBaseUrl(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function OPTIONS() {
  return corsOptions()
}

// RFC 9728 — tells Claude.ai which auth server protects this resource
export async function GET(request: NextRequest) {
  const base = getBaseUrl(request)
  return corsJson({
    resource: `${base}/api/mcp`,
    authorization_servers: [base],
    bearer_methods_supported: ['header'],
    scopes_supported: ['mcp'],
  })
}

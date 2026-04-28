import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Dynamic Client Registration (RFC 7591)
// Claude Desktop calls this to register itself before initiating OAuth
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }

  const clientId = `mcp_${crypto.randomBytes(16).toString('hex')}`
  const clientName = (body.client_name as string) ?? 'Claude Desktop'
  const redirectUris = (body.redirect_uris as string[]) ?? []

  const supabase = createServiceClient()
  await supabase.from('oauth_clients').insert({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
  })

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
    },
    { status: 201 }
  )
}

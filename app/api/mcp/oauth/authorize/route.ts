import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// GET: Check auth, then redirect to the consent UI page
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const params = request.nextUrl.searchParams.toString()

  if (!user) {
    // Not logged in — send to login with a returnTo so they come back here after
    const returnTo = encodeURIComponent(`/mcp-auth?${params}`)
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
  }

  // Logged in — show the consent page
  return NextResponse.redirect(new URL(`/mcp-auth?${params}`, request.url))
}

// POST: User clicked "Authorize" on the consent page — issue an auth code
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let body: Record<string, string> = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { client_id, redirect_uri, state, code_challenge, code_challenge_method } = body

  if (!redirect_uri) {
    return NextResponse.json({ error: 'Missing redirect_uri' }, { status: 400 })
  }

  // Generate a single-use auth code
  const code = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  const serviceClient = createServiceClient()
  const { error } = await serviceClient.from('oauth_codes').insert({
    user_id: user.id,
    client_id: client_id ?? 'unknown',
    code,
    code_challenge: code_challenge ?? null,
    code_challenge_method: code_challenge_method ?? 'S256',
    redirect_uri,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to issue authorization code' }, { status: 500 })
  }

  // Build the callback URL for Claude Desktop's local server
  const callbackUrl = new URL(redirect_uri)
  callbackUrl.searchParams.set('code', code)
  if (state) callbackUrl.searchParams.set('state', state)

  return NextResponse.json({ redirect: callbackUrl.toString() })
}

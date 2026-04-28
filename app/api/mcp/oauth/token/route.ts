import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Token Exchange (RFC 6749 §4.1.3)
// Claude Desktop calls this after the user authorizes, exchanging the code for an access token
export async function POST(request: NextRequest) {
  // Support both JSON and form-encoded bodies
  let params: Record<string, string> = {}
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    params = await request.json()
  } else {
    const text = await request.text()
    for (const pair of text.split('&')) {
      const [k, v] = pair.split('=')
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
    }
  }

  const { grant_type, code, redirect_uri, client_id, code_verifier } = params

  if (grant_type !== 'authorization_code') {
    return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing code' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Look up the auth code
  const { data: authCode, error: codeError } = await supabase
    .from('oauth_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .single()

  if (codeError || !authCode) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Invalid or expired code' }, { status: 400 })
  }

  // Check expiry
  if (new Date(authCode.expires_at) < new Date()) {
    await supabase.from('oauth_codes').update({ used: true }).eq('id', authCode.id)
    return NextResponse.json({ error: 'invalid_grant', error_description: 'Code expired' }, { status: 400 })
  }

  // Validate redirect_uri matches
  if (redirect_uri && authCode.redirect_uri !== redirect_uri) {
    return NextResponse.json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' }, { status: 400 })
  }

  // Validate PKCE if code_challenge was provided
  if (authCode.code_challenge) {
    if (!code_verifier) {
      return NextResponse.json({ error: 'invalid_grant', error_description: 'Missing code_verifier' }, { status: 400 })
    }

    const method = authCode.code_challenge_method ?? 'S256'
    let computedChallenge: string

    if (method === 'S256') {
      const hash = crypto.createHash('sha256').update(code_verifier).digest()
      computedChallenge = hash.toString('base64url')
    } else {
      // plain method
      computedChallenge = code_verifier
    }

    if (computedChallenge !== authCode.code_challenge) {
      return NextResponse.json({ error: 'invalid_grant', error_description: 'PKCE verification failed' }, { status: 400 })
    }
  }

  // Mark code as used (single-use)
  await supabase.from('oauth_codes').update({ used: true }).eq('id', authCode.id)

  // Generate access token — stored exactly like an API key
  const rawToken = `nkl_${crypto.randomBytes(32).toString('hex')}`
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const keyPrefix = rawToken.slice(0, 12)

  const { error: insertError } = await supabase.from('api_keys').insert({
    user_id: authCode.user_id,
    name: `Claude Desktop (${client_id?.slice(0, 16) ?? 'oauth'})`,
    key_hash: tokenHash,
    key_prefix: keyPrefix,
  })

  if (insertError) {
    return NextResponse.json({ error: 'server_error', error_description: 'Failed to create token' }, { status: 500 })
  }

  return NextResponse.json({
    access_token: rawToken,
    token_type: 'Bearer',
    // No expiry — tokens are long-lived, user can revoke from Settings
  })
}

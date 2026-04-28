import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { corsJson, corsOptions } from '@/lib/mcp/cors'
import crypto from 'crypto'

export async function OPTIONS() {
  return corsOptions()
}

// Token Exchange (RFC 6749 §4.1.3)
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
    return corsJson({ error: 'unsupported_grant_type' }, { status: 400 })
  }

  if (!code) {
    return corsJson({ error: 'invalid_request', error_description: 'Missing code' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: authCode, error: codeError } = await supabase
    .from('oauth_codes')
    .select('*')
    .eq('code', code)
    .eq('used', false)
    .single()

  if (codeError || !authCode) {
    return corsJson({ error: 'invalid_grant', error_description: 'Invalid or expired code' }, { status: 400 })
  }

  if (new Date(authCode.expires_at) < new Date()) {
    await supabase.from('oauth_codes').update({ used: true }).eq('id', authCode.id)
    return corsJson({ error: 'invalid_grant', error_description: 'Code expired' }, { status: 400 })
  }

  if (redirect_uri && authCode.redirect_uri !== redirect_uri) {
    return corsJson({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' }, { status: 400 })
  }

  // Validate PKCE
  if (authCode.code_challenge) {
    if (!code_verifier) {
      return corsJson({ error: 'invalid_grant', error_description: 'Missing code_verifier' }, { status: 400 })
    }

    const method = authCode.code_challenge_method ?? 'S256'
    const computedChallenge = method === 'S256'
      ? crypto.createHash('sha256').update(code_verifier).digest().toString('base64url')
      : code_verifier

    if (computedChallenge !== authCode.code_challenge) {
      return corsJson({ error: 'invalid_grant', error_description: 'PKCE verification failed' }, { status: 400 })
    }
  }

  // Mark code as used
  await supabase.from('oauth_codes').update({ used: true }).eq('id', authCode.id)

  // Issue access token (stored same as API key)
  const rawToken = `nkl_${crypto.randomBytes(32).toString('hex')}`
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const { error: insertError } = await supabase.from('api_keys').insert({
    user_id: authCode.user_id,
    name: `Claude (${client_id?.slice(0, 20) ?? 'oauth'})`,
    key_hash: tokenHash,
    key_prefix: rawToken.slice(0, 12),
  })

  if (insertError) {
    return corsJson({ error: 'server_error', error_description: 'Failed to create token' }, { status: 500 })
  }

  return corsJson({
    access_token: rawToken,
    token_type: 'Bearer',
  })
}

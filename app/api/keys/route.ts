import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function generateApiKey(): string {
  return 'nkl_' + crypto.randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()

  const rawKey = generateApiKey()
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12)

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: name ?? 'Default',
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, last_used_at, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return raw key only once — it's never stored
  return NextResponse.json({ key: data, rawKey })
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { McpSetup } from '@/components/setup/McpSetup'
import type { ApiKey } from '@/types'

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <McpSetup initialKeys={(keys ?? []) as ApiKey[]} userId={user.id} appUrl={getAppUrl()} />
}

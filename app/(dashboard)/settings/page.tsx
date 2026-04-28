import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeyManager } from '@/components/settings/ApiKeyManager'
import type { ApiKey } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ApiKeyManager initialKeys={(keys ?? []) as ApiKey[]} userId={user.id} />
}

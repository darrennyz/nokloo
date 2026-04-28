import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AccountSettings } from '@/components/settings/AccountSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="h-full overflow-y-auto">
      <AccountSettings email={user.email ?? ''} userId={user.id} />
    </div>
  )
}

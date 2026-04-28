import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthorizeClient } from './AuthorizeClient'

export default async function McpAuthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={
          <div className="space-y-4 animate-pulse">
            <div className="h-12 w-12 rounded-xl bg-muted mx-auto" />
            <div className="h-6 w-48 bg-muted rounded mx-auto" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        }>
          <AuthorizeClient user={{ email: user.email!, id: user.id }} />
        </Suspense>
      </div>
    </div>
  )
}

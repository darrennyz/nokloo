'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Layers, ListTodo, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  user: { email: string; id: string }
}

const PERMISSIONS = [
  { icon: Layers, label: 'Create and manage your projects' },
  { icon: ListTodo, label: 'Add tasks and phases to boards' },
  { icon: Zap, label: 'Update task status and progress' },
  { icon: CheckCircle2, label: 'Generate UAT checklists' },
]

export function AuthorizeClient({ user }: Props) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const clientId = searchParams.get('client_id') ?? ''
  const redirectUri = searchParams.get('redirect_uri') ?? ''
  const state = searchParams.get('state') ?? ''
  const codeChallenge = searchParams.get('code_challenge') ?? ''
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? 'S256'

  if (!redirectUri) {
    return (
      <div className="text-center space-y-2">
        <p className="text-destructive font-medium">Invalid authorization request</p>
        <p className="text-sm text-muted-foreground">Missing redirect_uri parameter.</p>
      </div>
    )
  }

  async function handleAuthorize() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/mcp/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Authorization failed')

      // Redirect to Claude Desktop's local callback server
      setDone(true)
      window.location.href = data.redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="font-display font-600 text-lg">Connected!</p>
        <p className="text-sm text-muted-foreground">Redirecting to Claude Desktop…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* App branding */}
      <div className="flex items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <span className="text-primary-foreground text-lg font-bold font-display">N</span>
        </div>
        <div className="w-px h-8 bg-border" />
        <div className="w-12 h-12 rounded-xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center">
          <span className="text-[#D97757] text-lg font-bold">✦</span>
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <h1 className="font-display text-2xl font-700 tracking-tight">Connect Claude Desktop</h1>
        <p className="text-sm text-muted-foreground">
          Claude wants permission to manage your Nokloo projects
        </p>
      </div>

      {/* Permissions list */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Claude will be able to
        </p>
        <ul className="space-y-2.5">
          {PERMISSIONS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-foreground">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Signed in as */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-primary text-xs font-bold uppercase">{user.email[0]}</span>
        </div>
        <span className="text-sm text-muted-foreground">Signed in as</span>
        <span className="text-sm font-medium truncate">{user.email}</span>
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.close()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleAuthorize}
          disabled={loading}
        >
          {loading ? 'Authorizing…' : 'Authorize'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        You can revoke access at any time from{' '}
        <a href="/settings" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Settings
        </a>
      </p>
    </div>
  )
}

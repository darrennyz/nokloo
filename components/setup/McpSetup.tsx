'use client'

import { useState } from 'react'
import { Copy, Trash2, Plug, CheckCircle2, ExternalLink, Zap, Layers, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ApiKey } from '@/types'

interface McpSetupProps {
  initialKeys: ApiKey[]
  userId: string
  appUrl: string
}

export function McpSetup({ initialKeys, userId, appUrl }: McpSetupProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [copied, setCopied] = useState(false)

  const mcpUrl = `${appUrl}/api/mcp`

  function copyUrl() {
    navigator.clipboard.writeText(mcpUrl)
    setCopied(true)
    toast.success('URL copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke(id: string, name: string) {
    const supabase = createClient()
    const { error } = await supabase.from('api_keys').delete().eq('id', id).eq('user_id', userId)
    if (error) { toast.error('Failed to revoke'); return }
    setKeys((prev) => prev.filter((k) => k.id !== id))
    toast.success(`"${name}" disconnected`)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-2xl font-700 tracking-tight">Setup</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect Claude to your Nokloo workspace</p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How it works</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Plug, label: 'Connect', desc: 'Add Nokloo to Claude in one click' },
            { icon: Layers, label: 'Describe', desc: 'Tell Claude about your project idea' },
            { icon: ListTodo, label: 'Build', desc: 'Claude pushes tasks to your board' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="space-y-2 text-center">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connection steps */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            Connect Claude
          </h2>
          <p className="text-xs text-muted-foreground">Works with claude.ai — no installs or config files needed.</p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {/* Step 1 */}
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-sm font-medium">Go to claude.ai → Settings → Integrations</p>
            </div>
            <div className="ml-9">
              <a
                href="https://claude.ai/settings/integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                Open Claude Integrations
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <p className="text-sm font-medium">Click <span className="font-semibold">Add custom connector</span> and paste this URL</p>
            </div>
            <div className="ml-9 flex items-center gap-2">
              <code className="flex-1 text-xs font-mono bg-muted border border-border rounded-lg px-3 py-2.5 truncate">
                {mcpUrl}
              </code>
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                className="shrink-0 h-9 gap-1.5 transition-all"
                onClick={copyUrl}
              >
                {copied
                  ? <><CheckCircle2 className="h-3.5 w-3.5" />Copied</>
                  : <><Copy className="h-3.5 w-3.5" />Copy</>
                }
              </Button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <p className="text-sm font-medium">Click <span className="font-semibold">Connect</span> and authorize with your Nokloo account</p>
            </div>
            <p className="ml-9 text-xs text-muted-foreground">
              Claude will open a browser tab to confirm — just click <span className="font-medium text-foreground">Authorize</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Connected clients */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Plug className="h-3.5 w-3.5 text-muted-foreground" />
            Active connections
            {keys.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                {keys.length} connected
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">Each Claude session you authorize appears here. Revoke to disconnect.</p>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-1.5">
            <Plug className="h-5 w-5 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">No active connections</p>
            <p className="text-xs text-muted-foreground/60">Follow the steps above to connect Claude</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {keys.map((key, i) => (
              <div
                key={key.id}
                className={`flex items-center justify-between px-4 py-3 ${i !== keys.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Plug className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {key.last_used_at
                        ? `Last used ${new Date(key.last_used_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : 'Never used'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id, key.name)}
                  className="p-1.5 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Revoke access"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Copy, Trash2, Key, Plug, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ApiKey } from '@/types'

interface ApiKeyManagerProps {
  initialKeys: ApiKey[]
  userId: string
  appUrl: string
}

export function ApiKeyManager({ initialKeys, userId, appUrl }: ApiKeyManagerProps) {
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
        <h1 className="font-display text-2xl font-700 tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect Claude Desktop to your Nokloo workspace</p>
      </div>

      {/* Connect Claude Desktop */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Plug className="h-3.5 w-3.5 text-muted-foreground" />
            Connect Claude Desktop
          </h2>
          <p className="text-xs text-muted-foreground">Two steps — no config files, no terminal required.</p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Step 1 */}
          <div className="p-5 border-b border-border space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <p className="text-sm font-medium">Open Claude Desktop</p>
            </div>
            <div className="ml-9 space-y-2">
              <p className="text-xs text-muted-foreground">
                Go to <span className="font-medium text-foreground">Settings → Developer → MCP Servers</span> and click <span className="font-medium text-foreground">Add server</span>.
              </p>
              <a
                href="claude://settings/developer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                Open Claude Desktop Settings
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <p className="text-sm font-medium">Enter this URL</p>
            </div>
            <div className="ml-9 space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted border border-border rounded-lg px-3 py-2.5 text-foreground truncate">
                  {mcpUrl}
                </code>
                <Button
                  size="sm"
                  variant={copied ? 'default' : 'outline'}
                  className="shrink-0 h-9 gap-1.5 transition-all"
                  onClick={copyUrl}
                >
                  {copied ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" />Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" />Copy</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Claude will open your browser to authorize. Sign in to Nokloo and click <span className="font-medium text-foreground">Authorize</span> — done.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected clients */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            Connected clients
          </h2>
          <p className="text-xs text-muted-foreground">
            Each time you connect a new Claude Desktop, it appears here. Revoke to disconnect.
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-1.5">
            <Plug className="h-5 w-5 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">No clients connected yet</p>
            <p className="text-xs text-muted-foreground/60">Follow the steps above to connect Claude Desktop</p>
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

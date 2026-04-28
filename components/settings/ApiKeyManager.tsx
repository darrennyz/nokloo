'use client'

import { useState } from 'react'
import { Copy, Trash2, Key, Plug, CheckCircle2, Plus, Eye, EyeOff, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ApiKey } from '@/types'

interface ApiKeyManagerProps {
  initialKeys: ApiKey[]
  userId: string
  appUrl: string
}

// Minified stdio proxy — runs as `node -e SCRIPT` inside Claude Desktop
// Reads JSON-RPC from stdin, forwards to Nokloo, writes response to stdout
function buildProxyScript(apiKey: string, hostname: string): string {
  return `const k='${apiKey}';const h=require('https');let b='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>{b+=c;let i;while((i=b.indexOf('\\n'))!==-1){const l=b.slice(0,i).trim();b=b.slice(i+1);if(l){const r=h.request({hostname:'${hostname}',path:'/api/mcp',method:'POST',headers:{'Content-Type':'application/json','x-api-key':k}},s=>{let d='';s.on('data',x=>d+=x);s.on('end',()=>process.stdout.write(d+'\\n'))});r.on('error',e=>process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:null,error:{code:-32603,message:e.message}})+'\\n'));r.write(l);r.end()}}});`
}

function buildConfig(apiKey: string, hostname: string): string {
  return JSON.stringify({
    mcpServers: {
      nokloo: {
        command: 'node',
        args: ['-e', buildProxyScript(apiKey, hostname)],
      },
    },
  }, null, 2)
}

export function ApiKeyManager({ initialKeys, userId, appUrl }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [copiedConfig, setCopiedConfig] = useState(false)

  const hostname = new URL(appUrl).hostname

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() || 'Claude Desktop' }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); setCreating(false); return }
    setKeys((prev) => [data.key as ApiKey, ...prev])
    setNewKeyValue(data.rawKey as string)
    setNewKeyName('')
    setCreating(false)
  }

  async function handleRevoke(id: string, name: string) {
    const supabase = createClient()
    const { error } = await supabase.from('api_keys').delete().eq('id', id).eq('user_id', userId)
    if (error) { toast.error('Failed to revoke'); return }
    setKeys((prev) => prev.filter((k) => k.id !== id))
    toast.success(`"${name}" disconnected`)
  }

  function copyConfig() {
    if (!newKeyValue) return
    navigator.clipboard.writeText(buildConfig(newKeyValue, hostname))
    setCopiedConfig(true)
    toast.success('Config copied!')
    setTimeout(() => setCopiedConfig(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-2xl font-700 tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Connect Claude Desktop to your Nokloo workspace</p>
      </div>

      {/* Step 1: Generate key */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            Connect Claude Desktop
          </h2>
          <p className="text-xs text-muted-foreground">
            3 steps — no terminal, no installs required.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {/* Step 1 */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <p className="text-sm font-medium">Generate a connection key</p>
            </div>
            <div className="ml-9">
              <form onSubmit={handleCreate} className="flex gap-2">
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Label (e.g. My MacBook)"
                  className="flex-1 h-9 text-sm"
                />
                <Button type="submit" disabled={creating} size="sm" className="gap-1.5 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                  {creating ? 'Generating…' : 'Generate'}
                </Button>
              </form>
            </div>

            {/* Show generated key */}
            {newKeyValue && (
              <div className="ml-9 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Key generated — proceed to step 2.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-background border border-border rounded-md px-2.5 py-1.5 break-all">
                    {showKey ? newKeyValue : `${newKeyValue.slice(0, 14)}••••••••••••••••••••••`}
                  </code>
                  <button
                    onClick={() => setShowKey((s) => !s)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Save this key somewhere safe — it won&apos;t be shown again.</p>
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className={`p-5 space-y-3 transition-opacity ${!newKeyValue ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <p className="text-sm font-medium">Copy your Claude Desktop config</p>
            </div>
            <div className="ml-9 space-y-2">
              <p className="text-xs text-muted-foreground">
                This snippet connects Claude Desktop to Nokloo — no extra installs needed.
              </p>
              <Button
                size="sm"
                variant={copiedConfig ? 'default' : 'outline'}
                className="gap-1.5 transition-all"
                onClick={copyConfig}
                disabled={!newKeyValue}
              >
                {copiedConfig ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" />Copied!</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" />Copy config snippet</>
                )}
              </Button>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`p-5 space-y-3 transition-opacity ${!newKeyValue ? 'opacity-40' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <p className="text-sm font-medium">Paste into Claude Desktop config</p>
            </div>
            <div className="ml-9 space-y-3">
              <ol className="space-y-1.5 text-xs text-muted-foreground list-none">
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-medium shrink-0">a.</span>
                  <span>In Claude Desktop: <span className="text-foreground font-medium">Settings → Developer → Edit Config</span></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-medium shrink-0">b.</span>
                  <span>Replace the <code className="font-mono bg-muted px-1 rounded text-[11px]">&quot;mcpServers&quot;: {'{}'}</code> section with what you just copied</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-medium shrink-0">c.</span>
                  <span>Save the file, then fully quit Claude Desktop (<span className="text-foreground font-medium">Cmd+Q</span>) and reopen it</span>
                </li>
              </ol>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <Terminal className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Node.js must be installed. Most developers already have it — check with <code className="font-mono">node -v</code> in Terminal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connected clients */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Plug className="h-3.5 w-3.5 text-muted-foreground" />
            Connected clients
          </h2>
          <p className="text-xs text-muted-foreground">Revoke a key to disconnect that client.</p>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center space-y-1.5">
            <Plug className="h-5 w-5 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">No clients connected yet</p>
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

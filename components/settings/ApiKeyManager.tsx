'use client'

import { useState } from 'react'
import { Copy, Trash2, Plus, Key, Terminal, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ApiKey } from '@/types'

interface ApiKeyManagerProps {
  initialKeys: ApiKey[]
  userId: string
}

export function ApiKeyManager({ initialKeys, userId }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [newKeyName, setNewKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [showMcpDialog, setShowMcpDialog] = useState(false)
  const [showKey, setShowKey] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() || 'Default' }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); setCreating(false); return }
    setKeys((prev) => [data.key as ApiKey, ...prev])
    setNewKeyValue(data.rawKey as string)
    setNewKeyName('')
    setCreating(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('api_keys').delete().eq('id', id).eq('user_id', userId)
    if (error) { toast.error('Failed to delete'); return }
    setKeys((prev) => prev.filter((k) => k.id !== id))
    toast.success('Key deleted')
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied')
  }

  const mcpConfig = newKeyValue
    ? JSON.stringify({
        mcpServers: {
          nokloo: {
            type: 'http',
            url: `${typeof window !== 'undefined' ? window.location.origin : 'https://your-nokloo.vercel.app'}/api/mcp`,
            headers: { 'x-api-key': newKeyValue },
          },
        },
      }, null, 2)
    : null

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-2xl font-700 tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">API keys and Claude integration</p>
      </div>

      {/* API Keys section */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-3.5 w-3.5 text-muted-foreground" />
            API Keys
          </h2>
          <p className="text-xs text-muted-foreground">Generate a key to connect Claude to Nokloo via MCP.</p>
        </div>

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. Claude Desktop)"
            className="flex-1 h-9 text-sm"
          />
          <Button type="submit" disabled={creating} size="sm" className="gap-1.5 shrink-0">
            <Plus className="h-3.5 w-3.5" />
            {creating ? 'Generating…' : 'Generate'}
          </Button>
        </form>

        {/* Newly created key */}
        {newKeyValue && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <p className="text-xs font-medium text-emerald-500">Copy your key now — it won&apos;t be shown again.</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <code className="block text-xs bg-background border border-border rounded-md px-3 py-2 font-mono break-all pr-8">
                  {showKey ? newKeyValue : newKeyValue.slice(0, 12) + '••••••••••••••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 h-8" onClick={() => copy(newKeyValue)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="sm" variant="ghost" className="text-xs w-full gap-1.5 h-8"
              onClick={() => setShowMcpDialog(true)}>
              <Terminal className="h-3.5 w-3.5" />
              Show Claude MCP config
            </Button>
          </div>
        )}

        {/* Key list */}
        {keys.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
            No API keys yet
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            {keys.map((key, i) => (
              <div
                key={key.id}
                className={`flex items-center justify-between px-4 py-3 ${i !== keys.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Key className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{key.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}••••••••</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {key.last_used_at
                      ? `Used ${new Date(key.last_used_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
                      : 'Never used'}
                  </span>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-1 rounded text-muted-foreground/40 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup guide */}
      <div className="space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
            Connect Claude
          </h2>
          <p className="text-xs text-muted-foreground">Add Nokloo as an MCP server in your Claude config.</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          {[
            { step: '1', text: 'Generate an API key above.' },
            {
              step: '2',
              text: 'Open your Claude Desktop config:',
              code: '~/Library/Application Support/Claude/claude_desktop_config.json',
            },
            {
              step: '3',
              text: 'Add the Nokloo MCP server:',
              code: `{
  "mcpServers": {
    "nokloo": {
      "type": "http",
      "url": "https://your-nokloo.vercel.app/api/mcp",
      "headers": { "x-api-key": "your-api-key" }
    }
  }
}`,
            },
            { step: '4', text: 'Restart Claude Desktop.' },
            { step: '5', text: 'Tell Claude your idea and ask it to push it to Nokloo.' },
          ].map(({ step, text, code }) => (
            <div key={step} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step}
              </span>
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{text}</p>
                {code && (
                  <pre className="text-xs font-mono bg-muted rounded-md px-3 py-2 overflow-x-auto whitespace-pre">
                    {code}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MCP config dialog */}
      <Dialog open={showMcpDialog} onOpenChange={setShowMcpDialog}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Claude MCP Config</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Add this to your <code className="font-mono">claude_desktop_config.json</code>. Your API key is embedded.
          </p>
          <div className="relative">
            <pre className="text-xs font-mono bg-muted rounded-lg px-4 py-3 overflow-x-auto whitespace-pre">
              {mcpConfig}
            </pre>
            <Button size="sm" variant="outline" className="absolute top-2 right-2 h-7 text-xs gap-1"
              onClick={() => mcpConfig && copy(mcpConfig)}>
              <Copy className="h-3 w-3" />
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => { setShowMcpDialog(false); setNewKeyValue(null) }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

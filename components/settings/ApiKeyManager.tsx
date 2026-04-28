'use client'

import { useState } from 'react'
import { Copy, Trash2, Plus, Key, Terminal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  const [showDialog, setShowDialog] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() || 'Default' }),
    })

    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed to create key'); setCreating(false); return }

    setKeys((prev) => [data.key as ApiKey, ...prev])
    setNewKeyValue(data.rawKey as string)
    setNewKeyName('')
    setCreating(false)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('api_keys').delete().eq('id', id).eq('user_id', userId)
    if (error) { toast.error('Failed to delete key'); return }
    setKeys((prev) => prev.filter((k) => k.id !== id))
    toast.success('Key deleted')
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const mcpConfig = newKeyValue
    ? JSON.stringify({
        mcpServers: {
          nokloo: {
            url: `${typeof window !== 'undefined' ? window.location.origin : 'https://your-nokloo-url.vercel.app'}/api/mcp`,
            headers: { 'x-api-key': newKeyValue },
          },
        },
      }, null, 2)
    : null

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your API keys and Claude integration</p>
      </div>

      {/* Generate new key */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </CardTitle>
          <CardDescription>
            Generate a key and add it to your Claude MCP configuration to connect Claude to Nokloo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Claude Desktop)"
              className="flex-1"
            />
            <Button type="submit" disabled={creating} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {creating ? 'Generating…' : 'Generate key'}
            </Button>
          </form>

          {/* Show newly created key */}
          {newKeyValue && (
            <div className="rounded-md bg-green-400/10 border border-green-400/20 p-4 space-y-2">
              <p className="text-xs font-medium text-green-400">
                Copy your key now — it won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-background rounded px-2 py-1 flex-1 font-mono break-all">
                  {newKeyValue}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKeyValue)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs w-full mt-1"
                onClick={() => setShowDialog(true)}
              >
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                Show Claude MCP config
              </Button>
            </div>
          )}

          <Separator />

          {/* Existing keys */}
          {keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No API keys yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}••••••••</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {key.last_used_at ? (
                      <span className="text-xs text-muted-foreground">
                        Last used {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-xs">Never used</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => handleDelete(key.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claude setup guide */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            How to connect Claude
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ol className="space-y-3 list-decimal list-inside">
            <li>Generate an API key above.</li>
            <li>
              Open your Claude config file:
              <code className="block bg-muted rounded px-3 py-2 mt-1.5 text-xs font-mono">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>
            </li>
            <li>
              Add the Nokloo MCP server:
              <pre className="bg-muted rounded px-3 py-2 mt-1.5 text-xs font-mono overflow-x-auto whitespace-pre">
{`{
  "mcpServers": {
    "nokloo": {
      "url": "https://your-nokloo-url.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "your-api-key-here"
      }
    }
  }
}`}
              </pre>
            </li>
            <li>Restart Claude Desktop.</li>
            <li>Describe your idea to Claude and tell it to push the project to Nokloo.</li>
          </ol>
        </CardContent>
      </Card>

      {/* MCP config dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Claude MCP Configuration</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Add this to your <code>claude_desktop_config.json</code>. Your API key is embedded.
          </p>
          <div className="relative">
            <pre className="bg-muted rounded px-3 py-3 text-xs font-mono overflow-x-auto whitespace-pre">
              {mcpConfig}
            </pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 h-7 text-xs"
              onClick={() => mcpConfig && copyToClipboard(mcpConfig)}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => { setShowDialog(false); setNewKeyValue(null) }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

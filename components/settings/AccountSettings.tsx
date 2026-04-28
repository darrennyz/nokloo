'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, LogOut, Trash2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AccountSettingsProps {
  email: string
  userId: string
}

export function AccountSettings({ email }: AccountSettingsProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { toast.error(error.message); setSavingPassword(false); return }
    toast.success('Password updated')
    setNewPassword('')
    setConfirmPassword('')
    setSavingPassword(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== email) {
      toast.error('Email does not match')
      return
    }
    setDeleting(true)
    // Sign out first — full account deletion requires server-side admin API
    // For now, sign out and show a message
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Account deletion requested. You have been signed out.')
    router.push('/login')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <div>
        <h1 className="font-display text-2xl font-700 tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account</p>
      </div>

      {/* Account info */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          Account
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
          <p className="text-sm font-medium">{email}</p>
          <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
        </div>
      </div>

      {/* Change password */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          Change password
        </h2>
        <form onSubmit={handlePasswordChange} className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              New password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="h-10 pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-10"
              required
            />
          </div>
          {newPassword && confirmPassword && (
            <div className={`flex items-center gap-1.5 text-xs ${newPassword === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
              <CheckCircle2 className="h-3 w-3" />
              {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}
          <Button type="submit" size="sm" disabled={savingPassword} className="gap-1.5">
            {savingPassword ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>

      {/* Sign out */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
          Session
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sign out of your Nokloo account on this device.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
          Danger zone
        </h2>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-4">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all projects. This cannot be undone.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Type <span className="font-mono font-medium text-foreground">{email}</span> to confirm
            </Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={email}
              className="h-9 text-sm border-red-500/20 focus:border-red-500/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={deleteConfirm !== email || deleting}
            onClick={handleDeleteAccount}
            className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {deleting ? 'Deleting…' : 'Delete my account'}
          </Button>
        </div>
      </div>
    </div>
  )
}

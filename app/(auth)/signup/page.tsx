'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Account created! Check your email to verify.')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">N</span>
          </div>
          <span className="font-semibold text-lg">Nokloo</span>
        </div>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start managing your projects with AI</CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

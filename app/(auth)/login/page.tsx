import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm animate-pulse space-y-4">
      <div className="h-7 w-24 bg-muted rounded" />
      <div className="h-8 w-40 bg-muted rounded" />
      <div className="h-10 bg-muted rounded" />
      <div className="h-10 bg-muted rounded" />
      <div className="h-10 bg-muted rounded" />
    </div>}>
      <LoginForm />
    </Suspense>
  )
}

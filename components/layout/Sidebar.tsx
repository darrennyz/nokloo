'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground text-xs font-bold">N</span>
        </div>
        <span className="font-semibold text-base tracking-tight">Nokloo</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
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
  const { theme, setTheme } = useTheme()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-full w-52 flex-col border-r border-border bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-[11px] font-bold tracking-tight">N</span>
        </div>
        <span className="font-display font-700 text-[15px] tracking-tight">Nokloo</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-100',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-primary' : '')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom controls */}
      <div className="p-2 border-t border-border space-y-0.5">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-100"
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Moon className="h-3.5 w-3.5 shrink-0" />
          )}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-100"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

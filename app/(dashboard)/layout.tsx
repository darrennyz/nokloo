import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main — overflow-hidden so each page controls its own scroll */}
      <main className="flex-1 overflow-hidden bg-background min-w-0">
        {children}
      </main>

      {/* Bottom nav — mobile only, fixed position */}
      <BottomNav />
    </div>
  )
}

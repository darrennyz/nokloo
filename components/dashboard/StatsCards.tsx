'use client'

import { Lightbulb, PenLine, Hammer, FlaskConical, Rocket } from 'lucide-react'
import type { DashboardStats } from '@/types'

const stats = [
  {
    key: 'ideas' as const,
    label: 'Ideas',
    icon: Lightbulb,
    accent: 'text-amber-500',
    bg: 'bg-amber-500/8 dark:bg-amber-500/10',
    border: 'border-amber-500/15',
  },
  {
    key: 'planning' as const,
    label: 'Planning',
    icon: PenLine,
    accent: 'text-blue-500',
    bg: 'bg-blue-500/8 dark:bg-blue-500/10',
    border: 'border-blue-500/15',
  },
  {
    key: 'building' as const,
    label: 'Building',
    icon: Hammer,
    accent: 'text-orange-500',
    bg: 'bg-orange-500/8 dark:bg-orange-500/10',
    border: 'border-orange-500/15',
  },
  {
    key: 'testing' as const,
    label: 'Testing',
    icon: FlaskConical,
    accent: 'text-violet-500',
    bg: 'bg-violet-500/8 dark:bg-violet-500/10',
    border: 'border-violet-500/15',
  },
  {
    key: 'deployed' as const,
    label: 'Deployed',
    icon: Rocket,
    accent: 'text-emerald-500',
    bg: 'bg-emerald-500/8 dark:bg-emerald-500/10',
    border: 'border-emerald-500/15',
  },
]

export function StatsCards({ data }: { data: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map(({ key, label, icon: Icon, accent, bg, border }) => (
        <div
          key={key}
          className={`rounded-xl border ${border} ${bg} p-4 space-y-3`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Icon className={`h-3.5 w-3.5 ${accent}`} />
          </div>
          <p className={`font-display text-3xl font-700 tracking-tight ${data[key] === 0 ? 'text-muted-foreground/40' : ''}`}>
            {data[key]}
          </p>
        </div>
      ))}
    </div>
  )
}

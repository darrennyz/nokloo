'use client'

import { Lightbulb, Hammer, FlaskConical, Rocket } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { DashboardStats } from '@/types'

const stats = [
  { key: 'ideas' as const, label: 'Ideas', icon: Lightbulb, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { key: 'ongoing' as const, label: 'Ongoing', icon: Hammer, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { key: 'testing' as const, label: 'Testing', icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'deployed' as const, label: 'Deployed', icon: Rocket, color: 'text-green-400', bg: 'bg-green-400/10' },
]

export function StatsCards({ data }: { data: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map(({ key, label, icon: Icon, color, bg }) => (
        <Card key={key} className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
              <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold">{data[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

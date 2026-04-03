import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertTriangle, Clock, BookOpen, FileText, X } from 'lucide-react'
import { useState } from 'react'

interface Alert {
  key: string
  icon: typeof AlertTriangle
  color: string
  message: string
  count: number
}

export default function AlertsBanner() {
  const [dismissed, setDismissed] = useState(false)

  const alerts = useQuery({
    queryKey: ['alerts-banner'],
    queryFn: async (): Promise<Alert[]> => {
      const results: Alert[] = []

      // Overdue editorial items
      const { data: overdue } = await supabase
        .from('editorial_calendar')
        .select('id')
        .lt('target_date', new Date().toISOString().split('T')[0])
        .not('status', 'in', '("published","killed")')
      if (overdue && overdue.length > 0) {
        results.push({
          key: 'overdue',
          icon: Clock,
          color: 'text-red-400',
          message: `${overdue.length} overdue editorial item${overdue.length > 1 ? 's' : ''}`,
          count: overdue.length,
        })
      }

      // Stale hub pages (>14 days)
      const cutoff14 = new Date()
      cutoff14.setDate(cutoff14.getDate() - 14)
      const { data: staleHubs } = await supabase
        .from('pages')
        .select('id')
        .eq('status', 'published')
        .lt('updated_at', cutoff14.toISOString())
        .not('hub_beat', 'is', null)
      if (staleHubs && staleHubs.length > 0) {
        results.push({
          key: 'stale-hubs',
          icon: FileText,
          color: 'text-yellow-400',
          message: `${staleHubs.length} stale hub page${staleHubs.length > 1 ? 's' : ''}`,
          count: staleHubs.length,
        })
      }

      // Stale beat research (>14 days)
      const { data: staleBeats } = await supabase
        .from('beat_research')
        .select('id')
        .lt('updated_at', cutoff14.toISOString())
      if (staleBeats && staleBeats.length > 0) {
        results.push({
          key: 'stale-beats',
          icon: BookOpen,
          color: 'text-orange-400',
          message: `${staleBeats.length} stale beat research file${staleBeats.length > 1 ? 's' : ''}`,
          count: staleBeats.length,
        })
      }

      return results
    },
    staleTime: 300_000, // 5 min
  })

  if (dismissed || !alerts.data || alerts.data.length === 0) return null

  return (
    <div className="mb-6 bg-[var(--color-surface)] border border-amber-500/20 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Alerts</span>
          </div>
          {alerts.data.map((alert) => {
            const Icon = alert.icon
            return (
              <span key={alert.key} className={`text-xs flex items-center gap-1.5 ${alert.color}`}>
                <Icon size={12} />
                {alert.message}
              </span>
            )
          })}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/status"
            className="text-[10px] font-semibold text-[var(--color-accent-hover)] hover:underline"
          >
            View Details
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

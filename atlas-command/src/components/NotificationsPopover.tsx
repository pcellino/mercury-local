import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AlertTriangle, Clock, FileText, BookOpen } from 'lucide-react'

interface NotificationsPopoverProps {
  open: boolean
  onClose: () => void
}

interface Alert {
  key: string
  icon: typeof AlertTriangle
  color: string
  bgColor: string
  message: string
  detail: string
  count: number
}

export default function NotificationsPopover({ open, onClose }: NotificationsPopoverProps) {
  const alerts = useQuery({
    queryKey: ['notifications-popover'],
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
          bgColor: 'bg-red-400/10',
          message: `${overdue.length} overdue editorial item${overdue.length > 1 ? 's' : ''}`,
          detail: 'Past target date, not published or killed',
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
          bgColor: 'bg-yellow-400/10',
          message: `${staleHubs.length} stale hub page${staleHubs.length > 1 ? 's' : ''}`,
          detail: 'Not updated in 14+ days',
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
          bgColor: 'bg-orange-400/10',
          message: `${staleBeats.length} stale beat file${staleBeats.length > 1 ? 's' : ''}`,
          detail: 'Research not refreshed in 14+ days',
          count: staleBeats.length,
        })
      }

      return results
    },
    enabled: open,
    staleTime: 300_000,
  })

  if (!open) return null

  return (
    <div className="absolute top-2 right-4 z-40 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-[13px] font-semibold">Notifications</h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {(!alerts.data || alerts.data.length === 0) && (
          <div className="px-4 py-8 text-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">All clear — no alerts</p>
          </div>
        )}

        {alerts.data?.map((alert) => {
          const Icon = alert.icon
          return (
            <div key={alert.key} className="px-4 py-3 border-b border-[var(--color-border)] last:border-b-0">
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${alert.bgColor} mt-0.5`}>
                  <Icon size={14} className={alert.color} />
                </div>
                <div>
                  <p className="text-[13px] font-medium">{alert.message}</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{alert.detail}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {alerts.data && alerts.data.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
          <Link
            to="/settings?tab=system"
            onClick={onClose}
            className="text-[12px] text-[var(--color-accent-hover)] hover:underline"
          >
            View system status
          </Link>
        </div>
      )}
    </div>
  )
}

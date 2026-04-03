import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { X, FileText, Calendar, Tag, Users, Newspaper } from 'lucide-react'

interface ActivityDrawerProps {
  open: boolean
  onClose: () => void
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-400',
  publish: 'text-emerald-400',
  status_change: 'text-purple-400',
  delete: 'text-red-400',
  update: 'text-blue-400',
  schedule: 'text-cyan-400',
}

const ENTITY_ICONS: Record<string, typeof FileText> = {
  post: Newspaper,
  page: FileText,
  editorial: Calendar,
  tag: Tag,
  author: Users,
}

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return `${days}d`
}

export default function ActivityDrawer({ open, onClose }: ActivityDrawerProps) {
  const { data } = useQuery({
    queryKey: ['activity-drawer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, created_at, action, entity_type, entity_title')
        .order('created_at', { ascending: false })
        .limit(40)
      if (error) throw error
      return data ?? []
    },
    enabled: open,
    refetchInterval: 30_000,
  })

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl transform transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-[14px] font-semibold">Activity</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-57px)]">
          {!data && (
            <div className="px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">Loading...</div>
          )}
          {data?.map((entry) => {
            const Icon = ENTITY_ICONS[entry.entity_type] ?? FileText
            return (
              <div key={entry.id} className="px-5 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon size={14} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-snug truncate">{entry.entity_title ?? 'Untitled'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-medium ${ACTION_COLORS[entry.action] ?? 'text-slate-400'}`}>
                        {entry.action.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{entry.entity_type}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">{timeAgo(entry.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

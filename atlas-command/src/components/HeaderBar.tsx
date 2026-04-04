import { Search, Bell, History } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { todayET } from '../lib/utils'

interface HeaderBarProps {
  onOpenActivity: () => void
  onToggleNotifications: () => void
  notificationsOpen: boolean
}

export default function HeaderBar({ onOpenActivity, onToggleNotifications, notificationsOpen }: HeaderBarProps) {
  // Badge count for notifications
  const alertCount = useQuery({
    queryKey: ['alert-count'],
    queryFn: async () => {
      const today = todayET()
      const { count } = await supabase
        .from('editorial_calendar')
        .select('id', { count: 'exact', head: true })
        .lt('target_date', today)
        .not('status', 'in', '("published","killed")')
      return count ?? 0
    },
    staleTime: 300_000,
  })

  return (
    <header className="h-12 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-5">
      {/* Search trigger */}
      <button
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
        }}
        className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
      >
        <Search size={14} strokeWidth={1.75} />
        <span>Search</span>
        <kbd className="ml-1 text-[10px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-1.5 py-0.5 font-mono">
          {'\u2318'}K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenActivity}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          title="Activity log"
        >
          <History size={16} strokeWidth={1.75} />
        </button>
        <button
          onClick={onToggleNotifications}
          className={`p-2 rounded-lg transition-colors relative ${
            notificationsOpen
              ? 'text-[var(--color-accent-hover)] bg-[var(--color-accent)]/10'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
          }`}
          title="Notifications"
        >
          <Bell size={16} strokeWidth={1.75} />
          {(alertCount.data ?? 0) > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  )
}

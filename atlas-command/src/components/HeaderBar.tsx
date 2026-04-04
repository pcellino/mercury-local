import { Search, Bell, History, Menu } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { todayET } from '../lib/utils'

interface HeaderBarProps {
  onOpenActivity: () => void
  onToggleNotifications: () => void
  notificationsOpen: boolean
  onOpenMobileNav?: () => void
}

export default function HeaderBar({ onOpenActivity, onToggleNotifications, notificationsOpen, onOpenMobileNav }: HeaderBarProps) {
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
    <header className="h-12 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-3 sm:px-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-2">
        {onOpenMobileNav && (
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
        )}
        {/* Search trigger */}
        <button
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
          }}
          className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          aria-label="Open search (Command+K)"
        >
          <Search size={14} strokeWidth={1.75} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline ml-1 text-[10px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-1.5 py-0.5 font-mono">
            {'\u2318'}K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenActivity}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
          title="Activity log"
          aria-label="Open activity log"
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
          aria-label={`Notifications${(alertCount.data ?? 0) > 0 ? ` (${alertCount.data} overdue)` : ''}`}
        >
          <Bell size={16} strokeWidth={1.75} />
          {(alertCount.data ?? 0) > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  )
}

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, Newspaper, Activity, LogOut } from 'lucide-react'
import { useAuth } from '../lib/auth'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Newsroom' },
  { to: '/editorial', icon: Calendar, label: 'Editorial Calendar' },
  { to: '/recent', icon: Newspaper, label: 'Recent Posts' },
  { to: '/status', icon: Activity, label: 'Status & Alerts' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="w-56 shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <h1 className="text-base font-bold tracking-tight">
          <span className="text-[var(--color-accent-hover)]">ATLAS</span>{' '}
          <span className="text-[var(--color-text-muted)] font-normal">Command</span>
        </h1>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 uppercase tracking-widest">Mercury Local Ops</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--color-border)]">
        {user ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[var(--color-text)] font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-green-400">Authenticated</p>
            </div>
            <button
              onClick={() => signOut()}
              className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[10px] text-yellow-400">Read-only mode</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Sign in for write access</p>
          </div>
        )}
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Phase 2 · v0.2.0</p>
      </div>
    </aside>
  )
}

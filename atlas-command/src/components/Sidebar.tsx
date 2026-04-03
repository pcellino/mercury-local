import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublications } from '../lib/queries'
import { LayoutDashboard, Calendar, CalendarDays, Newspaper, Activity, LogOut, BarChart3, ChevronDown, ChevronRight, FileText, FolderOpen, Rss, Shield, PlusCircle, Tag, Users, Layout, History, Settings, Bell } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Newsroom' },
  { to: '/editorial', icon: Calendar, label: 'Editorial Calendar' },
  { to: '/recent', icon: Newspaper, label: 'Recent Posts' },
  { to: '/schedule', icon: CalendarDays, label: 'Schedule' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/feeds', icon: Rss, label: 'Feed Monitor' },
  { to: '/transcripts', icon: FileText, label: 'Transcripts' },
  { to: '/sources', icon: FolderOpen, label: 'Sources' },
  { to: '/competitors', icon: Shield, label: 'Competitors' },
  { to: '/tags', icon: Tag, label: 'Tags' },
  { to: '/authors', icon: Users, label: 'Authors' },
  { to: '/hubs', icon: Layout, label: 'Hub Pages' },
  { to: '/activity', icon: History, label: 'Activity Log' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/status', icon: Activity, label: 'Status & Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const [pubsOpen, setPubsOpen] = useState(true)
  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

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
      <nav className="flex-1 py-3 px-3 flex flex-col gap-0.5 overflow-y-auto">
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

        {/* Quick create */}
        <NavLink
          to="/posts/new"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mt-2 transition-colors ${
              isActive
                ? 'bg-green-500/10 text-green-400 font-medium'
                : 'text-green-400/70 hover:text-green-400 hover:bg-green-500/5'
            }`
          }
        >
          <PlusCircle size={16} />
          New Post
        </NavLink>

        {/* Publications section */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
          <button
            onClick={() => setPubsOpen(!pubsOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest hover:text-[var(--color-text)] transition-colors"
          >
            Publications
            {pubsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {pubsOpen && publications && (
            <div className="mt-1 flex flex-col gap-0.5">
              {publications
                .filter(p => p.domain) // only show pubs with domains
                .map((pub) => (
                <NavLink
                  key={pub.slug}
                  to={`/publications/${pub.slug}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] font-medium'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                    }`
                  }
                >
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: PUB_COLORS[pub.slug] ?? '#6366f1' }}
                  >
                    {(PUB_SHORT[pub.slug] ?? pub.slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                  </span>
                  <span className="truncate">{pub.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
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
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">Phase 12 · v0.12.0</p>
      </div>
    </aside>
  )
}

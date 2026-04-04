import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublications } from '../lib/queries'
import { LayoutDashboard, Calendar, Newspaper, Radio, Settings, PlusCircle, LogOut, ChevronDown, ChevronRight, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { useState, useEffect } from 'react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Desk' },
  { to: '/editorial', icon: Calendar, label: 'Editorial' },
  { to: '/content', icon: Newspaper, label: 'Content' },
  { to: '/intel', icon: Radio, label: 'Intel' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { signOut } = useAuth()
  const [pubsOpen, setPubsOpen] = useState(true)
  const location = useLocation()
  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

  // Close mobile sidebar on navigation
  useEffect(() => {
    onMobileClose?.()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-52 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border)] flex items-center justify-between" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <h1 className="text-[15px] font-semibold tracking-tight">
          <span className="text-[var(--color-accent-hover)]">ATLAS</span>{' '}
          <span className="text-[var(--color-text-muted)] font-normal text-[13px]">Command</span>
        </h1>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] font-medium'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
              }`
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}

        {/* New Post */}
        <NavLink
          to="/posts/new"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] mt-3 transition-colors ${
              isActive
                ? 'bg-green-500/10 text-green-400 font-medium'
                : 'text-green-400/70 hover:text-green-400 hover:bg-green-500/5'
            }`
          }
        >
          <PlusCircle size={16} strokeWidth={1.75} />
          New Post
        </NavLink>

        {/* Publications */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border)]">
          <button
            onClick={() => setPubsOpen(!pubsOpen)}
            className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider hover:text-[var(--color-text)] transition-colors"
            aria-label={pubsOpen ? 'Collapse publications list' : 'Expand publications list'}
            aria-expanded={pubsOpen}
          >
            Publications
            {pubsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {pubsOpen && publications && (
            <div className="mt-1 flex flex-col gap-0.5">
              {publications
                .filter(p => p.domain)
                .map((pub) => (
                <NavLink
                  key={pub.slug}
                  to={`/publications/${pub.slug}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] font-medium'
                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                    }`
                  }
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
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
      <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-muted)]">v0.16.0</span>
        <button
          onClick={() => signOut()}
          className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-400/5"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
    </>
  )
}

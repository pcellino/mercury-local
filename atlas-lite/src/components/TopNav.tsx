import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Newspaper, CalendarDays, BarChart3, Rocket, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Home', icon: Newspaper },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/deployments', label: 'Deploys', icon: Rocket },
]

export default function TopNav() {
  const { signOut } = useAuth()

  return (
    <header className="bg-white border-b border-mercury-rule">
      {/* Masthead */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2 text-center">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-black tracking-tight text-mercury-ink" style={{ fontFamily: 'var(--font-display)' }}>
          The Mercury Dashboard
        </h1>
        <p className="text-xs text-mercury-muted tracking-widest uppercase mt-0.5" style={{ fontFamily: 'var(--font-ui)' }}>
          Mercury Local Operations
        </p>
      </div>

      {/* Rule */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rule-double" />
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between py-2">
        <div className="flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? 'text-mercury-accent bg-mercury-accent/5'
                    : 'text-mercury-muted hover:text-mercury-ink hover:bg-mercury-surface'
                }`
              }
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-mercury-muted hover:text-mercury-ink transition-colors"
          title="Sign out"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </nav>
    </header>
  )
}

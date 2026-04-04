import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import ErrorBoundary from './ErrorBoundary'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-mercury-cream">
      <TopNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-mercury-rule py-4 text-center text-xs text-mercury-muted">
        Mercury Local LLC &middot; Atlas Dashboard v0.1
      </footer>
    </div>
  )
}

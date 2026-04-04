import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-4xl font-black text-mercury-ink mb-2" style={{ fontFamily: 'var(--font-display)' }}>404</h2>
      <p className="text-sm text-mercury-muted mb-4">Page not found.</p>
      <Link to="/" className="text-sm text-mercury-accent hover:underline">
        Return to the Dashboard
      </Link>
    </div>
  )
}

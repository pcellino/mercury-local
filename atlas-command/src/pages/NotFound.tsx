import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <p className="text-5xl font-bold text-[var(--color-text-muted)]">404</p>
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] max-w-sm">
          This route doesn't exist in Atlas Command. It may have been moved during a recent consolidation.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Back to Desk
        </Link>
      </div>
    </div>
  )
}

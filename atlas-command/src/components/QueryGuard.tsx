import type { UseQueryResult } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface QueryGuardProps {
  queries: UseQueryResult<unknown, Error>[]
  children: React.ReactNode
  /** Show a compact inline indicator instead of a full-page state */
  inline?: boolean
}

/**
 * Wraps children with loading/error states derived from one or more TanStack queries.
 * Shows loading skeleton while ANY query is loading.
 * Shows error state if ANY query has an error (with retry button).
 * Renders children once all queries have data.
 */
export default function QueryGuard({ queries, children, inline }: QueryGuardProps) {
  const isLoading = queries.some(q => q.isLoading)
  const error = queries.find(q => q.error)?.error
  const refetchAll = () => queries.forEach(q => q.refetch())

  if (isLoading) {
    if (inline) {
      return (
        <div className="flex items-center gap-2 py-3">
          <div className="w-4 h-4 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
          <span className="text-[13px] text-[var(--color-text-muted)]">Loading…</span>
        </div>
      )
    }
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
          <p className="text-[13px] text-[var(--color-text-muted)]">Loading…</p>
        </div>
      </div>
    )
  }

  if (error) {
    if (inline) {
      return (
        <div className="flex items-center gap-2 py-3 text-red-400">
          <AlertTriangle size={14} />
          <span className="text-[13px]">{error.message}</span>
          <button onClick={refetchAll} className="text-[12px] text-[var(--color-accent-hover)] hover:underline ml-1">
            Retry
          </button>
        </div>
      )
    }
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="max-w-sm text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-red-400/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <p className="text-[14px] font-medium">Failed to load data</p>
          <p className="text-[13px] text-[var(--color-text-muted)]">{error.message}</p>
          <button
            onClick={refetchAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

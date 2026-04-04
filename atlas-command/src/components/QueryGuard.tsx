import type { UseQueryResult } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface QueryGuardProps {
  queries: UseQueryResult<unknown, Error>[]
  children: React.ReactNode
  /** Show a compact inline indicator instead of a full-page state */
  inline?: boolean
}

/** Shimmer bar used in skeleton loading states */
function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`rounded bg-[var(--color-surface-2)] animate-pulse ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

/** Full-page skeleton: simulates a dashboard card layout */
function PageSkeleton() {
  return (
    <div className="flex-1 py-8 space-y-6" aria-busy="true" aria-label="Loading content">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <SkeletonBar className="h-6 w-48" />
        <SkeletonBar className="h-4 w-72" />
      </div>
      {/* Card row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-8 w-16" />
            <SkeletonBar className="h-3 w-full" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
        <SkeletonBar className="h-4 w-32 mb-4" />
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 flex-1" />
            <SkeletonBar className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Inline skeleton: a compact row placeholder */
function InlineSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3" aria-busy="true" aria-label="Loading">
      <SkeletonBar className="h-4 w-4 rounded-full" />
      <SkeletonBar className="h-4 w-40" />
    </div>
  )
}

/**
 * Wraps children with loading/error states derived from one or more TanStack queries.
 * Shows skeleton placeholders while ANY query is loading.
 * Shows error state if ANY query has an error (with retry button).
 * Renders children once all queries have data.
 */
export default function QueryGuard({ queries, children, inline }: QueryGuardProps) {
  const isLoading = queries.some(q => q.isLoading)
  const error = queries.find(q => q.error)?.error
  const refetchAll = () => queries.forEach(q => q.refetch())

  if (isLoading) {
    return inline ? <InlineSkeleton /> : <PageSkeleton />
  }

  if (error) {
    if (inline) {
      return (
        <div className="flex items-center gap-2 py-3 text-red-400" role="alert">
          <AlertTriangle size={14} />
          <span className="text-[13px]">{error.message}</span>
          <button onClick={refetchAll} className="text-[12px] text-[var(--color-accent-hover)] hover:underline ml-1">
            Retry
          </button>
        </div>
      )
    }
    return (
      <div className="flex-1 flex items-center justify-center py-20" role="alert">
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

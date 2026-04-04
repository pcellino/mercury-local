import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { UseQueryResult } from '@tanstack/react-query'
import QueryGuard from './QueryGuard'

function makeQuery(overrides: Partial<UseQueryResult<unknown, Error>> = {}): UseQueryResult<unknown, Error> {
  return {
    data: undefined,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
    status: 'success',
    fetchStatus: 'idle',
    isFetching: false,
    isRefetching: false,
    isPending: false,
    isLoadingError: false,
    isRefetchError: false,
    isPaused: false,
    isStale: false,
    isPlaceholderData: false,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    refetch: vi.fn(),
    promise: Promise.resolve() as any,
    ...overrides,
  } as UseQueryResult<unknown, Error>
}

describe('QueryGuard', () => {
  it('renders children when all queries succeed', () => {
    render(
      <QueryGuard queries={[makeQuery({ data: { ok: true } })]}>
        <p>Content loaded</p>
      </QueryGuard>,
    )
    expect(screen.getByText('Content loaded')).toBeInTheDocument()
  })

  it('shows skeleton when loading (full page)', () => {
    const { container } = render(
      <QueryGuard queries={[makeQuery({ isLoading: true })]}>
        <p>Should not appear</p>
      </QueryGuard>,
    )
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('shows inline skeleton when loading with inline prop', () => {
    const { container } = render(
      <QueryGuard queries={[makeQuery({ isLoading: true })]} inline>
        <p>Should not appear</p>
      </QueryGuard>,
    )
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('shows error state with retry button', () => {
    render(
      <QueryGuard queries={[makeQuery({ error: new Error('Network failed'), isLoading: false })]}>
        <p>Should not appear</p>
      </QueryGuard>,
    )
    expect(screen.getByText('Network failed')).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('shows error for multiple queries where one fails', () => {
    render(
      <QueryGuard
        queries={[
          makeQuery({ data: { ok: true } }),
          makeQuery({ error: new Error('Query 2 failed'), isLoading: false }),
        ]}
      >
        <p>Should not appear</p>
      </QueryGuard>,
    )
    expect(screen.getByText('Query 2 failed')).toBeInTheDocument()
  })
})

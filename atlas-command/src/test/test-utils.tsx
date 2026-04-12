import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

/**
 * Create a fresh QueryClient per test — no shared state, no retries.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string
  queryClient?: QueryClient
}

/**
 * Render with QueryClientProvider + MemoryRouter.
 * Use for any component that depends on TanStack Query or React Router.
 */
export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', queryClient = createTestQueryClient(), ...opts }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
  return { ...render(ui, { wrapper: Wrapper, ...opts }), queryClient }
}

/** Mock publication row */
export function mockPublication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pub-001', name: 'The Charlotte Mercury', slug: 'charlotte-mercury',
    domain: 'cltmercury.com', tagline: 'Charlotte news', region: 'Charlotte, NC',
    status: 'active', logo_url: null, created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z', ...overrides,
  }
}

/** Mock post row */
export function mockPost(overrides: Record<string, unknown> = {}) {
  return {
    id: 'post-001', title: 'Test Article', slug: 'test-article', status: 'published',
    beat: 'sports', publication_id: 'pub-001', author_id: 'author-001',
    pub_date: '2026-04-03T12:00:00Z', content: 'Content.', excerpt: 'Excerpt.',
    hero_image_url: null, hero_image_width: 1536, hero_image_height: 1024,
    created_at: '2026-04-03T10:00:00Z', updated_at: '2026-04-03T12:00:00Z', ...overrides,
  }
}

export * from '@testing-library/react'

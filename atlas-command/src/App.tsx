import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

// Lazy-loaded page components — each gets its own chunk
const PublishersDesk = lazy(() => import('./pages/PublishersDesk'))
const Newsroom = lazy(() => import('./pages/Newsroom'))
const Editorial = lazy(() => import('./pages/Editorial'))
const Content = lazy(() => import('./pages/Content'))
const Intel = lazy(() => import('./pages/Intel'))
const PostEditor = lazy(() => import('./pages/PostEditor'))
const PageEditor = lazy(() => import('./pages/PageEditor'))
const Publication = lazy(() => import('./pages/Publication'))
const PostCreate = lazy(() => import('./pages/PostCreate'))
const Events = lazy(() => import('./pages/Events'))
const Settings = lazy(() => import('./pages/Settings'))
const MEStandupPage = lazy(() => import('./pages/MEStandupPage'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchInterval: 120_000,
    },
  },
})

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-text-muted)] text-sm">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Full-screen routes — no sidebar Layout */}
        <Route path="me" element={<MEStandupPage />} />

        <Route element={<Layout />}>
          {/* Primary nav */}
          <Route index element={<PublishersDesk />} />
          <Route path="newsroom" element={<Newsroom />} />
          <Route path="editorial" element={<Editorial />} />
          <Route path="events" element={<Events />} />
          <Route path="content" element={<Content />} />
          <Route path="intel" element={<Intel />} />
          <Route path="settings" element={<Settings />} />

          {/* Detail/edit routes */}
          <Route path="posts/new" element={<PostCreate />} />
          <Route path="posts/:id" element={<PostEditor />} />
          <Route path="pages/:id" element={<PageEditor />} />
          <Route path="publications/:slug" element={<Publication />} />

          {/* Redirects from old routes */}
          <Route path="recent" element={<Navigate to="/content" replace />} />
          <Route path="tags" element={<Navigate to="/content?tab=tags" replace />} />
          <Route path="authors" element={<Navigate to="/content?tab=authors" replace />} />
          <Route path="hubs" element={<Navigate to="/content?tab=hubs" replace />} />
          <Route path="feeds" element={<Navigate to="/intel" replace />} />
          <Route path="competitors" element={<Navigate to="/intel?tab=competitors" replace />} />
          <Route path="transcripts" element={<Navigate to="/intel?tab=transcripts" replace />} />
          <Route path="sources" element={<Navigate to="/intel?tab=sources" replace />} />
          <Route path="analytics" element={<Navigate to="/" replace />} />
          <Route path="insights" element={<Navigate to="/" replace />} />
          <Route path="compare" element={<Navigate to="/" replace />} />
          <Route path="activity" element={<Navigate to="/" replace />} />
          <Route path="status" element={<Navigate to="/settings?tab=system" replace />} />
          <Route path="notifications" element={<Navigate to="/settings?tab=system" replace />} />
          <Route path="schedule" element={<Navigate to="/editorial" replace />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import PublishersDesk from './pages/PublishersDesk'
import Newsroom from './pages/Newsroom'
import Editorial from './pages/Editorial'
import Content from './pages/Content'
import Intel from './pages/Intel'
import PostEditor from './pages/PostEditor'
import PageEditor from './pages/PageEditor'
import Publication from './pages/Publication'
import PostCreate from './pages/PostCreate'
import Settings from './pages/Settings'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

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
      <Routes>
        <Route element={<Layout />}>
          {/* Primary nav */}
          <Route index element={<PublishersDesk />} />
          <Route path="newsroom" element={<Newsroom />} />
          <Route path="editorial" element={<Editorial />} />
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

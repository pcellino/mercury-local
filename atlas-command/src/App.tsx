import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Newsroom from './pages/Newsroom'
import Editorial from './pages/Editorial'
import RecentPosts from './pages/RecentPosts'
import Status from './pages/Status'
import Analytics from './pages/Analytics'
import PostEditor from './pages/PostEditor'
import PageEditor from './pages/PageEditor'
import Publication from './pages/Publication'
import Transcripts from './pages/Transcripts'
import Sources from './pages/Sources'
import FeedMonitor from './pages/FeedMonitor'
import Competitors from './pages/Competitors'
import Login from './pages/Login'

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

  // If not logged in, show login page
  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Newsroom />} />
          <Route path="editorial" element={<Editorial />} />
          <Route path="recent" element={<RecentPosts />} />
          <Route path="status" element={<Status />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="posts/:id" element={<PostEditor />} />
          <Route path="pages/:id" element={<PageEditor />} />
          <Route path="publications/:slug" element={<Publication />} />
          <Route path="transcripts" element={<Transcripts />} />
          <Route path="sources" element={<Sources />} />
          <Route path="feeds" element={<FeedMonitor />} />
          <Route path="competitors" element={<Competitors />} />
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

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, FileText, Newspaper, Users, Tag, Layout, Calendar } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'post' | 'page' | 'author' | 'tag' | 'editorial' | 'nav'
  title: string
  subtitle?: string
  path: string
}

const NAV_ITEMS: SearchResult[] = [
  { id: 'nav-home', type: 'nav', title: 'Newsroom', subtitle: 'Dashboard home', path: '/' },
  { id: 'nav-editorial', type: 'nav', title: 'Editorial Calendar', subtitle: 'Plan and track stories', path: '/editorial' },
  { id: 'nav-recent', type: 'nav', title: 'Recent Posts', subtitle: 'Browse all posts', path: '/recent' },
  { id: 'nav-schedule', type: 'nav', title: 'Schedule', subtitle: 'Visual editorial calendar', path: '/schedule' },
  { id: 'nav-analytics', type: 'nav', title: 'Analytics', subtitle: 'Fathom pageviews', path: '/analytics' },
  { id: 'nav-feeds', type: 'nav', title: 'Feed Monitor', subtitle: 'RSS feeds and story leads', path: '/feeds' },
  { id: 'nav-transcripts', type: 'nav', title: 'Transcripts', subtitle: 'Government meetings', path: '/transcripts' },
  { id: 'nav-sources', type: 'nav', title: 'Sources', subtitle: 'Source documents', path: '/sources' },
  { id: 'nav-competitors', type: 'nav', title: 'Competitors', subtitle: 'Competitive intel', path: '/competitors' },
  { id: 'nav-tags', type: 'nav', title: 'Tags', subtitle: 'Manage tags', path: '/tags' },
  { id: 'nav-authors', type: 'nav', title: 'Authors', subtitle: 'Manage authors', path: '/authors' },
  { id: 'nav-hubs', type: 'nav', title: 'Hub Pages', subtitle: 'Beat landing pages', path: '/hubs' },
  { id: 'nav-activity', type: 'nav', title: 'Activity Log', subtitle: 'Audit trail of all actions', path: '/activity' },
  { id: 'nav-insights', type: 'nav', title: 'Insights', subtitle: 'Publishing trends, beat coverage, pipeline', path: '/insights' },
  { id: 'nav-compare', type: 'nav', title: 'Compare Publications', subtitle: 'Side-by-side performance', path: '/compare' },
  { id: 'nav-notifications', type: 'nav', title: 'Notifications', subtitle: 'Alert rules and health checks', path: '/notifications' },
  { id: 'nav-status', type: 'nav', title: 'Status & Alerts', subtitle: 'Health dashboard', path: '/status' },
  { id: 'nav-settings', type: 'nav', title: 'Settings', subtitle: 'Theme, exports, configuration', path: '/settings' },
  { id: 'nav-new', type: 'nav', title: 'New Post', subtitle: 'Create a new post', path: '/posts/new' },
]

const TYPE_ICONS: Record<string, typeof FileText> = {
  post: Newspaper,
  page: Layout,
  author: Users,
  tag: Tag,
  editorial: Calendar,
  nav: Search,
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults(NAV_ITEMS)
      setSelected(0)
    }
  }, [open])

  // Search
  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(NAV_ITEMS)
      return
    }

    setSearching(true)
    const term = `%${q}%`

    try {
      const [postsRes, pagesRes, authorsRes, editorialRes] = await Promise.all([
        supabase.from('posts').select('id, title, slug, status').ilike('title', term).limit(8),
        supabase.from('pages').select('id, title, slug').ilike('title', term).limit(5),
        supabase.from('authors').select('id, name, slug, credentials').ilike('name', term).limit(5),
        supabase.from('editorial_calendar').select('id, concept, status').ilike('concept', term).limit(5),
      ])

      const navMatches = NAV_ITEMS.filter(n =>
        n.title.toLowerCase().includes(q.toLowerCase()) ||
        (n.subtitle?.toLowerCase().includes(q.toLowerCase()))
      )

      const items: SearchResult[] = [
        ...navMatches,
        ...(postsRes.data ?? []).map(p => ({
          id: p.id,
          type: 'post' as const,
          title: p.title,
          subtitle: p.status,
          path: `/posts/${p.id}`,
        })),
        ...(pagesRes.data ?? []).map(p => ({
          id: p.id,
          type: 'page' as const,
          title: p.title,
          subtitle: `/${p.slug}`,
          path: `/pages/${p.id}`,
        })),
        ...(authorsRes.data ?? []).map(a => ({
          id: a.id,
          type: 'author' as const,
          title: a.name,
          subtitle: a.credentials,
          path: '/authors',
        })),
        ...(editorialRes.data ?? []).map(e => ({
          id: e.id,
          type: 'editorial' as const,
          title: e.concept,
          subtitle: e.status,
          path: '/editorial',
        })),
      ]

      setResults(items)
      setSelected(0)
    } finally {
      setSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  function go(result: SearchResult) {
    setOpen(false)
    navigate(result.path)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      go(results[selected])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60" onClick={() => setOpen(false)}>
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-[520px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={16} className="text-[var(--color-text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, pages, authors, or navigate..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-[var(--color-text-muted)]"
          />
          <kbd className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-1.5 py-0.5 font-mono">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {results.length === 0 && !searching && (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
              No results for &quot;{query}&quot;
            </div>
          )}
          {results.map((result, i) => {
            const Icon = TYPE_ICONS[result.type] ?? Search
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => go(result)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === selected
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)]'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <Icon size={14} className="shrink-0 opacity-60" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-[11px] text-[var(--color-text-muted)] truncate">{result.subtitle}</div>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase shrink-0">{result.type}</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] flex items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>esc Close</span>
        </div>
      </div>
    </div>
  )
}

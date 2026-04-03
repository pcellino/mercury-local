import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getRecentPosts, getPublications, getAuthors } from '../lib/queries'
import { updatePostStatusWithLog } from '../lib/mutations'
import { getAllTopPagesMap, siteIdForPub, postPathname } from '../lib/fathom'
import { formatRelative, statusColor, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { Newspaper, Search, ExternalLink, Pencil, Eye, CheckSquare, Square, X } from 'lucide-react'
import { logActivity } from '../lib/mutations'

export default function RecentPosts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [pubFilter, setPubFilter] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [beatFilter, setBeatFilter] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const queryClient = useQueryClient()

  async function handleStatusChange(postId: string, newStatus: string, title?: string, pubId?: string | null) {
    try {
      await updatePostStatusWithLog(postId, newStatus, title, pubId)
      queryClient.invalidateQueries({ queryKey: ['recent-posts-full'] })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (!filtered) return
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)))
    }
  }

  async function handleBulkAction() {
    if (!bulkAction || selectedIds.size === 0) return
    setBulkProcessing(true)
    try {
      const selectedPosts = (posts ?? []).filter(p => selectedIds.has(p.id))
      for (const post of selectedPosts) {
        await updatePostStatusWithLog(post.id, bulkAction, post.title, null)
      }
      await logActivity({
        action: 'bulk_status_change',
        entity_type: 'post',
        entity_title: `${selectedPosts.length} posts → ${bulkAction}`,
        details: { new_status: bulkAction, count: selectedPosts.length, post_ids: [...selectedIds] },
      })
      queryClient.invalidateQueries({ queryKey: ['recent-posts-full'] })
      setSelectedIds(new Set())
      setBulkAction('')
    } catch (err) {
      console.error('Bulk action failed:', err)
    } finally {
      setBulkProcessing(false)
    }
  }

  const { data: posts, isLoading } = useQuery({
    queryKey: ['recent-posts-full', statusFilter],
    queryFn: () => getRecentPosts(100, statusFilter || undefined),
  })

  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

  const { data: authors } = useQuery({
    queryKey: ['authors'],
    queryFn: getAuthors,
  })

  // Fathom bulk pageview lookup (30-day)
  const fathomDateRange = useMemo(() => {
    const to = new Date().toISOString().split('T')[0]
    const d = new Date(); d.setDate(d.getDate() - 30)
    return { from: d.toISOString().split('T')[0], to }
  }, [])
  const { data: pageviewMap } = useQuery({
    queryKey: ['fathom-all-top-pages-map', fathomDateRange.from, fathomDateRange.to],
    queryFn: () => getAllTopPagesMap(fathomDateRange.from, fathomDateRange.to, 100),
    staleTime: 300_000,
  })

  function getPostViews(pubSlug: string, beat: string | null, slug: string): number | null {
    if (!pageviewMap) return null
    const siteId = siteIdForPub(pubSlug)
    if (!siteId) return null
    const path = postPathname(beat, slug)
    return pageviewMap.get(`${siteId}:${path}`) ?? 0
  }

  // Filter posts
  const filtered = (posts ?? []).filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPub = !pubFilter || post.pub_slug === pubFilter
    const matchesAuthor = !authorFilter || post.author_name === authorFilter
    const matchesBeat = !beatFilter || post.beat === beatFilter
    const matchesDate = (() => {
      if (dateRange === 'all' || !post.pub_date) return true
      const postDate = new Date(post.pub_date)
      const now = new Date()
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : Infinity
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      return postDate >= cutoff
    })()

    return matchesSearch && matchesPub && matchesAuthor && matchesBeat && matchesDate
  })

  return (
    <div>
      {isLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>}

      {posts && (
        <>
          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search by article title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-3 flex-wrap">
            <select
              value={pubFilter}
              onChange={(e) => setPubFilter(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="">All Publications</option>
              {publications?.map((pub) => (
                <option key={pub.id} value={pub.slug}>
                  {pub.name}
                </option>
              ))}
            </select>

            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="">All Authors</option>
              {authors?.map((author) => (
                <option key={author.id} value={author.name}>
                  {author.name}
                </option>
              ))}
            </select>

            <select
              value={beatFilter}
              onChange={(e) => setBeatFilter(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="">All Beats</option>
              {Array.from(new Set(posts.map((p) => p.beat).filter((b): b is string => b !== null)))
                .sort()
                .map((beat) => (
                  <option key={beat} value={beat}>
                    {beat}
                  </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-[var(--color-text-muted)]">
            Showing {filtered.length} of {posts.length} articles
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare size={16} className="text-[var(--color-accent-hover)]" />
                <span className="text-sm font-medium">{selectedIds.size} post{selectedIds.size > 1 ? 's' : ''} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs"
                >
                  <option value="">Choose action...</option>
                  <option value="draft">Set Draft</option>
                  <option value="scheduled">Set Scheduled</option>
                  <option value="published">Set Published</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkProcessing}
                  className="px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  {bulkProcessing ? 'Applying...' : 'Apply'}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="px-3 py-2.5 w-8">
                    <button onClick={toggleSelectAll} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                      {filtered && selectedIds.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={14} />
                        : <Square size={14} />
                      }
                    </button>
                  </th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Article</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Pub</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-32">Author</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Beat</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Status</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">
                    <span className="flex items-center gap-1 justify-end"><Eye size={10} /> 30d</span>
                  </th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((post) => (
                    <tr key={post.id} className={`border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50 ${selectedIds.has(post.id) ? 'bg-[var(--color-accent)]/5' : ''}`}>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(post.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                          {selectedIds.has(post.id) ? <CheckSquare size={14} className="text-[var(--color-accent-hover)]" /> : <Square size={14} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/posts/${post.id}`}
                            className="hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5"
                          >
                            <Pencil size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                            {post.title}
                          </Link>
                          <a
                            href={`https://${post.pub_slug === 'charlotte-mercury' ? 'cltmercury.com' : post.pub_slug === 'farmington-mercury' ? 'farmingtonmercury.com' : post.pub_slug === 'strolling-ballantyne' ? 'strollingballantyne.com' : post.pub_slug === 'strolling-firethorne' ? 'strollingfirethorne.com' : post.pub_slug === 'grand-national-today' ? 'grandnationaltoday.com' : post.pub_slug === 'mercury-local' ? 'mercurylocal.com' : 'petercellino.com'}/${post.beat ? post.beat + '/' : ''}${post.slug}`}
                            target="_blank"
                            rel="noopener"
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors flex-shrink-0"
                            title="View live article"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ backgroundColor: PUB_COLORS[post.pub_slug] ?? '#6366f1' }}
                        >
                          {PUB_SHORT[post.pub_slug] ?? post.pub_slug}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{post.author_name ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize">{post.beat ?? '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={post.status}
                          onChange={(e) => handleStatusChange(post.id, e.target.value, post.title, null)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border-0 cursor-pointer focus:outline-none ${statusColor(post.status)}`}
                          style={{ background: 'transparent' }}
                        >
                          <option value="draft">Draft</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-muted)] tabular-nums">
                        {(() => {
                          const views = getPostViews(post.pub_slug, post.beat, post.slug)
                          if (views === null) return '—'
                          if (views === 0) return <span className="text-[var(--color-text-muted)]/50">0</span>
                          return <span className="text-[var(--color-accent-hover)] font-semibold">{views.toLocaleString()}</span>
                        })()}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatRelative(post.pub_date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--color-text-muted)] text-sm">
                      No articles match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

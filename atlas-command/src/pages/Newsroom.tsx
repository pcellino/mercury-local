import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getPublicationStats, getAggregateStats, getRecentPosts } from '../lib/queries'
import { PUB_COLORS, PUB_SHORT, formatRelative } from '../lib/utils'
import StatCard from '../components/StatCard'
import HealthScores from '../components/HealthScores'
import { Globe, FileText, Clock, Inbox, ExternalLink, ChevronRight } from 'lucide-react'

export default function Newsroom() {
  const stats = useQuery({ queryKey: ['pub-stats'], queryFn: getPublicationStats })
  const agg = useQuery({ queryKey: ['aggregate'], queryFn: getAggregateStats })
  const recent = useQuery({ queryKey: ['recent-posts'], queryFn: () => getRecentPosts(8) })

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Newsroom</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">All publications at a glance</p>
      </div>

      {/* Top stats */}
      {agg.data && (
        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard value={agg.data.totalPublished} label="Published" color="#22c55e" />
          <StatCard value={agg.data.totalScheduled} label="Scheduled" color="#3b82f6" />
          <StatCard value={agg.data.totalDrafts} label="Drafts" color="#eab308" />
          <StatCard value={agg.data.totalPages} label="Pages" color="#8b5cf6" />
          <StatCard value={agg.data.editorialOpen} label="Editorial Open" color="#f97316" />
        </div>
      )}

      {/* Publication Cards */}
      <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
        Publications
      </h2>
      {stats.isLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>}
      {stats.data && (
        <div className="grid grid-cols-2 gap-4 mb-10">
          {stats.data.map((pub) => {
            const color = PUB_COLORS[pub.pub_slug] ?? '#6366f1'
            const short = PUB_SHORT[pub.pub_slug] ?? pub.pub_slug.slice(0, 3).toUpperCase()
            return (
              <div
                key={pub.publication_id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {short}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{pub.pub_name}</div>
                      {pub.pub_domain && (
                        <a
                          href={`https://${pub.pub_domain}`}
                          target="_blank"
                          rel="noopener"
                          className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] flex items-center gap-1"
                        >
                          {pub.pub_domain} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/publications/${pub.pub_slug}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 transition-colors"
                  >
                    Manage <ChevronRight size={10} />
                  </Link>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-green-400">
                      <FileText size={12} />
                      <span className="text-lg font-bold">{pub.published_posts}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Published</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-blue-400">
                      <Clock size={12} />
                      <span className="text-lg font-bold">{pub.scheduled_posts}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Scheduled</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-yellow-400">
                      <Inbox size={12} />
                      <span className="text-lg font-bold">{pub.draft_posts}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Drafts</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-purple-400">
                      <Globe size={12} />
                      <span className="text-lg font-bold">{pub.published_pages}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">Pages</div>
                  </div>
                </div>

                {pub.latest_post_title && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Latest: <span className="text-[var(--color-text)]">{pub.latest_post_title}</span>
                      {pub.latest_post_date && (
                        <span className="ml-1">· {formatRelative(pub.latest_post_date)}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Health Scores */}
      <div className="mb-10">
        <HealthScores />
      </div>

      {/* Recent Activity */}
      <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
        Recent Activity
      </h2>
      {recent.data && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-2)]">
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Article</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Publication</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Author</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Beat</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Published</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.map((post) => (
                <tr key={post.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                  <td className="px-4 py-3 max-w-[360px]">
                    <span className="truncate block">{post.title}</span>
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
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatRelative(post.pub_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

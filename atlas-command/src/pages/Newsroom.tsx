import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getPublicationStats, getAggregateStats, getRecentPosts } from '../lib/queries'
import { PUB_COLORS, PUB_SHORT, formatRelative } from '../lib/utils'
import HealthScores from '../components/HealthScores'
import GNTCountdown from '../components/GNTCountdown'
import QueryGuard from '../components/QueryGuard'
import { ExternalLink, ChevronRight } from 'lucide-react'

export default function Newsroom() {
  const stats = useQuery({ queryKey: ['pub-stats'], queryFn: getPublicationStats })
  const agg = useQuery({ queryKey: ['aggregate'], queryFn: getAggregateStats })
  const recent = useQuery({ queryKey: ['recent-posts'], queryFn: () => getRecentPosts(6) })

  return (
    <QueryGuard queries={[stats, agg]}>
    <div>
      {/* Header + Hero Stat */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Newsroom</h1>
        {agg.data && (
          <div className="flex items-baseline gap-6 mt-3">
            <div>
              <span className="text-3xl font-bold text-green-400 tabular-nums">{agg.data.totalPublished}</span>
              <span className="text-[13px] text-[var(--color-text-muted)] ml-2">published</span>
            </div>
            <Stat value={agg.data.totalScheduled} label="scheduled" />
            <Stat value={agg.data.totalDrafts} label="drafts" />
            <Stat value={agg.data.editorialOpen} label="editorial open" accent={agg.data.editorialOpen > 0} />
          </div>
        )}
      </div>

      {/* GNT Countdown */}
      <div className="mb-8">
        <GNTCountdown />
      </div>

      {/* Publication Cards */}
      <SectionLabel>Publications</SectionLabel>
      {stats.isLoading && <p className="text-[13px] text-[var(--color-text-muted)]">Loading...</p>}
      {stats.data && (
        <div className="grid grid-cols-2 gap-3 mb-10">
          {stats.data.map((pub) => {
            const color = PUB_COLORS[pub.pub_slug] ?? '#6366f1'
            const short = PUB_SHORT[pub.pub_slug] ?? pub.pub_slug.slice(0, 3).toUpperCase()
            return (
              <div
                key={pub.publication_id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)]/30 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {short}
                    </div>
                    <div>
                      <div className="text-[14px] font-medium">{pub.pub_name}</div>
                      {pub.pub_domain && (
                        <a
                          href={`https://${pub.pub_domain}`}
                          target="_blank"
                          rel="noopener"
                          className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] flex items-center gap-1"
                        >
                          {pub.pub_domain} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/publications/${pub.pub_slug}`}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 transition-all"
                  >
                    Manage <ChevronRight size={10} />
                  </Link>
                </div>

                <div className="flex items-center gap-5 text-[13px]">
                  <span><strong className="text-green-400 tabular-nums">{pub.published_posts}</strong> <span className="text-[var(--color-text-muted)]">published</span></span>
                  <span><strong className="text-blue-400 tabular-nums">{pub.scheduled_posts}</strong> <span className="text-[var(--color-text-muted)]">scheduled</span></span>
                  <span><strong className="text-yellow-400 tabular-nums">{pub.draft_posts}</strong> <span className="text-[var(--color-text-muted)]">drafts</span></span>
                  <span><strong className="text-purple-400 tabular-nums">{pub.published_pages}</strong> <span className="text-[var(--color-text-muted)]">pages</span></span>
                </div>

                {pub.latest_post_title && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                    <p className="text-[12px] text-[var(--color-text-muted)] truncate">
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

      {/* Recent Posts — compact table */}
      <SectionLabel>Recent Posts</SectionLabel>
      {recent.data && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[var(--color-surface-2)]">
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Article</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Pub</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Author</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Published</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.map((post) => (
                <tr key={post.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                  <td className="px-4 py-2.5 max-w-[360px]">
                    <Link to={`/posts/${post.id}`} className="truncate block hover:text-[var(--color-accent-hover)] transition-colors">
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: PUB_COLORS[post.pub_slug] ?? '#6366f1' }}
                    >
                      {PUB_SHORT[post.pub_slug] ?? post.pub_slug}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{post.author_name ?? '—'}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{formatRelative(post.pub_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
            <Link to="/content" className="text-[12px] text-[var(--color-accent-hover)] hover:underline">
              View all posts →
            </Link>
          </div>
        </div>
      )}
    </div>
    </QueryGuard>
  )
}

/* ─── Helper components ─── */

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-lg font-semibold tabular-nums ${accent ? 'text-orange-400' : 'text-[var(--color-text)]'}`}>
        {value}
      </span>
      <span className="text-[13px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-3">
      {children}
    </h2>
  )
}

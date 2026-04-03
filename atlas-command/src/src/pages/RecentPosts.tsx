import { useQuery } from '@tanstack/react-query'
import { getRecentPosts } from '../lib/queries'
import { formatRelative, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { Newspaper } from 'lucide-react'

export default function RecentPosts() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-posts-full'],
    queryFn: () => getRecentPosts(50),
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Newspaper size={24} className="text-[var(--color-accent-hover)]" />
          Recent Posts
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Last 50 published articles across all publications</p>
      </div>

      {isLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>}

      {data && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface-2)]">
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Article</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Pub</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-32">Author</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Beat</th>
                <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Published</th>
              </tr>
            </thead>
            <tbody>
              {data.map((post) => (
                <tr key={post.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                  <td className="px-4 py-3">
                    <a
                      href={`https://${post.pub_slug === 'charlotte-mercury' ? 'cltmercury.com' : post.pub_slug === 'farmington-mercury' ? 'farmingtonmercury.com' : post.pub_slug === 'strolling-ballantyne' ? 'strollingballantyne.com' : post.pub_slug === 'strolling-firethorne' ? 'strollingfirethorne.com' : post.pub_slug === 'grand-national-today' ? 'grandnationaltoday.com' : post.pub_slug === 'mercury-local' ? 'mercurylocal.com' : 'petercellino.com'}/${post.beat ? post.beat + '/' : ''}${post.slug}`}
                      target="_blank"
                      rel="noopener"
                      className="hover:text-[var(--color-accent-hover)] transition-colors"
                    >
                      {post.title}
                    </a>
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

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PUB_COLORS, PUB_SHORT, PUB_DOMAINS } from '../lib/utils'
import { Layout, ExternalLink, AlertTriangle, Edit2 } from 'lucide-react'

interface HubPage {
  id: string
  title: string
  slug: string
  status: string | null
  hub_beat: string | null
  hub_tag: string | null
  hub_limit: number | null
  hub_heading: string | null
  updated_at: string | null
  seo_title: string | null
  meta_description: string | null
  publication: { name: string; slug: string } | null
}

function daysSince(date: string | null): number {
  if (!date) return 999
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export default function Hubs() {
  const [filterPub, setFilterPub] = useState<string>('all')

  const { data: hubs, isLoading } = useQuery({
    queryKey: ['hub-pages'],
    queryFn: async (): Promise<HubPage[]> => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug, status, hub_beat, hub_tag, hub_limit, hub_heading, updated_at, seo_title, meta_description, publications(name, slug)')
        .not('hub_beat', 'is', null)
        .order('title')
      if (error) throw error
      return (data ?? []).map((p: Record<string, unknown>) => ({
        ...p,
        publication: p.publications as HubPage['publication'],
      })) as HubPage[]
    },
  })

  const publications = [...new Set((hubs ?? []).map(h => h.publication?.slug).filter(Boolean))]
  const filtered = filterPub === 'all' ? hubs : hubs?.filter(h => h.publication?.slug === filterPub)

  const staleCount = (hubs ?? []).filter(h => daysSince(h.updated_at) > 14).length
  const totalCount = hubs?.length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {totalCount} hub pages · {staleCount > 0 && (
            <span className="text-amber-400">{staleCount} stale (&gt;14 days)</span>
          )}
          {staleCount === 0 && <span className="text-green-400">all fresh</span>}
        </p>
        <select
          value={filterPub}
          onChange={(e) => setFilterPub(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs"
        >
          <option value="all">All publications</option>
          {publications.map(slug => (
            <option key={slug} value={slug!}>{slug}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading hub pages...</p>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Page</th>
                <th className="text-left px-4 py-3 font-medium">Beat / Tag</th>
                <th className="text-left px-4 py-3 font-medium">Limit</th>
                <th className="text-left px-4 py-3 font-medium">Pub</th>
                <th className="text-left px-4 py-3 font-medium">Updated</th>
                <th className="text-left px-4 py-3 font-medium">SEO</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(filtered ?? []).map((hub) => {
                const days = daysSince(hub.updated_at)
                const isStale = days > 14
                const pubSlug = hub.publication?.slug ?? ''
                const domain = PUB_DOMAINS[pubSlug]

                return (
                  <tr key={hub.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{hub.title}</div>
                      <div className="text-[11px] text-[var(--color-text-muted)]">/{hub.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] px-2 py-0.5 rounded">
                        {hub.hub_beat}
                      </span>
                      {hub.hub_tag && (
                        <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded ml-1">
                          tag:{hub.hub_tag}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                      {hub.hub_limit ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: PUB_COLORS[pubSlug] ?? '#6366f1' }}
                      >
                        {(PUB_SHORT[pubSlug] ?? pubSlug.slice(0, 2).toUpperCase()).slice(0, 2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs ${isStale ? 'text-amber-400' : 'text-[var(--color-text-muted)]'}`}>
                        {isStale && <AlertTriangle size={12} />}
                        {days === 0 ? 'Today' : `${days}d ago`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {hub.seo_title ? (
                        <span className="text-[10px] text-green-400">✓ SEO</span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/pages/${hub.id}`}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        {domain && (
                          <a
                            href={`https://${domain}/${hub.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors"
                            title="View live"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPostsByWeek, getAuthorStats, getBeatStats } from '../lib/queries'
import { getAllSiteStats, getTopPages, getTopReferrers, FATHOM_SITES, type SiteStats } from '../lib/fathom'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3, Eye, Users, Clock, Globe, TrendingUp } from 'lucide-react'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

function getDateRange(range: string): { from: string; to: string } {
  const to = new Date().toISOString().split('T')[0]
  const d = new Date()
  if (range === '7d') d.setDate(d.getDate() - 7)
  else if (range === '30d') d.setDate(d.getDate() - 30)
  else if (range === '90d') d.setDate(d.getDate() - 90)
  else d.setDate(d.getDate() - 30)
  return { from: d.toISOString().split('T')[0], to }
}

export default function Analytics() {
  const [fathomRange, setFathomRange] = useState('30d')
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const { from, to } = getDateRange(fathomRange)
  const postsByWeek = useQuery({
    queryKey: ['posts-by-week'],
    queryFn: () => getPostsByWeek(12),
  })

  const authorStats = useQuery({
    queryKey: ['author-stats'],
    queryFn: () => getAuthorStats(30),
  })

  const beatStats = useQuery({
    queryKey: ['beat-stats'],
    queryFn: () => getBeatStats(30),
  })

  // Fathom queries
  const siteStats = useQuery({
    queryKey: ['fathom-sites', from, to],
    queryFn: () => getAllSiteStats(from, to),
    staleTime: 300_000,
  })

  const topPages = useQuery({
    queryKey: ['fathom-top-pages', selectedSite, from, to],
    queryFn: () => getTopPages(selectedSite!, from, to, 15),
    enabled: !!selectedSite,
    staleTime: 300_000,
  })

  const topReferrers = useQuery({
    queryKey: ['fathom-referrers', selectedSite, from, to],
    queryFn: () => getTopReferrers(selectedSite!, from, to, 10),
    enabled: !!selectedSite,
    staleTime: 300_000,
  })

  // Totals
  const totalVisits = (siteStats.data ?? []).reduce((sum, s) => sum + s.visits, 0)
  const totalPageviews = (siteStats.data ?? []).reduce((sum, s) => sum + s.pageviews, 0)
  const avgDuration = (siteStats.data ?? []).length > 0
    ? (siteStats.data ?? []).reduce((sum, s) => sum + s.avgDuration, 0) / (siteStats.data ?? []).length
    : 0

  const selectedSiteName = selectedSite
    ? Object.values(FATHOM_SITES).find(s => s.id === selectedSite)?.name ?? ''
    : ''

  const BEAT_COLORS = [
    '#6366f1',
    '#818cf8',
    '#22c55e',
    '#10b981',
    '#3b82f6',
    '#06b6d4',
    '#f97316',
    '#f43f5e',
    '#8b5cf6',
    '#ec4899',
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 size={24} className="text-[var(--color-accent-hover)]" />
          Analytics & Insights
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Content performance and team metrics</p>
      </div>

      {/* Fathom Date Range Selector */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Traffic Period:</span>
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => { setFathomRange(r); setSelectedSite(null) }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                fathomRange === r
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Fathom Totals */}
      {siteStats.data && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-blue-400" />
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Total Visits</span>
            </div>
            <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={16} className="text-green-400" />
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Total Pageviews</span>
            </div>
            <p className="text-2xl font-bold">{totalPageviews.toLocaleString()}</p>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-purple-400" />
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(avgDuration)}</p>
          </div>
        </div>
      )}

      {/* Site-by-site breakdown */}
      {siteStats.data && siteStats.data.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Globe size={14} className="text-[var(--color-accent-hover)]" /> Traffic by Publication
          </h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Publication</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Visits</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Pageviews</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Avg Time</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20"></th>
                </tr>
              </thead>
              <tbody>
                {siteStats.data.map((site: SiteStats) => (
                  <tr key={site.pubSlug} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ backgroundColor: PUB_COLORS[site.pubSlug] ?? '#6366f1' }}
                        >
                          {PUB_SHORT[site.pubSlug] ?? site.pubSlug}
                        </span>
                        <span>{site.pubName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{site.visits.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[var(--color-accent-hover)]">{site.pageviews.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">{formatDuration(site.avgDuration)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSite(selectedSite === site.siteId ? null : site.siteId)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                          selectedSite === site.siteId
                            ? 'bg-[var(--color-accent)] text-white'
                            : 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/20'
                        }`}
                      >
                        <TrendingUp size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {siteStats.isLoading && (
        <div className="mb-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
          Loading Fathom analytics...
        </div>
      )}

      {siteStats.error && (
        <div className="mb-8 bg-[var(--color-surface)] border border-yellow-500/30 rounded-xl p-5 text-center text-sm text-yellow-400">
          Fathom analytics unavailable — ensure FATHOM_API_KEY is set in Vercel env vars
        </div>
      )}

      {/* Selected site drill-down */}
      {selectedSite && (
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Top pages */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
              Top Pages — {selectedSiteName}
            </h2>
            {topPages.isLoading ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
            ) : topPages.data && topPages.data.length > 0 ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)]">
                      <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Path</th>
                      <th className="text-right px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-20">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.data.map((page, i) => (
                      <tr key={i} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-2 truncate max-w-[250px] text-xs font-mono text-[var(--color-text-muted)]">{page.pathname}</td>
                        <td className="px-4 py-2 text-right font-semibold">{page.pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">No data</div>
            )}
          </div>

          {/* Top referrers */}
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
              Top Referrers — {selectedSiteName}
            </h2>
            {topReferrers.isLoading ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">Loading...</div>
            ) : topReferrers.data && topReferrers.data.length > 0 ? (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)]">
                      <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Source</th>
                      <th className="text-right px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-20">Visits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReferrers.data.map((ref, i) => (
                      <tr key={i} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-2 text-xs">{ref.referrer}</td>
                        <td className="px-4 py-2 text-right font-semibold">{ref.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">No data</div>
            )}
          </div>
        </div>
      )}

      {/* Posts per week */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
          Posts per Week (Last 12 weeks)
        </h2>
        {postsByWeek.isLoading ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
            Loading...
          </div>
        ) : postsByWeek.data && postsByWeek.data.length > 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={postsByWeek.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-text-muted)"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`
                  }}
                />
                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--color-text)' }}
                />
                <Legend
                  wrapperStyle={{
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                  }}
                />
                {Object.keys(PUB_COLORS).map((pubSlug) => (
                  <Bar
                    key={pubSlug}
                    dataKey={pubSlug}
                    stackId="a"
                    fill={PUB_COLORS[pubSlug] ?? '#6366f1'}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
            No data available
          </div>
        )}
      </div>

      {/* Two-column layout for author stats and beat breakdown */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Author stats */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
            Author Output (Last 30 days)
          </h2>
          {authorStats.isLoading ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
              Loading...
            </div>
          ) : authorStats.data && authorStats.data.length > 0 ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
                    <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Author</th>
                    <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Posts</th>
                  </tr>
                </thead>
                <tbody>
                  {authorStats.data.map((author, idx) => (
                    <tr key={idx} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-4 py-3 text-[var(--color-text)]">{author.author_name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[var(--color-accent-hover)]">{author.post_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
              No data available
            </div>
          )}
        </div>

        {/* Beat coverage */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
            Beat Coverage (Last 30 days)
          </h2>
          {beatStats.isLoading ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
              Loading...
            </div>
          ) : beatStats.data && beatStats.data.length > 0 ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={beatStats.data}
                    dataKey="count"
                    nameKey="beat"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.beat}: ${entry.count}`}
                  >
                    {beatStats.data.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={BEAT_COLORS[idx % BEAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center text-sm text-[var(--color-text-muted)]">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

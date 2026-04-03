import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicationStats, getPublicationHealthScores, getEditorialCalendar } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { GitCompare, TrendingUp, Target, Layers } from 'lucide-react'

export default function Compare() {
  const stats = useQuery({ queryKey: ['pub-stats'], queryFn: getPublicationStats })
  const health = useQuery({ queryKey: ['pub-health'], queryFn: getPublicationHealthScores })
  const editorial = useQuery({ queryKey: ['editorial-calendar-all'], queryFn: () => getEditorialCalendar() })

  // Posts per pub for bar chart
  const pubBarData = useMemo(() => {
    return (stats.data ?? [])
      .filter(p => p.pub_domain)
      .map(p => ({
        name: PUB_SHORT[p.pub_slug] ?? p.pub_slug.slice(0, 4).toUpperCase(),
        slug: p.pub_slug,
        published: p.published_posts,
        scheduled: p.scheduled_posts,
        drafts: p.draft_posts,
        pages: p.published_pages,
        fill: PUB_COLORS[p.pub_slug] ?? '#6366f1',
      }))
  }, [stats.data])

  // Radar data from health scores
  const radarData = useMemo(() => {
    const scores = health.data ?? []
    if (scores.length === 0) return []
    return [
      { metric: 'Velocity', ...Object.fromEntries(scores.map(s => [s.pub_slug, s.velocity_score])) },
      { metric: 'Beat Coverage', ...Object.fromEntries(scores.map(s => [s.pub_slug, s.beat_coverage_score])) },
      { metric: 'Hub Freshness', ...Object.fromEntries(scores.map(s => [s.pub_slug, s.hub_freshness_score])) },
      { metric: 'Pipeline', ...Object.fromEntries(scores.map(s => [s.pub_slug, s.pipeline_depth_score])) },
    ]
  }, [health.data])

  // Editorial pipeline by pub
  const pipelineData = useMemo(() => {
    const items = editorial.data ?? []
    const byPub: Record<string, Record<string, number>> = {}
    for (const item of items) {
      if (!byPub[item.pub_slug]) byPub[item.pub_slug] = {}
      byPub[item.pub_slug][item.status] = (byPub[item.pub_slug][item.status] ?? 0) + 1
    }
    return Object.entries(byPub).map(([slug, statuses]) => ({
      name: PUB_SHORT[slug] ?? slug.slice(0, 4).toUpperCase(),
      slug,
      concept: statuses['concept'] ?? 0,
      assigned: statuses['assigned'] ?? 0,
      drafting: statuses['drafting'] ?? 0,
      review: statuses['review'] ?? 0,
      scheduled: statuses['scheduled'] ?? 0,
    }))
  }, [editorial.data])

  // 30-day velocity per pub
  const velocityQuery = useQuery({
    queryKey: ['pub-velocity-30d'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data } = await supabase
        .from('posts')
        .select('publication_id, publications(slug, name)')
        .eq('status', 'published')
        .gte('pub_date', thirtyDaysAgo)

      const byPub: Record<string, { slug: string; name: string; count: number }> = {}
      for (const row of data ?? []) {
        const pub = row.publications as any
        const slug = pub?.slug ?? 'unknown'
        if (!byPub[slug]) byPub[slug] = { slug, name: pub?.name ?? slug, count: 0 }
        byPub[slug].count++
      }
      return Object.values(byPub).sort((a, b) => b.count - a.count)
    },
  })

  const activePubs = (health.data ?? []).filter(h => h.details.posts_this_week > 0 || h.details.pipeline_items > 0 || h.details.total_hubs > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <GitCompare size={20} className="text-[var(--color-accent-hover)]" />
          Compare Publications
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Side-by-side performance across all Mercury Local publications</p>
      </div>

      {/* Scorecard row */}
      {health.data && health.data.length > 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(health.data.length, 6)}, 1fr)` }}>
          {health.data.map(h => (
            <div
              key={h.pub_slug}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: PUB_COLORS[h.pub_slug] ?? '#6366f1' }}
                >
                  {(PUB_SHORT[h.pub_slug] ?? h.pub_slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                </span>
                <span className="text-xs font-medium truncate">{h.pub_name}</span>
              </div>
              <div className="text-center mb-2">
                <p className="text-3xl font-bold" style={{ color: h.overall_score >= 70 ? '#22c55e' : h.overall_score >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {h.overall_score}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Health Score</p>
              </div>
              <div className="space-y-1 text-[10px]">
                <ScoreBar label="Velocity" value={h.velocity_score} />
                <ScoreBar label="Beats" value={h.beat_coverage_score} />
                <ScoreBar label="Hubs" value={h.hub_freshness_score} />
                <ScoreBar label="Pipeline" value={h.pipeline_depth_score} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total content by pub */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-1.5">
            <Layers size={12} /> Total Content
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pubBarData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={50} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="published" stackId="a" fill="#22c55e" name="Published" />
                <Bar dataKey="scheduled" stackId="a" fill="#3b82f6" name="Scheduled" />
                <Bar dataKey="drafts" stackId="a" fill="#6b7280" name="Drafts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-day velocity */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-1.5">
            <TrendingUp size={12} /> 30-Day Velocity
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(velocityQuery.data ?? []).map(v => ({
                name: PUB_SHORT[v.slug] ?? v.slug.slice(0, 4).toUpperCase(),
                articles: v.count,
                fill: PUB_COLORS[v.slug] ?? '#6366f1',
              }))} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="articles" name="Articles Published">
                  {(velocityQuery.data ?? []).map((v, i) => (
                    <rect key={i} fill={PUB_COLORS[v.slug] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Health radar */}
      {radarData.length > 0 && activePubs.length > 1 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4 flex items-center gap-1.5">
            <Target size={12} /> Health Radar
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} />
                {activePubs.map(h => (
                  <Radar
                    key={h.pub_slug}
                    name={h.pub_name}
                    dataKey={h.pub_slug}
                    stroke={PUB_COLORS[h.pub_slug] ?? '#6366f1'}
                    fill={PUB_COLORS[h.pub_slug] ?? '#6366f1'}
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            {activePubs.map(h => (
              <div key={h.pub_slug} className="flex items-center gap-1.5">
                <div className="w-3 h-1 rounded" style={{ backgroundColor: PUB_COLORS[h.pub_slug] ?? '#6366f1' }} />
                <span className="text-[10px] text-[var(--color-text-muted)]">{h.pub_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline comparison */}
      {pipelineData.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">Editorial Pipeline by Publication</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="concept" stackId="a" fill="#6b7280" name="Concept" />
                <Bar dataKey="assigned" stackId="a" fill="#3b82f6" name="Assigned" />
                <Bar dataKey="drafting" stackId="a" fill="#f59e0b" name="Drafting" />
                <Bar dataKey="review" stackId="a" fill="#a855f7" name="Review" />
                <Bar dataKey="scheduled" stackId="a" fill="#10b981" name="Scheduled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed comparison table */}
      {stats.data && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Publication</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Published</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Scheduled</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Drafts</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Pages</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Health</th>
                <th className="text-right px-4 py-3 text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">Latest Post</th>
              </tr>
            </thead>
            <tbody>
              {stats.data.filter(p => p.pub_domain).map(pub => {
                const h = health.data?.find(s => s.pub_slug === pub.pub_slug)
                return (
                  <tr key={pub.pub_slug} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ backgroundColor: PUB_COLORS[pub.pub_slug] ?? '#6366f1' }}
                        >
                          {(PUB_SHORT[pub.pub_slug] ?? pub.pub_slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                        </span>
                        <a href={`/publications/${pub.pub_slug}`} className="font-medium hover:text-[var(--color-accent-hover)] transition-colors">
                          {pub.pub_name}
                        </a>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-mono">{pub.published_posts}</td>
                    <td className="text-right px-4 py-3 font-mono">{pub.scheduled_posts}</td>
                    <td className="text-right px-4 py-3 font-mono">{pub.draft_posts}</td>
                    <td className="text-right px-4 py-3 font-mono">{pub.published_pages}</td>
                    <td className="text-right px-4 py-3">
                      {h ? (
                        <span className="font-bold" style={{ color: h.overall_score >= 70 ? '#22c55e' : h.overall_score >= 40 ? '#f59e0b' : '#ef4444' }}>
                          {h.overall_score}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="text-right px-4 py-3 text-[var(--color-text-muted)]">
                      {pub.latest_post_date
                        ? new Date(pub.latest_post_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
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

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[var(--color-text-muted)]">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--color-bg)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="w-6 text-right font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

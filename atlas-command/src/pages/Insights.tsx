import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPostsByWeek, getAuthorStats, getBeatStats, getEditorialCalendar } from '../lib/queries'
import { PUB_COLORS } from '../lib/utils'
import { BarChart3, TrendingUp, Users, GitBranch } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Treemap,
} from 'recharts'

const FUNNEL_COLORS: Record<string, string> = {
  concept: '#f59e0b',
  assigned: '#3b82f6',
  drafting: '#8b5cf6',
  review: '#ec4899',
  scheduled: '#14b8a6',
  published: '#22c55e',
}

const BEAT_COLORS = [
  '#D97757', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#3b82f6',
  '#14b8a6', '#ec4899', '#f97316', '#06b6d4', '#84cc16', '#a855f7',
]

export default function Insights() {
  const weeklyData = useQuery({ queryKey: ['posts-by-week'], queryFn: () => getPostsByWeek(12) })
  const authorData = useQuery({ queryKey: ['author-stats-90'], queryFn: () => getAuthorStats(90) })
  const beatData = useQuery({ queryKey: ['beat-stats-90'], queryFn: () => getBeatStats(90) })
  const editorialData = useQuery({ queryKey: ['editorial-all'], queryFn: () => getEditorialCalendar() })

  // Derive pub slugs from weekly data
  const pubSlugs = useMemo(() => {
    const slugs = new Set<string>()
    for (const row of weeklyData.data ?? []) {
      for (const key of Object.keys(row)) {
        if (key !== 'week' && key !== 'date') slugs.add(key)
      }
    }
    return slugs
  }, [weeklyData.data])

  // Editorial pipeline funnel
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of editorialData.data ?? []) {
      counts[item.status] = (counts[item.status] ?? 0) + 1
    }
    return ['concept', 'assigned', 'drafting', 'review', 'scheduled', 'published']
      .filter(s => (counts[s] ?? 0) > 0)
      .map(status => ({
        name: status,
        value: counts[status] ?? 0,
        fill: FUNNEL_COLORS[status] ?? '#6366f1',
      }))
  }, [editorialData.data])

  // Beat treemap data
  const treemapData = useMemo(() =>
    (beatData.data ?? [])
      .filter(b => b.beat && b.count > 0)
      .map((b, i) => ({
        name: b.beat,
        size: b.count,
        fill: BEAT_COLORS[i % BEAT_COLORS.length],
      })),
    [beatData.data],
  )

  // Author bar chart (top 10)
  const authorChartData = useMemo(() =>
    (authorData.data ?? [])
      .sort((a, b) => b.post_count - a.post_count)
      .slice(0, 10),
    [authorData.data],
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-[var(--color-accent-hover)]" />
          Insights
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Publishing trends, beat coverage, and editorial pipeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Publishing Trends */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-blue-400" />
            Weekly Publishing (12 weeks)
          </h2>
          {weeklyData.isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyData.data ?? []} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v)
                    return `${d.getMonth() + 1}/${d.getDate()}`
                  }}
                />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                {[...pubSlugs].map(slug => (
                  <Bar
                    key={slug}
                    dataKey={slug}
                    stackId="a"
                    fill={PUB_COLORS[slug] ?? '#6366f1'}
                    radius={[2, 2, 0, 0]}
                    name={slug}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Beat Coverage Treemap */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <GitBranch size={14} className="text-purple-400" />
            Beat Coverage (90 days)
          </h2>
          {beatData.isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">Loading...</div>
          ) : treemapData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">No beat data</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="var(--color-bg)"
                content={({ x, y, width, height, name, value }: { x: number; y: number; width: number; height: number; name?: string; value?: number }) => {
                  const showLabel = width >= 40 && height >= 30
                  return (
                    <g>
                      <rect x={x} y={y} width={width} height={height} rx={4} fill={BEAT_COLORS[treemapData.findIndex(d => d.name === name) % BEAT_COLORS.length]} fillOpacity={0.8} />
                      {showLabel && (
                        <>
                          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>
                            {name}
                          </text>
                          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10}>
                            {value} posts
                          </text>
                        </>
                      )}
                    </g>
                  )
                }}
              />
            </ResponsiveContainer>
          )}
        </div>

        {/* Author Output */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Users size={14} className="text-green-400" />
            Author Output (90 days, top 10)
          </h2>
          {authorData.isLoading ? (
            <div className="h-64 flex items-center justify-center text-sm text-[var(--color-text-muted)]">Loading...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={authorChartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="author_name"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="post_count" fill="#22c55e" radius={[0, 4, 4, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Editorial Pipeline Funnel */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-amber-400" />
            Editorial Pipeline
          </h2>
          {editorialData.isLoading ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--color-text-muted)]">Loading...</div>
          ) : (
            <div className="flex items-end justify-center gap-3 h-48">
              {funnelData.map((stage, i) => {
                const maxVal = Math.max(...funnelData.map(d => d.value), 1)
                const heightPct = Math.max((stage.value / maxVal) * 100, 10)
                return (
                  <div key={stage.name} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                    <span className="text-lg font-bold" style={{ color: stage.fill }}>
                      {stage.value}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: stage.fill,
                        opacity: 0.8,
                        minHeight: '16px',
                      }}
                    />
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide text-center">
                      {stage.name}
                    </span>
                    {i < funnelData.length - 1 && (
                      <span className="hidden">→</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {funnelData.length > 0 && (
            <div className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
              {funnelData.reduce((sum, d) => sum + d.value, 0)} total items in pipeline
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

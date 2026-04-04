import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
// queries used inline via supabase
import {
  Bell, AlertTriangle, Clock, BookOpen, FileText,
  TrendingDown, Calendar, CheckCircle2, XCircle,
  Filter, RefreshCw,
} from 'lucide-react'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'

// ---------- Alert rule definitions ----------
interface AlertResult {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  detail: string
  pub_slug?: string
  link?: string
  timestamp: string
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
}

const SEVERITY_ICONS: Record<string, typeof Bell> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Bell,
}

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  editorial: Calendar,
  content: FileText,
  beats: BookOpen,
  velocity: TrendingDown,
  pipeline: Clock,
}

async function runAlertChecks(): Promise<AlertResult[]> {
  const alerts: AlertResult[] = []
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // 1. Overdue editorial items (critical)
  const { data: overdue } = await supabase
    .from('editorial_calendar')
    .select('id, concept, target_date, publications(slug, name)')
    .lt('target_date', todayStr)
    .not('status', 'in', '("published","killed")')
    .order('target_date', { ascending: true })
    .limit(20)

  for (const item of overdue ?? []) {
    const pub = item.publications as any
    const daysOverdue = Math.floor((now.getTime() - new Date(item.target_date + 'T12:00:00').getTime()) / 86400000)
    alerts.push({
      id: `overdue-${item.id}`,
      severity: daysOverdue > 7 ? 'critical' : 'warning',
      category: 'editorial',
      title: `Overdue: ${item.concept}`,
      detail: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past target date (${item.target_date})`,
      pub_slug: pub?.slug ?? undefined,
      link: '/editorial',
      timestamp: item.target_date,
    })
  }

  // 2. Stale hub pages (>14 days = warning, >30 days = critical)
  const cutoff30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const cutoff14 = new Date(now.getTime() - 14 * 86400000).toISOString()
  const { data: staleHubs } = await supabase
    .from('pages')
    .select('id, title, slug, updated_at, hub_beat, publications(slug)')
    .eq('status', 'published')
    .lt('updated_at', cutoff14)
    .not('hub_beat', 'is', null)
    .order('updated_at', { ascending: true })
    .limit(30)

  for (const page of staleHubs ?? []) {
    const pub = page.publications as any
    const isOld = page.updated_at && page.updated_at < cutoff30
    const daysSince = Math.floor((now.getTime() - new Date(page.updated_at ?? now).getTime()) / 86400000)
    alerts.push({
      id: `stale-hub-${page.id}`,
      severity: isOld ? 'critical' : 'warning',
      category: 'content',
      title: `Stale hub: ${page.title}`,
      detail: `Last updated ${daysSince} days ago (${page.hub_beat} beat)`,
      pub_slug: pub?.slug ?? undefined,
      link: `/pages/${page.id}`,
      timestamp: page.updated_at ?? todayStr,
    })
  }

  // 3. Stale beat research (>14 days)
  const { data: staleBeats } = await supabase
    .from('beat_research')
    .select('id, beat_name, updated_at, publications(slug)')
    .lt('updated_at', cutoff14)
    .order('updated_at', { ascending: true })
    .limit(20)

  for (const beat of staleBeats ?? []) {
    const pub = beat.publications as any
    const daysSince = Math.floor((now.getTime() - new Date(beat.updated_at ?? now).getTime()) / 86400000)
    alerts.push({
      id: `stale-beat-${beat.id}`,
      severity: daysSince > 30 ? 'warning' : 'info',
      category: 'beats',
      title: `Stale beat research: ${beat.beat_name}`,
      detail: `Last updated ${daysSince} days ago`,
      pub_slug: pub?.slug ?? undefined,
      timestamp: beat.updated_at ?? todayStr,
    })
  }

  // 4. Publishing velocity drop — pubs with 0 posts in last 7 days
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
  const { data: pubs } = await supabase
    .from('publications')
    .select('id, name, slug, domain')
    .not('domain', 'is', null)

  for (const pub of pubs ?? []) {
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)
      .eq('status', 'published')
      .gte('pub_date', weekAgo)

    if ((count ?? 0) === 0) {
      alerts.push({
        id: `velocity-${pub.id}`,
        severity: 'warning',
        category: 'velocity',
        title: `No posts this week: ${pub.name}`,
        detail: `Zero articles published in the last 7 days`,
        pub_slug: pub.slug,
        link: `/publications/${pub.slug}`,
        timestamp: todayStr,
      })
    }
  }

  // 5. Empty editorial pipeline — pubs with <2 active items
  for (const pub of pubs ?? []) {
    const { count } = await supabase
      .from('editorial_calendar')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)
      .not('status', 'in', '("published","killed")')

    if ((count ?? 0) < 2) {
      alerts.push({
        id: `pipeline-${pub.id}`,
        severity: 'info',
        category: 'pipeline',
        title: `Thin pipeline: ${pub.name}`,
        detail: `Only ${count ?? 0} active editorial item${(count ?? 0) !== 1 ? 's' : ''} in the pipeline`,
        pub_slug: pub.slug,
        link: '/editorial',
        timestamp: todayStr,
      })
    }
  }

  // Sort: critical first, then warning, then info
  const order = { critical: 0, warning: 1, info: 2 }
  alerts.sort((a, b) => order[a.severity] - order[b.severity])

  return alerts
}

export default function Notifications() {
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const alerts = useQuery({
    queryKey: ['notification-alerts'],
    queryFn: runAlertChecks,
    staleTime: 300_000,
  })

  const filtered = useMemo(() => {
    let items = alerts.data ?? []
    if (severityFilter !== 'all') items = items.filter(a => a.severity === severityFilter)
    if (categoryFilter !== 'all') items = items.filter(a => a.category === categoryFilter)
    return items
  }, [alerts.data, severityFilter, categoryFilter])

  const counts = useMemo(() => {
    const items = alerts.data ?? []
    return {
      critical: items.filter(a => a.severity === 'critical').length,
      warning: items.filter(a => a.severity === 'warning').length,
      info: items.filter(a => a.severity === 'info').length,
      total: items.length,
    }
  }, [alerts.data])

  const categories = useMemo(() => {
    const cats = new Set((alerts.data ?? []).map(a => a.category))
    return Array.from(cats).sort()
  }, [alerts.data])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell size={20} className="text-[var(--color-accent-hover)]" />
            Notifications
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Automated health checks across all publications
          </p>
        </div>
        <button
          onClick={() => alerts.refetch()}
          disabled={alerts.isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={alerts.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <SummaryCard label="Total" count={counts.total} color="#D97757" active={severityFilter === 'all'} onClick={() => setSeverityFilter('all')} />
        <SummaryCard label="Critical" count={counts.critical} color="#ef4444" active={severityFilter === 'critical'} onClick={() => setSeverityFilter('critical')} />
        <SummaryCard label="Warnings" count={counts.warning} color="#f59e0b" active={severityFilter === 'warning'} onClick={() => setSeverityFilter('warning')} />
        <SummaryCard label="Info" count={counts.info} color="#3b82f6" active={severityFilter === 'info'} onClick={() => setSeverityFilter('info')} />
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter size={12} className="text-[var(--color-text-muted)]" />
          <div className="flex gap-1.5 flex-wrap">
            <FilterChip label="All" active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
            {categories.map(cat => (
              <FilterChip key={cat} label={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)} />
            ))}
          </div>
        </div>
      )}

      {/* Alert list */}
      {alerts.isLoading ? (
        <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">Running health checks...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-12 text-center">
          <CheckCircle2 size={32} className="text-green-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-green-400">All clear</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {severityFilter === 'all' && categoryFilter === 'all'
              ? 'No active alerts across any publication'
              : 'No alerts matching current filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const styles = SEVERITY_STYLES[alert.severity]
            const SevIcon = SEVERITY_ICONS[alert.severity]
            const CatIcon = CATEGORY_ICONS[alert.category] ?? Bell

            return (
              <div
                key={alert.id}
                className={`${styles.bg} border ${styles.border} rounded-xl px-4 py-3 flex items-start gap-3`}
              >
                <SevIcon size={16} className={`${styles.text} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {alert.pub_slug && (
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                        style={{ backgroundColor: PUB_COLORS[alert.pub_slug] ?? '#6366f1' }}
                      >
                        {(PUB_SHORT[alert.pub_slug] ?? alert.pub_slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                      </span>
                    )}
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{alert.detail}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                    <CatIcon size={10} />
                    {alert.category}
                  </span>
                  {alert.link && (
                    <a
                      href={alert.link}
                      className="text-[10px] font-medium text-[var(--color-accent-hover)] hover:underline"
                    >
                      Fix →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Alert rules reference */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Active Alert Rules</h3>
        <div className="space-y-2 text-xs">
          <RuleRow severity="critical" rule="Editorial items overdue by 7+ days" />
          <RuleRow severity="critical" rule="Hub pages not updated in 30+ days" />
          <RuleRow severity="warning" rule="Editorial items overdue by 1–7 days" />
          <RuleRow severity="warning" rule="Hub pages not updated in 14–30 days" />
          <RuleRow severity="warning" rule="Zero posts published in last 7 days" />
          <RuleRow severity="info" rule="Beat research not updated in 14+ days" />
          <RuleRow severity="info" rule="Fewer than 2 active editorial items per publication" />
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ label, count, color, active, onClick }: {
  label: string; count: number; color: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all ${
        active
          ? 'bg-[var(--color-surface)] border-[var(--color-accent)]/40 ring-1 ring-[var(--color-accent)]/20'
          : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/20'
      }`}
    >
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide mt-1">{label}</p>
    </button>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition-colors ${
        active
          ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] border border-[var(--color-accent)]/30'
          : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
      }`}
    >
      {label}
    </button>
  )
}

function RuleRow({ severity, rule }: { severity: string; rule: string }) {
  const styles = SEVERITY_STYLES[severity]
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${styles.bg} ${styles.text}`}>
        {severity}
      </span>
      <span className="text-[var(--color-text-muted)]">{rule}</span>
    </div>
  )
}

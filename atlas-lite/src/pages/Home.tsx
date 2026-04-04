import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  getEditorialPipeline,
  getRecentlyPublished,
  getPublicationStats,
  getPublications,
  computeAlerts,
  getPipelineCounts,
  type EditorialItem,
  type Alert,
} from '../lib/queries'
import { formatDateFull, todayET, relativeDate, formatDate, daysUntil } from '../lib/todayET'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react'

// ---------- GNT Launch Date ----------
const GNT_LAUNCH = '2026-06-01'
const GNT_SLUG = 'grand-national-today'

// ---------- Status badge colors ----------
const STATUS_COLORS: Record<string, string> = {
  concept: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-50 text-blue-700',
  drafting: 'bg-amber-50 text-amber-700',
  review: 'bg-purple-50 text-purple-700',
  scheduled: 'bg-green-50 text-green-700',
}

const SEVERITY_ICON = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}

const SEVERITY_COLORS = {
  critical: 'text-mercury-danger bg-red-50 border-red-200',
  warning: 'text-mercury-warning bg-amber-50 border-amber-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

function EditorialRow({ item }: { item: EditorialItem }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-mercury-rule/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-mercury-ink truncate">{item.concept}</p>
        <p className="text-xs text-mercury-muted mt-0.5">
          {item.pub_name}
          {item.beat && <> &middot; {item.beat}</>}
          {item.author_name && <> &middot; {item.author_name}</>}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={item.status} />
        <span className="text-xs text-mercury-muted tabular-nums">{relativeDate(item.target_date)}</span>
      </div>
    </div>
  )
}

function AlertBanner({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {criticalCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-50 border border-red-200 text-sm">
          <AlertTriangle size={14} className="text-mercury-danger" />
          <span className="font-medium text-mercury-danger">{criticalCount} overdue</span>
        </div>
      )}
      {warningCount > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-50 border border-amber-200 text-sm">
          <AlertCircle size={14} className="text-mercury-warning" />
          <span className="font-medium text-mercury-warning">{warningCount} warning{warningCount !== 1 && 's'}</span>
        </div>
      )}
      {alerts.filter(a => a.severity === 'info').length > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 border border-blue-200 text-sm">
          <Info size={14} className="text-blue-600" />
          <span className="font-medium text-blue-600">{alerts.filter(a => a.severity === 'info').length} info</span>
        </div>
      )}
    </div>
  )
}

function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-1.5">
      {alerts.slice(0, 8).map(alert => {
        const Icon = SEVERITY_ICON[alert.severity]
        return (
          <div
            key={alert.id}
            className={`flex items-start gap-2 px-3 py-2 rounded border text-sm ${SEVERITY_COLORS[alert.severity]}`}
          >
            <Icon size={14} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="font-medium">{alert.publication}:</span>{' '}
              <span className="opacity-90">{alert.message}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PipelineBar({ counts }: { counts: { concept: number; assigned: number; drafting: number; review: number; scheduled: number } }) {
  const stages = [
    { key: 'concept', label: 'Concept', color: 'bg-gray-300' },
    { key: 'assigned', label: 'Assigned', color: 'bg-blue-400' },
    { key: 'drafting', label: 'Drafting', color: 'bg-amber-400' },
    { key: 'review', label: 'Review', color: 'bg-purple-400' },
    { key: 'scheduled', label: 'Scheduled', color: 'bg-green-400' },
  ] as const

  return (
    <div className="flex items-center gap-3 text-xs">
      {stages.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <span className="text-mercury-muted">{label}</span>
          <span className="font-semibold text-mercury-ink tabular-nums">{counts[key]}</span>
        </div>
      ))}
    </div>
  )
}

function PublicationCard({ stat, pub }: {
  stat: { publication_id: string; pub_name: string; pub_slug: string; pub_domain: string | null; published_posts: number; scheduled_posts: number; draft_posts: number; latest_post_date: string | null; latest_post_title: string | null }
  pub: { status: string | null; tagline: string | null } | undefined
}) {
  const isGNT = stat.pub_slug === GNT_SLUG
  const gntDays = isGNT ? daysUntil(GNT_LAUNCH) : 0
  const isPrelaunch = pub?.status === 'pre-launch' || (isGNT && gntDays > 0)

  return (
    <Link
      to={`/publications/${stat.pub_slug}`}
      className="block bg-white border border-mercury-rule rounded-lg p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-shadow group"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-mercury-ink group-hover:text-mercury-accent transition-colors text-sm">
            {stat.pub_name}
          </h3>
          {stat.pub_domain && (
            <a
              href={`https://${stat.pub_domain}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-mercury-muted hover:text-mercury-accent flex items-center gap-0.5 mt-0.5"
            >
              {stat.pub_domain} <ExternalLink size={10} />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isPrelaunch ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Pre-launch
            </span>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
              Active
            </span>
          )}
          <ChevronRight size={14} className="text-mercury-muted group-hover:text-mercury-accent transition-colors" />
        </div>
      </div>

      {/* GNT Countdown */}
      {isGNT && gntDays > 0 && (
        <div className="mb-3 px-3 py-2 rounded bg-mercury-highlight border border-amber-200 text-center">
          <p className="text-2xl font-black text-mercury-ink tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
            {gntDays}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-mercury-muted font-semibold">days to launch</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-mercury-ink tabular-nums">{stat.published_posts}</p>
          <p className="text-[10px] uppercase tracking-wider text-mercury-muted">Published</p>
        </div>
        <div>
          <p className="text-lg font-bold text-mercury-ink tabular-nums">{stat.scheduled_posts}</p>
          <p className="text-[10px] uppercase tracking-wider text-mercury-muted">Scheduled</p>
        </div>
        <div>
          <p className="text-lg font-bold text-mercury-ink tabular-nums">{stat.draft_posts}</p>
          <p className="text-[10px] uppercase tracking-wider text-mercury-muted">Drafts</p>
        </div>
      </div>

      {/* Latest post */}
      {stat.latest_post_title && (
        <div className="mt-3 pt-2 border-t border-mercury-rule/50 flex items-start gap-1.5">
          <FileText size={12} className="text-mercury-muted mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-mercury-ink truncate">{stat.latest_post_title}</p>
            <p className="text-[10px] text-mercury-muted flex items-center gap-1 mt-0.5">
              <Clock size={10} /> {formatDate(stat.latest_post_date)}
            </p>
          </div>
        </div>
      )}
    </Link>
  )
}

export default function Home() {
  const pipelineQ = useQuery({ queryKey: ['editorial-pipeline'], queryFn: getEditorialPipeline })
  const recentQ = useQuery({ queryKey: ['recent-published'], queryFn: () => getRecentlyPublished(8) })
  const statsQ = useQuery({ queryKey: ['pub-stats'], queryFn: getPublicationStats })
  const pubsQ = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const alertsQ = useQuery({ queryKey: ['alerts'], queryFn: computeAlerts, staleTime: 120_000 })
  const pipelineCountsQ = useQuery({ queryKey: ['pipeline-counts'], queryFn: getPipelineCounts })

  const today = todayET()
  const pipeline = pipelineQ.data
  const alerts = alertsQ.data ?? []
  const stats = statsQ.data ?? []
  const pubs = pubsQ.data ?? []

  const pubMap = new Map(pubs.map(p => [p.slug, p]))

  return (
    <div>
      {/* Dateline */}
      <div className="mb-6">
        <h2 className="text-xl font-black text-mercury-ink" style={{ fontFamily: 'var(--font-display)' }}>
          {formatDateFull(today)}
        </h2>
        <div className="rule-double mt-2" />
      </div>

      {/* Alert banners */}
      <AlertBanner alerts={alerts} />

      {/* ===== TODAY'S SLATE ===== */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Today's Editorial */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-mercury-muted mb-3">
              Today's Editorial Slate
            </h3>

            {/* Pipeline counts */}
            {pipelineCountsQ.data && (
              <div className="mb-3">
                <PipelineBar counts={pipelineCountsQ.data} />
              </div>
            )}

            <div className="bg-white border border-mercury-rule rounded-lg p-4 shadow-[var(--shadow-card)]">
              {pipelineQ.isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-mercury-surface rounded animate-pulse" />)}
                </div>
              ) : (
                <>
                  {(pipeline?.today.length ?? 0) === 0 && (pipeline?.overdue.length ?? 0) === 0 && (pipeline?.upcoming.length ?? 0) === 0 ? (
                    <p className="text-sm text-mercury-muted py-4 text-center">No editorial items on the slate today.</p>
                  ) : (
                    <>
                      {(pipeline?.overdue.length ?? 0) > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-mercury-danger mb-1">Overdue</p>
                          {pipeline!.overdue.map(item => <EditorialRow key={item.id} item={item} />)}
                        </div>
                      )}
                      {(pipeline?.today.length ?? 0) > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-mercury-ink mb-1">Today</p>
                          {pipeline!.today.map(item => <EditorialRow key={item.id} item={item} />)}
                        </div>
                      )}
                      {(pipeline?.upcoming.length ?? 0) > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-mercury-muted mb-1">Next 3 Days</p>
                          {pipeline!.upcoming.map(item => <EditorialRow key={item.id} item={item} />)}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Column 2: Recently Published + Alerts */}
          <div className="space-y-6">
            {/* Recently Published */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-mercury-muted mb-3">
                Recently Published
              </h3>
              <div className="bg-white border border-mercury-rule rounded-lg p-4 shadow-[var(--shadow-card)]">
                {recentQ.isLoading ? (
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-8 bg-mercury-surface rounded animate-pulse" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(recentQ.data ?? []).map(post => (
                      <a
                        key={post.id}
                        href={post.pub_domain ? `https://${post.pub_domain}/${post.beat}/${post.slug}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-1.5 border-b border-mercury-rule/30 last:border-0 hover:bg-mercury-surface/50 -mx-1 px-1 rounded transition-colors"
                      >
                        <p className="text-sm text-mercury-ink font-medium leading-snug">{post.title}</p>
                        <p className="text-[10px] text-mercury-muted mt-0.5">
                          {post.pub_name} &middot; {post.author_name ?? 'Staff'} &middot; {formatDate(post.pub_date)}
                        </p>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alerts detail */}
            {alerts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-mercury-muted mb-3">
                  Alerts
                </h3>
                <AlertList alerts={alerts} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== PUBLICATION GRID ===== */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-mercury-ink" style={{ fontFamily: 'var(--font-display)' }}>
            Publications
          </h3>
          <span className="text-xs text-mercury-muted">{stats.length} publications</span>
        </div>
        <div className="rule-double mb-4" />

        {statsQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white border border-mercury-rule rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {stats.map(stat => (
              <PublicationCard
                key={stat.publication_id}
                stat={stat}
                pub={pubMap.get(stat.pub_slug)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getRecentPosts, getEditorialPipeline, getActiveTasks, completeTask, getDocuments, getPinnedDocuments, type RecentPost, type EditorialItem, type ProjectGroup, type Document } from '../lib/queries'
import { updateEditorialStatus, logActivity } from '../lib/mutations'
import { getAllSiteStats, getAllCurrentVisitors, type SiteStats, type CurrentVisitors } from '../lib/fathom'
import { PUB_COLORS, PUB_SHORT, PUB_DOMAINS, formatRelative, statusColor, todayET } from '../lib/utils'
import { ExternalLink, ChevronRight, AlertTriangle, Clock, CheckCircle, Circle, Eye, ArrowRight, FileText, Pin, BookOpen } from 'lucide-react'
import MarkdownViewer, { DocSection, DocTypeBadge } from '../components/MarkdownViewer'
import QueryGuard from '../components/QueryGuard'

const STATUS_FLOW = ['idea', 'in-progress', 'published']

export default function PublishersDesk() {
  const queryClient = useQueryClient()
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)

  // --- Data ---
  const recent = useQuery({ queryKey: ['desk-recent'], queryFn: () => getRecentPosts(5, 'published') })
  const pipeline = useQuery({ queryKey: ['desk-pipeline'], queryFn: getEditorialPipeline })
  const projects = useQuery({ queryKey: ['desk-projects'], queryFn: getActiveTasks })
  const pinnedDocs = useQuery({ queryKey: ['desk-pinned-docs'], queryFn: getPinnedDocuments })
  const allDocs = useQuery({ queryKey: ['desk-all-docs'], queryFn: () => getDocuments() })

  // Fathom: today's traffic (ET-aware)
  const today = todayET()
  const traffic = useQuery({
    queryKey: ['desk-traffic', today],
    queryFn: () => getAllSiteStats(today, today),
    staleTime: 5 * 60 * 1000,
  })
  const liveVisitors = useQuery({
    queryKey: ['desk-live'],
    queryFn: getAllCurrentVisitors,
    refetchInterval: 30_000,
  })

  // --- Mutations ---
  const advance = useMutation({
    mutationFn: async ({ id, status, concept }: { id: string; status: string; concept: string }) => {
      const nextIdx = STATUS_FLOW.indexOf(status) + 1
      if (nextIdx >= STATUS_FLOW.length) return
      const next = STATUS_FLOW[nextIdx]
      await updateEditorialStatus(id, next)
      await logActivity({ action: 'status_change', entity_type: 'editorial', entity_id: id, entity_title: concept, details: { new_status: next } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['desk-pipeline'] }),
  })

  const done = useMutation({
    mutationFn: (id: string) => completeTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['desk-projects'] }),
  })

  // Aggregate traffic
  const totalVisits = (traffic.data ?? []).reduce((s, t) => s + t.visits, 0)
  const totalLive = (liveVisitors.data ?? []).reduce((s, v) => s + v.visitors, 0)

  // Group docs by project for project cards
  const docsByProject = new Map<string, Document[]>()
  for (const doc of allDocs.data ?? []) {
    if (doc.project) {
      const existing = docsByProject.get(doc.project) ?? []
      existing.push(doc)
      docsByProject.set(doc.project, existing)
    }
  }

  return (
    <QueryGuard queries={[recent, pipeline, projects]} inline>
    <div className="space-y-6">
      {/* ── Traffic strip ── */}
      <TrafficStrip
        totalVisits={totalVisits}
        totalLive={totalLive}
        sites={traffic.data ?? []}
        live={liveVisitors.data ?? []}
      />

      {/* ── Quick Reference strip ── */}
      {(pinnedDocs.data?.length ?? 0) > 0 && (
        <QuickReferenceStrip docs={pinnedDocs.data!} onSelect={setViewingDoc} />
      )}

      {/* ── Two-column: Recent + Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Latest Published */}
        <section>
          <SectionLabel>Latest Published</SectionLabel>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            {recent.isLoading && <p className="p-4 text-[13px] text-[var(--color-text-muted)]">Loading...</p>}
            {recent.data?.map((post, i) => (
              <PostRow key={post.id} post={post} isLast={i === (recent.data?.length ?? 0) - 1} />
            ))}
            {recent.data?.length === 0 && (
              <p className="p-4 text-[13px] text-[var(--color-text-muted)]">No published posts yet.</p>
            )}
            <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
              <Link to="/content" className="text-[12px] text-[var(--color-accent-hover)] hover:underline">
                View all posts →
              </Link>
            </div>
          </div>
        </section>

        {/* Right: Editorial Pipeline */}
        <section>
          <SectionLabel>Editorial Pipeline</SectionLabel>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            {pipeline.isLoading && <p className="p-4 text-[13px] text-[var(--color-text-muted)]">Loading...</p>}

            {/* Overdue */}
            {(pipeline.data?.overdue.length ?? 0) > 0 && (
              <PipelineSection label="Overdue" color="red" items={pipeline.data!.overdue} onAdvance={advance.mutate} />
            )}

            {/* Today */}
            {(pipeline.data?.today.length ?? 0) > 0 && (
              <PipelineSection label="Today" color="amber" items={pipeline.data!.today} onAdvance={advance.mutate} />
            )}

            {/* Upcoming */}
            {(pipeline.data?.upcoming.length ?? 0) > 0 && (
              <PipelineSection label="Next 3 Days" color="default" items={pipeline.data!.upcoming} onAdvance={advance.mutate} />
            )}

            {pipeline.data && pipeline.data.overdue.length === 0 && pipeline.data.today.length === 0 && pipeline.data.upcoming.length === 0 && (
              <p className="p-4 text-[13px] text-[var(--color-text-muted)]">No editorial items in the next 3 days.</p>
            )}

            <div className="px-4 py-2.5 border-t border-[var(--color-border)]">
              <Link to="/editorial" className="text-[12px] text-[var(--color-accent-hover)] hover:underline">
                Full editorial calendar →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Projects ── */}
      <section>
        <SectionLabel>Active Projects</SectionLabel>
        {projects.isLoading && <p className="text-[13px] text-[var(--color-text-muted)]">Loading...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.data?.map(group => (
            <ProjectCard
              key={group.project}
              group={group}
              onComplete={done.mutate}
              docs={docsByProject.get(group.project) ?? []}
              onViewDoc={setViewingDoc}
            />
          ))}
        </div>
        {projects.data?.length === 0 && (
          <p className="text-[13px] text-[var(--color-text-muted)]">All projects complete.</p>
        )}
      </section>

      {/* ── Document Viewer (slide-over) ── */}
      <MarkdownViewer docId={viewingDoc} onClose={() => setViewingDoc(null)} />
    </div>
    </QueryGuard>
  )
}

/* ═══════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════ */

function QuickReferenceStrip({ docs, onSelect }: { docs: Document[]; onSelect: (id: string) => void }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-5 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 shrink-0">
          <BookOpen size={13} className="text-[var(--color-text-muted)]" />
          <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Quick Ref</span>
        </div>
        <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />
        <div className="flex items-center gap-2 flex-wrap">
          {docs.map(doc => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)]/50 hover:bg-[var(--color-accent)]/10 border border-transparent hover:border-[var(--color-accent)]/20 transition-colors group"
            >
              <Pin size={10} className="text-amber-400 shrink-0" />
              <span className="text-[12px] group-hover:text-[var(--color-accent-hover)] transition-colors">{doc.title}</span>
              <DocTypeBadge type={doc.doc_type} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrafficStrip({ totalVisits, totalLive, sites, live }: {
  totalVisits: number
  totalLive: number
  sites: SiteStats[]
  live: CurrentVisitors[]
}) {
  const liveMap = new Map(live.map(v => [v.pubSlug, v.visitors]))
  const activeSites = sites.filter(s => s.visits > 0 || (liveMap.get(s.pubSlug) ?? 0) > 0)

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-5 py-3.5">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-baseline gap-2">
          <Eye size={14} className="text-[var(--color-text-muted)] relative top-[2px]" />
          <span className="text-2xl font-bold tabular-nums">{totalVisits.toLocaleString()}</span>
          <span className="text-[13px] text-[var(--color-text-muted)]">visits today</span>
        </div>

        {totalLive > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[13px] font-medium text-green-400 tabular-nums">{totalLive}</span>
            <span className="text-[12px] text-[var(--color-text-muted)]">live now</span>
          </div>
        )}

        <div className="h-5 w-px bg-[var(--color-border)] hidden lg:block" />

        <div className="flex items-center gap-4 flex-wrap">
          {activeSites.map(s => {
            const liveCount = liveMap.get(s.pubSlug) ?? 0
            return (
              <div key={s.pubSlug} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ backgroundColor: PUB_COLORS[s.pubSlug] ?? '#6366f1' }}
                />
                <span className="text-[12px] font-medium">{PUB_SHORT[s.pubSlug]}</span>
                <span className="text-[12px] text-[var(--color-text-muted)] tabular-nums">{s.visits.toLocaleString()}</span>
                {liveCount > 0 && (
                  <span className="text-[11px] text-green-400 tabular-nums">({liveCount})</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PostRow({ post, isLast }: { post: RecentPost; isLast: boolean }) {
  const domain = PUB_DOMAINS[post.pub_slug]
  const liveUrl = domain ? `https://${domain}/${post.beat ? post.beat + '/' : ''}${post.slug}` : null

  return (
    <div className={`px-4 py-3 flex items-start gap-3 hover:bg-[var(--color-surface-2)]/50 ${!isLast ? 'border-b border-[var(--color-border)]' : ''}`}>
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[9px] font-bold text-white flex-shrink-0 mt-0.5"
        style={{ backgroundColor: PUB_COLORS[post.pub_slug] ?? '#6366f1' }}
      >
        {PUB_SHORT[post.pub_slug] ?? '?'}
      </span>
      <div className="flex-1 min-w-0">
        <Link to={`/posts/${post.id}`} className="text-[13px] font-medium hover:text-[var(--color-accent-hover)] transition-colors line-clamp-2">
          {post.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-text-muted)]">
          <span>{post.author_name ?? 'Staff'}</span>
          <span>·</span>
          <span>{formatRelative(post.pub_date)}</span>
        </div>
      </div>
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] p-1 flex-shrink-0"
          title="View on site"
        >
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

function PipelineSection({ label, color, items, onAdvance }: {
  label: string
  color: 'red' | 'amber' | 'default'
  items: EditorialItem[]
  onAdvance: (args: { id: string; status: string; concept: string }) => void
}) {
  const borderColor = color === 'red' ? 'border-l-red-500' : color === 'amber' ? 'border-l-amber-500' : 'border-l-transparent'
  const labelColor = color === 'red' ? 'text-red-400' : color === 'amber' ? 'text-amber-400' : 'text-[var(--color-text-muted)]'
  const icon = color === 'red' ? <AlertTriangle size={12} className="text-red-400" /> :
    color === 'amber' ? <Clock size={12} className="text-amber-400" /> :
    <ChevronRight size={12} className="text-[var(--color-text-muted)]" />

  return (
    <div className={`border-l-2 ${borderColor}`}>
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
        {icon}
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${labelColor}`}>{label}</span>
        <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">({items.length})</span>
      </div>
      {items.map(item => (
        <div key={item.id} className="px-4 py-2 flex items-center gap-2 hover:bg-[var(--color-surface-2)]/50 group">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: PUB_COLORS[item.pub_slug] ?? '#6366f1' }}
          />
          <Link to="/editorial" className="text-[13px] flex-1 min-w-0 truncate hover:text-[var(--color-accent-hover)]">
            {item.concept}
          </Link>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor(item.status)}`}>
            {item.status}
          </span>
          {STATUS_FLOW.indexOf(item.status) < STATUS_FLOW.length - 1 && (
            <button
              onClick={() => onAdvance({ id: item.id, status: item.status, concept: item.concept })}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--color-accent-hover)] hover:underline flex-shrink-0"
              title={`Advance to ${STATUS_FLOW[STATUS_FLOW.indexOf(item.status) + 1]}`}
            >
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ group, onComplete, docs, onViewDoc }: {
  group: ProjectGroup
  onComplete: (id: string) => void
  docs: Document[]
  onViewDoc: (id: string) => void
}) {
  const statusIcon = group.status === 'blocked'
    ? <AlertTriangle size={13} className="text-red-400" />
    : <CheckCircle size={13} className="text-green-400" />
  const statusLabel = group.status === 'blocked' ? 'Blocked' : 'Active'
  const statusClass = group.status === 'blocked' ? 'text-red-400' : 'text-green-400'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)]/30 hover:shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2 mb-3">
        {statusIcon}
        <span className="text-[14px] font-medium flex-1 truncate">{group.project}</span>
        <span className={`text-[11px] font-medium ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="flex items-center gap-3 mb-3 text-[12px] text-[var(--color-text-muted)]">
        <span className="tabular-nums">{group.openCount} open</span>
        {group.blockedCount > 0 && (
          <span className="text-red-400 tabular-nums">{group.blockedCount} blocked</span>
        )}
        {docs.length > 0 && (
          <span className="flex items-center gap-1">
            <FileText size={11} />
            <span className="tabular-nums">{docs.length} docs</span>
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {group.tasks.slice(0, 3).map(task => (
          <div key={task.id} className="flex items-start gap-2 group">
            <button
              onClick={() => onComplete(task.id)}
              className="mt-0.5 flex-shrink-0 text-[var(--color-text-muted)] hover:text-green-400 transition-colors"
              title="Mark done"
            >
              <Circle size={13} />
            </button>
            <span className="text-[12px] leading-snug line-clamp-1">{task.title}</span>
            {task.priority === 'High' && (
              <span className="text-[10px] text-orange-400 flex-shrink-0">!</span>
            )}
            {task.status === 'Waiting / Blocked' && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-red-400/10 text-red-400 flex-shrink-0">blocked</span>
            )}
          </div>
        ))}
        {group.tasks.length > 3 && (
          <p className="text-[11px] text-[var(--color-text-muted)] pl-5">+{group.tasks.length - 3} more</p>
        )}
      </div>

      {/* Linked docs */}
      <DocSection docs={docs} onSelect={onViewDoc} />
    </div>
  )
}

/* ── Helpers ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[13px] font-medium text-[var(--color-text-muted)] mb-3">
      {children}
    </h2>
  )
}

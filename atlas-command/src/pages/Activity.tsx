import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { History, Newspaper, Layout, Calendar, Tag, Users, FileText, Rss, RefreshCw } from 'lucide-react'

interface ActivityEntry {
  id: string
  created_at: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_title: string | null
  publication_id: string | null
  details: Record<string, unknown>
  actor: string
  pub_slug?: string
  pub_name?: string
}

const ENTITY_ICONS: Record<string, typeof Newspaper> = {
  post: Newspaper,
  page: Layout,
  editorial: Calendar,
  tag: Tag,
  author: Users,
  transcript: FileText,
  feed_item: Rss,
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  publish: 'Published',
  schedule: 'Scheduled',
  status_change: 'Status changed',
}

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-400',
  update: 'text-blue-400',
  delete: 'text-red-400',
  publish: 'text-emerald-400',
  schedule: 'text-amber-400',
  status_change: 'text-purple-400',
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function entityLink(type: string, id: string | null): string | null {
  if (!id) return null
  switch (type) {
    case 'post': return `/posts/${id}`
    case 'page': return `/pages/${id}`
    case 'editorial': return '/editorial'
    case 'tag': return '/tags'
    case 'author': return '/authors'
    default: return null
  }
}

export default function Activity() {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')

  const { data: entries, isLoading, refetch } = useQuery({
    queryKey: ['activity-log', filterType, filterAction],
    queryFn: async (): Promise<ActivityEntry[]> => {
      let query = supabase
        .from('activity_log')
        .select('*, publications(name, slug)')
        .order('created_at', { ascending: false })
        .limit(200)

      if (filterType !== 'all') query = query.eq('entity_type', filterType)
      if (filterAction !== 'all') query = query.eq('action', filterAction)

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map((row: Record<string, unknown>) => {
        const pub = row.publications as { name: string; slug: string } | null
        return {
          ...row,
          pub_slug: pub?.slug,
          pub_name: pub?.name,
        } as ActivityEntry
      })
    },
    refetchInterval: 30_000, // refresh every 30s
  })

  // Also query recent changes from posts/editorial as a fallback "reconstructed" log
  const { data: recentChanges } = useQuery({
    queryKey: ['recent-changes'],
    queryFn: async (): Promise<ActivityEntry[]> => {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [postsRes, editorialRes] = await Promise.all([
        supabase
          .from('posts')
          .select('id, title, status, updated_at, publication_id, publications(name, slug)')
          .gte('updated_at', cutoff)
          .order('updated_at', { ascending: false })
          .limit(50),
        supabase
          .from('editorial_calendar')
          .select('id, concept, status, updated_at, publication_id, publications(name, slug)')
          .gte('updated_at', cutoff)
          .order('updated_at', { ascending: false })
          .limit(50),
      ])

      const postEntries = (postsRes.data ?? []).map((p: Record<string, unknown>) => {
        const pub = p.publications as { name: string; slug: string } | null
        return {
          id: `recon-post-${p.id}`,
          created_at: p.updated_at as string,
          action: p.status === 'published' ? 'publish' : 'update',
          entity_type: 'post',
          entity_id: p.id as string,
          entity_title: p.title as string,
          publication_id: p.publication_id as string,
          details: { status: p.status },
          actor: 'system',
          pub_slug: pub?.slug,
          pub_name: pub?.name,
        } as ActivityEntry
      })

      const editorialEntries = (editorialRes.data ?? []).map((e: Record<string, unknown>) => {
        const pub = e.publications as { name: string; slug: string } | null
        return {
          id: `recon-ed-${e.id}`,
          created_at: e.updated_at as string,
          action: 'update',
          entity_type: 'editorial',
          entity_id: e.id as string,
          entity_title: e.concept as string,
          publication_id: e.publication_id as string,
          details: { status: e.status },
          actor: 'system',
          pub_slug: pub?.slug,
          pub_name: pub?.name,
        } as ActivityEntry
      })

      return [...postEntries, ...editorialEntries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },
  })

  // Merge: use activity_log entries first, fall back to reconstructed if log is empty
  const displayEntries = (entries && entries.length > 0) ? entries : (recentChanges ?? [])
  const entityTypes = [...new Set(displayEntries.map(e => e.entity_type))]
  const actionTypes = [...new Set(displayEntries.map(e => e.action))]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <History size={20} className="text-[var(--color-accent-hover)]" />
            Activity Log
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {displayEntries.length} recent actions
            {entries?.length === 0 && recentChanges && recentChanges.length > 0 && (
              <span className="text-amber-400 ml-2">(reconstructed from recent changes)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="all">All types</option>
            {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="all">All actions</option>
            {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading activity...</p>
      ) : displayEntries.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-12 text-center">
          <History size={32} className="mx-auto text-[var(--color-text-muted)] mb-3" />
          <p className="text-sm text-[var(--color-text-muted)]">No activity recorded yet.</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Actions taken in Atlas Command will appear here.</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {displayEntries.map((entry) => {
              const Icon = ENTITY_ICONS[entry.entity_type] ?? History
              const link = entityLink(entry.entity_type, entry.entity_id)
              const actionLabel = ACTION_LABELS[entry.action] ?? entry.action
              const actionColor = ACTION_COLORS[entry.action] ?? 'text-[var(--color-text-muted)]'

              return (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-bg)] flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${actionColor}`}>
                        {actionLabel}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] uppercase">{entry.entity_type}</span>
                      {entry.pub_slug && (
                        <span
                          className="inline-flex items-center text-[9px] font-bold text-white px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: PUB_COLORS[entry.pub_slug] ?? '#6366f1' }}
                        >
                          {(PUB_SHORT[entry.pub_slug] ?? entry.pub_slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm truncate mt-0.5">
                      {link ? (
                        <Link to={link} className="hover:text-[var(--color-accent-hover)] transition-colors">
                          {entry.entity_title ?? 'Untitled'}
                        </Link>
                      ) : (
                        <span>{entry.entity_title ?? 'Untitled'}</span>
                      )}
                    </div>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {'new_status' in entry.details && (
                          <span>→ {String(entry.details.new_status)}</span>
                        )}
                        {'old_status' in entry.details && 'new_status' in entry.details && (
                          <span> (was {String(entry.details.old_status)})</span>
                        )}
                        {'status' in entry.details && !('new_status' in entry.details) && (
                          <span>Status: {String(entry.details.status)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)] shrink-0">
                    {timeAgo(entry.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

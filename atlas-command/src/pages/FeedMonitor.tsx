import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFeedItems, getPublications, type FeedItem } from '../lib/queries'
import { promoteFeedItemToConcept, dismissFeedItem, updateFeedItemStatus } from '../lib/mutations'
import { formatRelative } from '../lib/utils'
import { Rss, ExternalLink, Plus, X, Eye, EyeOff, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-blue-400 bg-blue-400/10' },
  reviewed: { label: 'Reviewed', color: 'text-slate-400 bg-slate-400/10' },
  concept_created: { label: 'Concept Created', color: 'text-green-400 bg-green-400/10' },
  dismissed: { label: 'Dismissed', color: 'text-red-400 bg-red-400/10' },
}

export default function FeedMonitor() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('new')
  const [pubFilter, setPubFilter] = useState('')
  const [conceptModal, setConceptModal] = useState<FeedItem | null>(null)

  const { data: pubs } = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const { data: items, isLoading } = useQuery({
    queryKey: ['feed-items', statusFilter, pubFilter],
    queryFn: () => getFeedItems({ status: statusFilter, pubId: pubFilter || undefined }),
  })

  const [mutError, setMutError] = useState<string | null>(null)

  const dismissMut = useMutation({
    mutationFn: dismissFeedItem,
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['feed-items'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to dismiss item'),
  })

  const reviewMut = useMutation({
    mutationFn: (id: string) => updateFeedItemStatus(id, 'reviewed'),
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['feed-items'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to mark as reviewed'),
  })

  const newCount = items?.filter(i => i.status === 'new').length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Rss size={20} className="text-[var(--color-accent)]" />
            Feed Monitor
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Stories surfaced from RSS feeds and news sources
          </p>
        </div>
        {newCount > 0 && (
          <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg">
            {newCount} new items
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1">
          {['all', 'new', 'reviewed', 'concept_created', 'dismissed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                statusFilter === s
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {s === 'all' ? 'All' : s === 'concept_created' ? 'Concepts' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={pubFilter}
          onChange={e => setPubFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
        >
          <option value="">All Publications</option>
          {pubs?.filter(p => p.domain).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Error banner */}
      {mutError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-400/10 border border-red-400/20 rounded-lg text-xs text-red-400">
          <AlertCircle size={14} /> {mutError}
          <button onClick={() => setMutError(null)} className="ml-auto hover:text-red-300"><X size={12} /></button>
        </div>
      )}

      {/* Feed Items */}
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading feed items...</p>
      ) : !items?.length ? (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <Rss size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No feed items found</p>
          <p className="text-xs mt-1">Feed items will appear here as feeds are monitored</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <FeedItemCard
              key={item.id}
              item={item}
              onPromote={() => setConceptModal(item)}
              onDismiss={() => dismissMut.mutate(item.id)}
              onReview={() => reviewMut.mutate(item.id)}
            />
          ))}
        </div>
      )}

      {/* Concept Creation Modal */}
      {conceptModal && (
        <ConceptModal
          item={conceptModal}
          publications={pubs ?? []}
          onClose={() => setConceptModal(null)}
          onCreated={() => {
            setConceptModal(null)
            queryClient.invalidateQueries({ queryKey: ['feed-items'] })
          }}
        />
      )}
    </div>
  )
}

function FeedItemCard({ item, onPromote, onDismiss, onReview }: {
  item: FeedItem
  onPromote: () => void
  onDismiss: () => void
  onReview: () => void
}) {
  const sc = statusConfig[item.status] ?? statusConfig.new

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-accent)]/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
            {item.feed_name && (
              <span className="text-[10px] text-[var(--color-text-muted)]">via {item.feed_name}</span>
            )}
            {item.beat_category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full text-purple-400 bg-purple-400/10">{item.beat_category}</span>
            )}
          </div>
          <h3 className="text-sm font-medium text-[var(--color-text)] leading-snug">{item.title}</h3>
          {item.summary && (
            <p className="text-xs text-[var(--color-text-muted)] mt-1.5 line-clamp-2">{item.summary}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-muted)]">
            {item.author && <span>By {item.author}</span>}
            {item.published_at && <span>{formatRelative(item.published_at)}</span>}
            {item.pub_name && <span>{item.pub_name}</span>}
          </div>

          {/* Similarity warning */}
          {item.similarity_score != null && item.similarity_score > 0.5 && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400">
              <AlertTriangle size={10} />
              <span>Similar to existing coverage ({Math.round(item.similarity_score * 100)}% match)</span>
            </div>
          )}
          {item.editorial_calendar_id && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-green-400">
              <CheckCircle size={10} />
              <span>Concept created in Editorial Calendar</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
            title="Open source"
          >
            <ExternalLink size={14} />
          </a>
          {item.status === 'new' && (
            <button
              onClick={onReview}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-blue-400 hover:bg-blue-400/10"
              title="Mark reviewed"
            >
              <Eye size={14} />
            </button>
          )}
          {(item.status === 'new' || item.status === 'reviewed') && (
            <>
              <button
                onClick={onPromote}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-green-400 hover:bg-green-400/10"
                title="Create concept"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10"
                title="Dismiss"
              >
                <EyeOff size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ConceptModal({ item, publications, onClose, onCreated }: {
  item: FeedItem
  publications: { id: string; name: string; slug: string; domain: string | null }[]
  onClose: () => void
  onCreated: () => void
}) {
  const [concept, setConcept] = useState(item.title)
  const [pubId, setPubId] = useState(item.publication_id ?? '')
  const [beat, setBeat] = useState(item.beat_category ?? '')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pubId || !concept) return
    setSaving(true)
    setError(null)
    try {
      await promoteFeedItemToConcept(item.id, {
        publication_id: pubId,
        concept,
        beat: beat || undefined,
        target_date: targetDate,
      })
      onCreated()
    } catch (err: any) {
      setError(err.message ?? 'Failed to create concept')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Create Story Concept</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Concept</label>
            <textarea
              value={concept}
              onChange={e => setConcept(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Publication</label>
              <select
                value={pubId}
                onChange={e => setPubId(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
              >
                <option value="">Select...</option>
                {publications.filter(p => p.domain).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Beat</label>
            <input
              type="text"
              value={beat}
              onChange={e => setBeat(e.target.value)}
              placeholder="e.g. government, sports, business"
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
            />
          </div>

          {/* Source reference */}
          <div className="bg-[var(--color-surface-2)] rounded-lg p-3 text-xs text-[var(--color-text-muted)]">
            <p className="font-medium text-[var(--color-text)] mb-1">Source</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-hover)] hover:underline flex items-center gap-1">
              {item.url.replace(/^https?:\/\//, '').slice(0, 60)}...
              <ExternalLink size={10} />
            </a>
            {item.feed_name && <p className="mt-1">Feed: {item.feed_name}</p>}
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-400/10 border border-red-400/20 rounded-lg text-xs text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !pubId || !concept}
              className="px-4 py-2 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Concept'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

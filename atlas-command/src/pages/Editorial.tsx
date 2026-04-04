import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { getEditorialCalendar, getPublications, getAuthors, getDistinctBeats, type EditorialItem, type EditorialFilter } from '../lib/queries'
import { createEditorialItem, updateEditorialStatus, updateEditorialDate, killEditorialItem, duplicateEditorialItem, updateEditorialItem, logActivity, type CreateEditorialItem } from '../lib/mutations'
import { statusColor, formatDate, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { CalendarDays, Plus, X, Trash2, ArrowRight, Copy, AlertCircle, FileText, ExternalLink, Save, ChevronRight, Star, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '../lib/auth'

const STATUSES = ['all', 'concept', 'assigned', 'drafting', 'review', 'scheduled']
const STATUS_FLOW = ['concept', 'assigned', 'drafting', 'review', 'scheduled', 'published']
const SORT_FIELDS = [
  { value: 'target_date', label: 'Date' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
] as const

const DEFAULTS_KEY = 'atlas-editorial-defaults'

interface EditorialDefaults {
  statusFilter: string
  pubFilter: string
  authorFilter: string
  beatFilter: string
  sortField: string
  sortDir: 'asc' | 'desc'
}

const FACTORY_DEFAULTS: EditorialDefaults = {
  statusFilter: 'all',
  pubFilter: 'all',
  authorFilter: 'all',
  beatFilter: 'all',
  sortField: 'target_date',
  sortDir: 'asc',
}

function loadDefaults(): EditorialDefaults {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY)
    if (raw) return { ...FACTORY_DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return FACTORY_DEFAULTS
}

export default function Editorial() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const saved = loadDefaults()
  const [statusFilter, setStatusFilter] = useState(saved.statusFilter)
  const [pubFilter, setPubFilter] = useState(saved.pubFilter)
  const [authorFilter, setAuthorFilter] = useState(saved.authorFilter)
  const [beatFilter, setBeatFilter] = useState(saved.beatFilter)
  const [sortField, setSortField] = useState(saved.sortField)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(saved.sortDir)

  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [activeItem, setActiveItem] = useState<EditorialItem | null>(null)
  const [mutError, setMutError] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState(false)

  const filter: EditorialFilter = {
    status: statusFilter,
    pubSlug: pubFilter,
    authorId: authorFilter,
    beat: beatFilter,
    sortField: sortField as EditorialFilter['sortField'],
    sortDir,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['editorial', filter],
    queryFn: () => getEditorialCalendar(filter),
  })

  const pubs = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const authors = useQuery({ queryKey: ['authors'], queryFn: getAuthors })
  const beats = useQuery({ queryKey: ['distinct-beats'], queryFn: getDistinctBeats })

  function saveDefaults() {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({
      statusFilter, pubFilter, authorFilter, beatFilter, sortField, sortDir,
    }))
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2000)
  }

  function resetDefaults() {
    localStorage.removeItem(DEFAULTS_KEY)
    setStatusFilter(FACTORY_DEFAULTS.statusFilter)
    setPubFilter(FACTORY_DEFAULTS.pubFilter)
    setAuthorFilter(FACTORY_DEFAULTS.authorFilter)
    setBeatFilter(FACTORY_DEFAULTS.beatFilter)
    setSortField(FACTORY_DEFAULTS.sortField)
    setSortDir(FACTORY_DEFAULTS.sortDir)
  }

  // Keep activeItem in sync with refreshed data
  useEffect(() => {
    if (activeItem && data) {
      const updated = data.find(i => i.id === activeItem.id)
      if (updated) setActiveItem(updated)
      else setActiveItem(null) // item was killed or filtered out
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const advanceStatus = useMutation({
    mutationFn: async ({ id, status, concept }: { id: string; status: string; concept?: string }) => {
      await updateEditorialStatus(id, status)
      await logActivity({ action: 'status_change', entity_type: 'editorial', entity_id: id, entity_title: concept, details: { new_status: status } })
    },
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['editorial'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to advance status'),
  })

  const bumpDate = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => updateEditorialDate(id, date),
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['editorial'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to update date'),
  })

  const kill = useMutation({
    mutationFn: (id: string) => killEditorialItem(id),
    onSuccess: () => { setMutError(null); setActiveItem(null); queryClient.invalidateQueries({ queryKey: ['editorial'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to kill item'),
  })

  const duplicate = useMutation({
    mutationFn: (id: string) => duplicateEditorialItem(id),
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['editorial'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to duplicate item'),
  })

  const create = useMutation({
    mutationFn: async (item: CreateEditorialItem) => {
      await createEditorialItem(item)
      await logActivity({ action: 'create', entity_type: 'editorial', entity_title: item.concept, publication_id: item.publication_id })
    },
    onSuccess: () => {
      setMutError(null)
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      setShowCreate(false)
    },
    onError: (err: any) => setMutError(err.message ?? 'Failed to create item'),
  })

  const advanceAllStatus = useMutation({
    mutationFn: async () => {
      const nextStatuses: Record<string, string> = {
        concept: 'assigned',
        assigned: 'drafting',
        drafting: 'review',
        review: 'scheduled',
        scheduled: 'published',
      }
      for (const id of selectedItems) {
        const item = (data ?? []).find((i) => i.id === id)
        if (item && nextStatuses[item.status]) {
          await updateEditorialStatus(id, nextStatuses[item.status])
        }
      }
    },
    onSuccess: () => {
      setMutError(null)
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      setSelectedItems(new Set())
    },
    onError: (err: any) => setMutError(err.message ?? 'Failed to advance items'),
  })

  const killAll = useMutation({
    mutationFn: async () => {
      for (const id of selectedItems) {
        await killEditorialItem(id)
      }
    },
    onSuccess: () => {
      setMutError(null)
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      setSelectedItems(new Set())
    },
    onError: (err: any) => setMutError(err.message ?? 'Failed to kill items'),
  })

  // Group by target_date (only when sorting by date)
  const groupByDate = sortField === 'target_date'
  const grouped = groupByDate
    ? (data ?? []).reduce<Record<string, typeof data>>((acc, item) => {
        const key = item.target_date ?? 'unscheduled'
        if (!acc[key]) acc[key] = []
        acc[key]!.push(item)
        return acc
      }, {})
    : {}

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'unscheduled') return 1
    if (b === 'unscheduled') return -1
    return sortDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  })

  const today = new Date().toISOString().slice(0, 10)

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  return (
    <div className="flex gap-0 h-full">
      {/* Main list */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${activeItem ? 'pr-4' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <CalendarDays size={20} className="text-[var(--color-accent-hover)]" />
              Editorial Calendar
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {data?.length ?? 0} open items across all publications
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {showCreate ? <X size={14} /> : <Plus size={14} />}
              {showCreate ? 'Cancel' : 'New Concept'}
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreate && <CreateForm pubs={pubs.data ?? []} authors={authors.data ?? []} onSubmit={create.mutate} loading={create.isPending} />}

        {/* Error banner */}
        {mutError && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-6 bg-red-400/10 border border-red-400/20 rounded-lg text-xs text-red-400">
            <AlertCircle size={14} /> {mutError}
            <button onClick={() => setMutError(null)} className="ml-auto hover:text-red-300"><X size={12} /></button>
          </div>
        )}

        {/* Filter toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* Status pills */}
          <div className="flex gap-0.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-0.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Dropdowns */}
          <select
            value={pubFilter}
            onChange={(e) => setPubFilter(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          >
            <option value="all">All Pubs</option>
            {(pubs.data ?? []).filter(p => p.slug).map((p: any) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>

          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          >
            <option value="all">All Authors</option>
            {(authors.data ?? []).map((a: any) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          <select
            value={beatFilter}
            onChange={(e) => setBeatFilter(e.target.value)}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          >
            <option value="all">All Beats</option>
            {(beats.data ?? []).sort().map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <div className="h-5 w-px bg-[var(--color-border)] mx-1 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-1">
            <ArrowUpDown size={12} className="text-[var(--color-text-muted)]" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              {SORT_FIELDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
              title={sortDir === 'asc' ? 'Ascending (oldest first)' : 'Descending (newest first)'}
            >
              {sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            </button>
          </div>

          <div className="h-5 w-px bg-[var(--color-border)] mx-1 hidden sm:block" />

          {/* Save / Reset */}
          <button
            onClick={saveDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 transition-colors"
            title="Save current filters as default view"
          >
            <Star size={12} /> {savedToast ? 'Saved!' : 'Save Default'}
          </button>
          <button
            onClick={resetDefaults}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors"
            title="Reset all filters to defaults"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Bulk actions bar */}
        {selectedItems.size > 0 && user && (
          <div className="mb-6 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-accent-hover)]">{selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected</span>
            <div className="flex gap-2">
              <button
                onClick={() => advanceAllStatus.mutate()}
                disabled={advanceAllStatus.isPending}
                className="px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {advanceAllStatus.isPending ? 'Advancing...' : 'Advance All'}
              </button>
              <button
                onClick={() => {
                  if (confirm('Kill all selected items?')) killAll.mutate()
                }}
                disabled={killAll.isPending}
                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {killAll.isPending ? 'Killing...' : 'Kill All'}
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-3 py-1.5 bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text-muted)] text-xs font-medium rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {isLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading editorial calendar...</p>}

        {/* Items list */}
        <div className="space-y-6">
          {groupByDate ? (
            /* Date-grouped timeline */
            sortedDates.map((date) => {
              const items = grouped[date]!
              const isPast = date !== 'unscheduled' && date < today
              return (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`text-sm font-semibold ${isPast ? 'text-red-400' : date === today ? 'text-green-400' : 'text-[var(--color-text)]'}`}>
                      {date === 'unscheduled' ? 'Unscheduled' : date === today ? `Today — ${formatDate(date)}` : formatDate(date)}
                    </div>
                    {isPast && (
                      <span className="text-[10px] bg-red-400/10 text-red-400 px-2 py-0.5 rounded-full font-semibold uppercase">Overdue</span>
                    )}
                    <div className="flex-1 h-px bg-[var(--color-border)]" />
                    <span className="text-[11px] text-[var(--color-text-muted)]">{items.length} items</span>
                  </div>
                  <div className="space-y-2 ml-1">
                    {items.map((item) => (
                      <ItemCard key={item.id} item={item} user={user} activeItem={activeItem} selectedItems={selectedItems}
                        setActiveItem={setActiveItem} setSelectedItems={setSelectedItems} getNextStatus={getNextStatus}
                        advanceStatus={advanceStatus} duplicate={duplicate} today={today} showDate={false} />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            /* Flat sorted list */
            <div className="space-y-2">
              {(data ?? []).map((item) => (
                <ItemCard key={item.id} item={item} user={user} activeItem={activeItem} selectedItems={selectedItems}
                  setActiveItem={setActiveItem} setSelectedItems={setSelectedItems} getNextStatus={getNextStatus}
                  advanceStatus={advanceStatus} duplicate={duplicate} today={today} showDate={true} />
              ))}
            </div>
          )}
        </div>

        {data?.length === 0 && !isLoading && (
          <div className="text-center py-16 text-[var(--color-text-muted)]">
            <p className="text-sm">No editorial items found for this filter.</p>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {activeItem && (
        <DetailDrawer
          item={activeItem}
          authors={authors.data ?? []}
          user={user}
          onClose={() => setActiveItem(null)}
          onAdvance={(id, status, concept) => advanceStatus.mutate({ id, status, concept })}
          onBumpDate={(id, date) => bumpDate.mutate({ id, date })}
          onKill={(id) => { if (confirm('Kill this item?')) kill.mutate(id) }}
          onDuplicate={(id) => duplicate.mutate(id)}
          onNavigateToPost={(postId) => navigate(`/posts/${postId}`)}
          onCreateArticle={(item) => navigate('/posts/new', { state: { concept: item.concept, publication_id: item.publication_id, beat: item.beat, author_id: item.author_id, editorial_calendar_id: item.id } })}
          onSave={async (id, updates) => {
            await updateEditorialItem(id, updates)
            await logActivity({ action: 'update', entity_type: 'editorial', entity_id: id, entity_title: updates.concept ?? activeItem.concept, details: updates })
            queryClient.invalidateQueries({ queryKey: ['editorial'] })
          }}
        />
      )}
    </div>
  )
}

// ---------- Detail Drawer ----------

function DetailDrawer({
  item,
  authors,
  user,
  onClose,
  onAdvance,
  onBumpDate,
  onKill,
  onDuplicate,
  onNavigateToPost,
  onCreateArticle,
  onSave,
}: {
  item: EditorialItem
  authors: { id: string; name: string }[]
  user: any
  onClose: () => void
  onAdvance: (id: string, status: string, concept: string) => void
  onBumpDate: (id: string, date: string) => void
  onKill: (id: string) => void
  onDuplicate: (id: string) => void
  onNavigateToPost: (postId: string) => void
  onCreateArticle: (item: EditorialItem) => void
  onSave: (id: string, updates: Partial<{ concept: string; notes: string; beat: string; priority: string; target_date: string; author_id: string; status: string }>) => Promise<void>
}) {
  const [concept, setConcept] = useState(item.concept)
  const [notes, setNotes] = useState(item.notes ?? '')
  const [beat, setBeat] = useState(item.beat ?? '')
  const [priority, setPriority] = useState(item.priority ?? 'standard')
  const [targetDate, setTargetDate] = useState(item.target_date ?? '')
  const [authorId, setAuthorId] = useState(item.author_id ?? '')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Reset form when item changes
  useEffect(() => {
    setConcept(item.concept)
    setNotes(item.notes ?? '')
    setBeat(item.beat ?? '')
    setPriority(item.priority ?? 'standard')
    setTargetDate(item.target_date ?? '')
    setAuthorId(item.author_id ?? '')
    setDirty(false)
  }, [item.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track dirty state
  useEffect(() => {
    const changed =
      concept !== item.concept ||
      notes !== (item.notes ?? '') ||
      beat !== (item.beat ?? '') ||
      priority !== (item.priority ?? 'standard') ||
      targetDate !== (item.target_date ?? '') ||
      authorId !== (item.author_id ?? '')
    setDirty(changed)
  }, [concept, notes, beat, priority, targetDate, authorId, item])

  const handleSave = async () => {
    if (!dirty || !user) return
    setSaving(true)
    try {
      const updates: Record<string, string> = {}
      if (concept !== item.concept) updates.concept = concept
      if (notes !== (item.notes ?? '')) updates.notes = notes
      if (beat !== (item.beat ?? '')) updates.beat = beat
      if (priority !== (item.priority ?? 'standard')) updates.priority = priority
      if (targetDate !== (item.target_date ?? '')) updates.target_date = targetDate
      if (authorId !== (item.author_id ?? '')) updates.author_id = authorId
      await onSave(item.id, updates)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  const nextStatus = (() => {
    const idx = STATUS_FLOW.indexOf(item.status)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  })()

  return (
    <div className="w-[380px] shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] h-full overflow-y-auto -mr-6 -my-6 ml-0">
      {/* Drawer header */}
      <div className="sticky top-0 z-10 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
              style={{ backgroundColor: PUB_COLORS[item.pub_slug] ?? '#6366f1' }}
            >
              {PUB_SHORT[item.pub_slug] ?? item.pub_slug}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Article actions — prominent */}
        {item.post_id ? (
          <button
            onClick={() => onNavigateToPost(item.post_id!)}
            className="w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <ExternalLink size={14} /> Open Article in Editor
          </button>
        ) : (
          <button
            onClick={() => onCreateArticle(item)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent-hover)] border border-[var(--color-accent)]/20 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <FileText size={14} /> Create Article from This
          </button>
        )}
      </div>

      {/* Drawer body */}
      <div className="px-5 py-5 space-y-5">
        {/* Concept */}
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">Concept</label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            disabled={!user}
            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none transition-colors disabled:opacity-60"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={!user}
            rows={4}
            placeholder="Context, sources, angles, timing..."
            className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] resize-none focus:border-[var(--color-accent)] focus:outline-none transition-colors disabled:opacity-60"
          />
        </div>

        {/* Two-column fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={!user}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] disabled:opacity-60"
            >
              <option value="primary">Primary</option>
              <option value="standard">Standard</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={!user}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">Beat</label>
            <input
              type="text"
              value={beat}
              onChange={(e) => setBeat(e.target.value)}
              disabled={!user}
              placeholder="sports, government..."
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1.5">Author</label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              disabled={!user}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] disabled:opacity-60"
            >
              <option value="">Unassigned</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>

        {/* Save button */}
        {user && dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {/* Status advancement */}
        {user && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-2">Workflow</label>
            <div className="flex flex-wrap gap-2">
              {nextStatus && (
                <button
                  onClick={() => onAdvance(item.id, nextStatus, item.concept)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/20 transition-colors"
                >
                  <ArrowRight size={12} /> Advance to {nextStatus}
                </button>
              )}
              <button
                onClick={() => {
                  const newDate = prompt('New target date (YYYY-MM-DD):', item.target_date)
                  if (newDate) onBumpDate(item.id, newDate)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors"
              >
                <CalendarDays size={12} /> Reschedule
              </button>
              <button
                onClick={() => onDuplicate(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                onClick={() => onKill(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
              >
                <Trash2 size={12} /> Kill
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Create Form ----------

function CreateForm({
  pubs,
  authors,
  onSubmit,
  loading,
}: {
  pubs: { id: string; name: string }[]
  authors: { id: string; name: string }[]
  onSubmit: (item: CreateEditorialItem) => void
  loading: boolean
}) {
  const [pubId, setPubId] = useState('')
  const [concept, setConcept] = useState('')
  const [targetDate, setTargetDate] = useState(new Date().toISOString().slice(0, 10))
  const [priority, setPriority] = useState('standard')
  const [beat, setBeat] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pubId || !concept || !targetDate) return
    onSubmit({
      publication_id: pubId,
      concept,
      target_date: targetDate,
      priority,
      beat: beat || undefined,
      author_id: authorId || undefined,
      notes: notes || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-accent)]/30 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold mb-4 text-[var(--color-accent-hover)]">New Editorial Concept</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Publication *</label>
          <select value={pubId} onChange={(e) => setPubId(e.target.value)} required className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]">
            <option value="">Select...</option>
            {pubs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Target Date *</label>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Concept *</label>
        <input type="text" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Story concept or headline..." required className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]">
            <option value="primary">Primary</option>
            <option value="standard">Standard</option>
            <option value="secondary">Secondary</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Beat</label>
          <input type="text" value={beat} onChange={(e) => setBeat(e.target.value)} placeholder="sports, government..." className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]" />
        </div>
        <div>
          <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Author</label>
          <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)]">
            <option value="">Unassigned</option>
            {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Context, sources, timing..." className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] resize-none" />
      </div>
      <button type="submit" disabled={loading} className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium py-2 px-5 rounded-lg text-sm transition-colors disabled:opacity-50">
        {loading ? 'Creating...' : 'Create Concept'}
      </button>
    </form>
  )
}

// ---------- Item Card (shared between grouped and flat views) ----------

function ItemCard({
  item, user, activeItem, selectedItems, setActiveItem, setSelectedItems,
  getNextStatus, advanceStatus, duplicate, today, showDate,
}: {
  item: EditorialItem
  user: any
  activeItem: EditorialItem | null
  selectedItems: Set<string>
  setActiveItem: (item: EditorialItem | null) => void
  setSelectedItems: (fn: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  getNextStatus: (status: string) => string | null
  advanceStatus: { mutate: (args: { id: string; status: string; concept: string }) => void }
  duplicate: { mutate: (id: string) => void }
  today: string
  showDate: boolean
}) {
  const nextStatus = getNextStatus(item.status)
  const isSelected = selectedItems.has(item.id)
  const isActive = activeItem?.id === item.id

  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('input[type="checkbox"], button, a')) return
        setActiveItem(isActive ? null : item)
      }}
      className={`bg-[var(--color-surface)] border rounded-lg p-4 transition-all group cursor-pointer ${
        isActive
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 ring-1 ring-[var(--color-accent)]/30'
          : isSelected
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {user && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              const newSet = new Set(selectedItems)
              if (e.target.checked) newSet.add(item.id)
              else newSet.delete(item.id)
              setSelectedItems(newSet)
            }}
            className="mt-1 shrink-0 cursor-pointer w-4 h-4"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: PUB_COLORS[item.pub_slug] ?? '#6366f1' }}
            >
              {PUB_SHORT[item.pub_slug] ?? item.pub_slug}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(item.status)}`}>
              {item.status}
            </span>
            {item.priority && (
              <span className={`text-[10px] font-medium capitalize ${item.priority === 'primary' ? 'text-amber-400' : 'text-[var(--color-text-muted)]'}`}>
                {item.priority}
              </span>
            )}
            {showDate && item.target_date && (
              <span className={`text-[10px] ${item.target_date < today ? 'text-red-400 font-semibold' : 'text-[var(--color-text-muted)]'}`}>
                {formatDate(item.target_date)}
              </span>
            )}
            {item.post_id && (
              <Link
                to={`/posts/${item.post_id}`}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors shrink-0"
                title="Open linked article"
              >
                <FileText size={9} /> Article
              </Link>
            )}
          </div>
          <h3 className="text-sm font-medium leading-snug">{item.concept}</h3>
          {item.notes && (
            <p className="text-[12px] text-[var(--color-text-muted)] mt-1 leading-relaxed line-clamp-2">{item.notes}</p>
          )}
        </div>

        {/* Inline actions */}
        {user && (
          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {nextStatus && (
              <button
                onClick={() => advanceStatus.mutate({ id: item.id, status: nextStatus, concept: item.concept })}
                title={`Advance to ${nextStatus}`}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/20 transition-colors"
              >
                <ArrowRight size={10} /> {nextStatus}
              </button>
            )}
            <button
              onClick={() => duplicate.mutate(item.id)}
              title="Duplicate tomorrow"
              className="px-2 py-1 rounded text-[10px] font-semibold bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors"
            >
              <Copy size={10} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            {item.author_name && <p className="text-[11px] text-[var(--color-text-muted)]">{item.author_name}</p>}
            {item.beat && <p className="text-[10px] text-[var(--color-text-muted)] capitalize mt-0.5">{item.beat}</p>}
          </div>
          <ChevronRight size={14} className={`text-[var(--color-text-muted)] transition-transform ${isActive ? 'rotate-90 text-[var(--color-accent-hover)]' : ''}`} />
        </div>
      </div>
    </div>
  )
}

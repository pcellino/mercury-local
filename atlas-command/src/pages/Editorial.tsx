import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getEditorialCalendar, getPublications, getAuthors } from '../lib/queries'
import { createEditorialItem, updateEditorialStatus, updateEditorialDate, killEditorialItem, duplicateEditorialItem, updateEditorialItem, type CreateEditorialItem } from '../lib/mutations'
import { statusColor, formatDate, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { CalendarDays, Plus, X, Trash2, ArrowRight, Copy, Pencil, AlertCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'

const STATUSES = ['all', 'concept', 'assigned', 'drafting', 'review', 'scheduled']
const STATUS_FLOW = ['concept', 'assigned', 'drafting', 'review', 'scheduled', 'published']

export default function Editorial() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [mutError, setMutError] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['editorial', statusFilter],
    queryFn: () => getEditorialCalendar({ status: statusFilter }),
  })

  const pubs = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const authors = useQuery({ queryKey: ['authors'], queryFn: getAuthors })

  const advanceStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateEditorialStatus(id, status),
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
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['editorial'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to kill item'),
  })

  const duplicate = useMutation({
    mutationFn: (id: string) => duplicateEditorialItem(id),
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['editorial'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to duplicate item'),
  })

  const updateConcept = useMutation({
    mutationFn: ({ id, concept }: { id: string; concept: string }) => updateEditorialItem(id, { concept }),
    onSuccess: () => {
      setMutError(null)
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      setEditingId(null)
    },
    onError: (err: any) => setMutError(err.message ?? 'Failed to update concept'),
  })

  const create = useMutation({
    mutationFn: (item: CreateEditorialItem) => createEditorialItem(item),
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

  // Group by target_date
  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, item) => {
    const key = item.target_date ?? 'unscheduled'
    if (!acc[key]) acc[key] = []
    acc[key]!.push(item)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'unscheduled') return 1
    if (b === 'unscheduled') return -1
    return a.localeCompare(b)
  })

  const today = new Date().toISOString().slice(0, 10)

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays size={24} className="text-[var(--color-accent-hover)]" />
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

      {/* Status filter pills */}
      <div className="flex gap-1 mb-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              statusFilter === s
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {s}
          </button>
        ))}
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

      {/* Timeline view */}
      <div className="space-y-6">
        {sortedDates.map((date) => {
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
                {items.map((item) => {
                  const nextStatus = getNextStatus(item.status)
                  const isSelected = selectedItems.has(item.id)
                  const isEditing = editingId === item.id
                  return (
                    <div key={item.id} className={`bg-[var(--color-surface)] border rounded-lg p-4 transition-colors group ${isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/50'}`}>
                      <div className="flex items-start justify-between gap-4">
                        {user && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSet = new Set(selectedItems)
                              if (e.target.checked) {
                                newSet.add(item.id)
                              } else {
                                newSet.delete(item.id)
                              }
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
                          </div>
                          {isEditing ? (
                            <div className="flex gap-2 mb-1">
                              <input
                                autoFocus
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onBlur={() => {
                                  if (editingText && editingText !== item.concept) {
                                    updateConcept.mutate({ id: item.id, concept: editingText })
                                  } else {
                                    setEditingId(null)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingText && editingText !== item.concept) {
                                      updateConcept.mutate({ id: item.id, concept: editingText })
                                    } else {
                                      setEditingId(null)
                                    }
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null)
                                  }
                                }}
                                className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-accent)] rounded px-2 py-1 text-sm text-[var(--color-text)]"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3
                                onClick={() => {
                                  setEditingId(item.id)
                                  setEditingText(item.concept)
                                }}
                                className="text-sm font-medium leading-snug cursor-pointer hover:text-[var(--color-accent-hover)] transition-colors"
                              >
                                {item.concept}
                              </h3>
                              {item.post_id && (
                                <Link
                                  to={`/posts/${item.post_id}`}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors shrink-0"
                                  title="Edit post"
                                >
                                  <Pencil size={10} /> Edit Post
                                </Link>
                              )}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-[12px] text-[var(--color-text-muted)] mt-1 leading-relaxed">{item.notes}</p>
                          )}
                        </div>

                        {/* Actions (visible on hover for authed users) */}
                        {user && (
                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {nextStatus && (
                              <button
                                onClick={() => advanceStatus.mutate({ id: item.id, status: nextStatus })}
                                title={`Advance to ${nextStatus}`}
                                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/20 transition-colors"
                              >
                                <ArrowRight size={10} /> {nextStatus}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const newDate = prompt('New target date (YYYY-MM-DD):', item.target_date)
                                if (newDate) bumpDate.mutate({ id: item.id, date: newDate })
                              }}
                              title="Change date"
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors"
                            >
                              <CalendarDays size={10} />
                            </button>
                            <button
                              onClick={() => duplicate.mutate(item.id)}
                              title="Duplicate tomorrow"
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-purple-400/10 text-purple-400 hover:bg-purple-400/20 transition-colors"
                            >
                              <Copy size={10} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Kill this item?')) kill.mutate(item.id)
                              }}
                              title="Kill"
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        )}

                        <div className="text-right shrink-0">
                          {item.author_name && <p className="text-[11px] text-[var(--color-text-muted)]">{item.author_name}</p>}
                          {item.beat && <p className="text-[10px] text-[var(--color-text-muted)] capitalize mt-0.5">{item.beat}</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {data?.length === 0 && !isLoading && (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <p className="text-sm">No editorial items found for this filter.</p>
        </div>
      )}
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

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEditorialCalendar, getPublications, getAuthors } from '../lib/queries'
import { createEditorialItem, updateEditorialStatus, updateEditorialDate, killEditorialItem, type CreateEditorialItem } from '../lib/mutations'
import { statusColor, formatDate, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { CalendarDays, Plus, X, Trash2, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/auth'

const STATUSES = ['all', 'concept', 'assigned', 'drafting', 'review', 'scheduled']
const STATUS_FLOW = ['concept', 'assigned', 'drafting', 'review', 'scheduled', 'published']

export default function Editorial() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['editorial', statusFilter],
    queryFn: () => getEditorialCalendar({ status: statusFilter }),
  })

  const pubs = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const authors = useQuery({ queryKey: ['authors'], queryFn: getAuthors })

  const advanceStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateEditorialStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorial'] }),
  })

  const bumpDate = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => updateEditorialDate(id, date),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorial'] }),
  })

  const kill = useMutation({
    mutationFn: (id: string) => killEditorialItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorial'] }),
  })

  const create = useMutation({
    mutationFn: (item: CreateEditorialItem) => createEditorialItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      setShowCreate(false)
    },
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
                  return (
                    <div key={item.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-accent)]/50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
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
                          <h3 className="text-sm font-medium leading-snug">{item.concept}</h3>
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

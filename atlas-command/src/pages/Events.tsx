import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCommunityEvents, getPublications, getPublishedCoverage, generateEventPlaceholders, type CommunityEvent } from '../lib/queries'
import { createEditorialItem, logActivity, type CreateEditorialItem } from '../lib/mutations'
import { todayET } from '../lib/utils'
import { CalendarRange, MapPin, Plus, X, ChevronLeft, ChevronRight, Landmark, Trophy, Users, Calendar, EyeOff, Check, Sparkles } from 'lucide-react'

const CATEGORY_META: Record<string, { label: string; icon: typeof Landmark; color: string }> = {
  government: { label: 'Government', icon: Landmark, color: '#6366f1' },
  sports:     { label: 'Sports',     icon: Trophy,   color: '#22c55e' },
  community:  { label: 'Community',  icon: Users,    color: '#f97316' },
  personal:   { label: 'Personal',   icon: Calendar,  color: '#D97757' },
  general:    { label: 'General',    icon: Calendar,  color: '#8c8c8a' },
}

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META.general
}

function dayLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Today'
  const d = new Date(dateStr + 'T12:00:00')
  const tomorrow = new Date(todayStr + 'T12:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function buildWeekDates(startDate: string): string[] {
  const dates: string[] = []
  const d = new Date(startDate + 'T12:00:00')
  for (let i = 0; i < 7; i++) {
    dates.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }
  return dates
}

export default function Events() {
  const queryClient = useQueryClient()
  const todayStr = todayET()

  const [weekOffset, setWeekOffset] = useState(0)
  const startDate = useMemo(() => {
    const d = new Date(todayStr + 'T12:00:00')
    d.setDate(d.getDate() + weekOffset * 7)
    return d.toISOString().split('T')[0]
  }, [todayStr, weekOffset])

  const weekDates = useMemo(() => buildWeekDates(startDate), [startDate])
  const endDate = weekDates[6]

  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [mutError, setMutError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState(false)
  const [hideCovered, setHideCovered] = useState(false)

  const { data: events, isLoading } = useQuery({
    queryKey: ['community-events', startDate, endDate],
    queryFn: () => getCommunityEvents(startDate, endDate),
  })

  const { data: published } = useQuery({
    queryKey: ['published-coverage', startDate, endDate],
    queryFn: () => getPublishedCoverage(startDate, endDate),
  })

  const pubs = useQuery({ queryKey: ['publications'], queryFn: getPublications })

  function isCovered(ev: CommunityEvent): boolean {
    if (!published?.length) return false
    const source = (ev.subcategory ?? ev.source_calendar ?? '').toLowerCase()
    const evTitle = ev.title.toLowerCase()

    return published.some(p => {
      const concept = p.concept.toLowerCase()
      const pDate = new Date(p.target_date + 'T12:00:00')
      const eDate = new Date(ev.event_date + 'T12:00:00')
      const diffDays = Math.abs((pDate.getTime() - eDate.getTime()) / 86400000)
      if (diffDays > 1) return false

      // Strong match: linked via post_id + team name in concept
      if (p.post_id && source && concept.includes(source.split(' ').pop()!)) return true

      // Fuzzy fallback for pre-link data: team name match
      if (source && concept.includes(source.split(' ').pop()!)) return true

      // Fuzzy fallback: title word overlap
      const titleWords = evTitle.split(/\s+/).filter(w => w.length > 3)
      const matchCount = titleWords.filter(w => concept.includes(w)).length
      if (titleWords.length > 0 && matchCount >= Math.ceil(titleWords.length * 0.5)) return true

      return false
    })
  }

  // Group events by date, optionally filtering out covered ones
  const byDate = useMemo(() => {
    const map: Record<string, CommunityEvent[]> = {}
    for (const d of weekDates) map[d] = []
    for (const ev of events ?? []) {
      if (hideCovered && isCovered(ev)) continue
      if (map[ev.event_date]) map[ev.event_date].push(ev)
    }
    return map
  }, [events, weekDates, hideCovered, published])

  // Add to editorial calendar form state
  const [formPub, setFormPub] = useState('')
  const [formConcept, setFormConcept] = useState('')
  const [formBeat, setFormBeat] = useState('')
  const [formDate, setFormDate] = useState('')

  function openAddForm(ev: CommunityEvent) {
    setSelectedEvent(ev)
    setFormConcept(ev.title)
    setFormBeat(ev.category === 'government' ? 'government' : ev.category === 'sports' ? 'sports' : '')
    setFormDate(ev.event_date)
    setFormPub('')
    setShowAddForm(true)
    setMutError(null)
  }

  const createStory = useMutation({
    mutationFn: async (item: CreateEditorialItem) => {
      await createEditorialItem(item)
      await logActivity({
        action: 'create',
        entity_type: 'editorial',
        entity_title: item.concept,
        publication_id: item.publication_id,
        details: { source: 'events_calendar' },
      })
    },
    onSuccess: () => {
      setMutError(null)
      setShowAddForm(false)
      setSelectedEvent(null)
      setSuccessToast(true)
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      setTimeout(() => setSuccessToast(false), 2500)
    },
    onError: (err: any) => setMutError(err.message ?? 'Failed to create story'),
  })

  const [genToast, setGenToast] = useState<string | null>(null)
  const generatePlaceholders = useMutation({
    mutationFn: generateEventPlaceholders,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['editorial'] })
      queryClient.invalidateQueries({ queryKey: ['published-coverage'] })
      setGenToast(`Generated ${result.created} idea${result.created !== 1 ? 's' : ''}, skipped ${result.skipped}`)
      setTimeout(() => setGenToast(null), 3000)
    },
    onError: (err: any) => setGenToast(`Error: ${err.message}`),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formPub || !formConcept || !formDate) return
    createStory.mutate({
      publication_id: formPub,
      concept: formConcept,
      target_date: formDate,
      beat: formBeat || undefined,
      source_type: 'events_calendar',
      status: 'idea',
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange size={20} className="text-[var(--color-accent)]" />
          <h2 className="text-lg font-semibold">Events Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generatePlaceholders.mutate()}
            disabled={generatePlaceholders.isPending}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
            title="Auto-generate editorial ideas for upcoming home games"
          >
            <Sparkles size={13} />
            {generatePlaceholders.isPending ? 'Generating…' : 'Auto-Generate Ideas'}
          </button>
          <div className="w-px h-5 bg-[var(--color-border)]" />
          <button
            onClick={() => setHideCovered(h => !h)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              hideCovered
                ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
            }`}
            title={hideCovered ? 'Show all events' : 'Hide events with published coverage'}
          >
            <EyeOff size={13} />
            Hide Covered
          </button>
          <div className="w-px h-5 bg-[var(--color-border)]" />
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
            disabled={weekOffset === 0}
          >
            This Week
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Toasts */}
      {successToast && (
        <div className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg px-4 py-2 text-sm font-medium">
          Story added to editorial calendar
        </div>
      )}
      {genToast && (
        <div className={`${genToast.startsWith('Error') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} border rounded-lg px-4 py-2 text-sm font-medium`}>
          {genToast}
        </div>
      )}

      {/* 7-day strip */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map(dateStr => {
            const dayEvents = byDate[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isPast = dateStr < todayStr

            return (
              <div
                key={dateStr}
                className={`rounded-xl border p-3 min-h-[180px] flex flex-col transition-colors ${
                  isToday
                    ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5'
                    : isPast
                      ? 'border-[var(--color-border)] opacity-60'
                      : 'border-[var(--color-border)]'
                }`}
              >
                {/* Day header */}
                <div className="mb-2 pb-2 border-b border-[var(--color-border)]">
                  <div className={`text-xs font-semibold ${isToday ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                    {dayLabel(dateStr, todayStr)}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Events list */}
                <div className="flex-1 space-y-1.5">
                  {dayEvents.length === 0 && (
                    <p className="text-[11px] text-[var(--color-text-muted)] italic">No events</p>
                  )}
                  {dayEvents.map(ev => {
                    const meta = categoryMeta(ev.category)
                    const Icon = meta.icon
                    const isSelected = selectedEvent?.id === ev.id && !showAddForm
                    const covered = isCovered(ev)

                    return (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(isSelected ? null : ev)}
                        className={`w-full text-left rounded-lg px-2 py-1.5 text-[11px] leading-tight transition-all cursor-pointer border ${
                          isSelected
                            ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10'
                            : 'border-transparent hover:bg-[var(--color-surface-2)]'
                        } ${covered ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-1.5">
                          {covered
                            ? <Check size={11} className="mt-0.5 shrink-0 text-green-500" />
                            : <Icon size={11} className="mt-0.5 shrink-0" style={{ color: meta.color }} />
                          }
                          <span className={`font-medium line-clamp-2 ${covered ? 'line-through' : ''}`}>{ev.title}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail panel — slides in below when an event is selected */}
      {selectedEvent && !showAddForm && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {(() => {
                  const meta = categoryMeta(selectedEvent.category)
                  const Icon = meta.icon
                  return (
                    <>
                      <Icon size={14} style={{ color: meta.color }} />
                      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      {selectedEvent.subcategory && (
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          / {selectedEvent.subcategory.replace(/-/g, ' ')}
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
              <h3 className="text-[15px] font-semibold mb-2">{selectedEvent.title}</h3>

              {selectedEvent.location && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-1.5">
                  <MapPin size={12} />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.event_time && (
                <div className="text-xs text-[var(--color-text-muted)] mb-1.5">
                  {selectedEvent.event_time.slice(0, 5)}
                  {selectedEvent.end_time && ` – ${selectedEvent.end_time.slice(0, 5)}`}
                </div>
              )}

              {selectedEvent.all_day && !selectedEvent.event_time && (
                <div className="text-xs text-[var(--color-text-muted)] mb-1.5">All day</div>
              )}

              {selectedEvent.source_calendar && (
                <div className="text-[11px] text-[var(--color-text-muted)] mb-1.5">
                  Source: {selectedEvent.source_calendar}
                  {selectedEvent.source === 'gcal' && <span className="ml-1 opacity-60">via Google Calendar</span>}
                </div>
              )}

              {selectedEvent.description && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2 whitespace-pre-line leading-relaxed max-w-xl">
                  {selectedEvent.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openAddForm(selectedEvent)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                <Plus size={13} />
                Add Story
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Editorial Calendar form */}
      {showAddForm && selectedEvent && (
        <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-surface)] p-5" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Add Story to Editorial Calendar</h3>
            <button
              onClick={() => { setShowAddForm(false); setMutError(null) }}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="text-xs text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
            {(() => { const m = categoryMeta(selectedEvent.category); const I = m.icon; return <I size={11} style={{ color: m.color }} /> })()}
            From: {selectedEvent.title}
          </div>

          {mutError && (
            <div className="mb-3 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{mutError}</div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Story Concept</label>
              <input
                type="text"
                value={formConcept}
                onChange={e => setFormConcept(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Publication</label>
              <select
                value={formPub}
                onChange={e => setFormPub(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)]"
                required
              >
                <option value="">Select publication…</option>
                {(pubs.data ?? []).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Target Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">Beat</label>
              <input
                type="text"
                value={formBeat}
                onChange={e => setFormBeat(e.target.value)}
                placeholder="e.g. government, sports"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={createStory.isPending || !formPub || !formConcept}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
              >
                <Plus size={13} />
                {createStory.isPending ? 'Creating…' : 'Create Story'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state for the whole calendar */}
      {!isLoading && (events ?? []).length === 0 && (
        <div className="text-center py-10">
          <CalendarRange size={32} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
          <p className="text-sm text-[var(--color-text-muted)]">No events this week</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Events from government meetings, sports schedules, and community calendars will appear here.</p>
        </div>
      )}
    </div>
  )
}

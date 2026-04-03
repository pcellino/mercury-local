import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEditorialCalendar, getPublications } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, Calendar, List, Plus, X } from 'lucide-react'
import { PUB_COLORS } from '../lib/utils'

const STATUS_COLORS: Record<string, string> = {
  concept: '#6b7280',
  assigned: '#3b82f6',
  drafting: '#f59e0b',
  review: '#a855f7',
  scheduled: '#10b981',
  published: '#22c55e',
  killed: '#ef4444',
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = []

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: daysInPrevMonth - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrentMonth: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, month, year, isCurrentMonth: true })
  }
  // Next month leading days to fill 6 rows
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: d, month: month + 1, year: month === 11 ? year + 1 : year, isCurrentMonth: false })
  }

  return cells
}

function formatDateKey(year: number, month: number, date: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
}

interface QuickAddForm {
  date: string
  concept: string
  publication_id: string
  priority: string
  beat: string
}

export default function Schedule() {
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [quickAdd, setQuickAdd] = useState<QuickAddForm | null>(null)

  const queryClient = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ['editorial-calendar-all'],
    queryFn: () => getEditorialCalendar(),
  })

  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

  const createItem = useMutation({
    mutationFn: async (form: QuickAddForm) => {
      const { error } = await supabase.from('editorial_calendar').insert({
        concept: form.concept,
        publication_id: form.publication_id,
        target_date: form.date,
        priority: form.priority || 'normal',
        beat: form.beat || null,
        status: 'concept',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial-calendar-all'] })
      setQuickAdd(null)
    },
  })

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map: Record<string, typeof items> = {}
    for (const item of items) {
      const key = item.target_date?.split('T')[0] ?? ''
      if (!map[key]) map[key] = []
      map[key].push(item)
    }
    return map
  }, [items])

  const cells = getMonthDays(viewYear, viewMonth)
  const todayKey = formatDateKey(now.getFullYear(), now.getMonth(), now.getDate())
  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' })

  // For list view: items in current month
  const monthItems = useMemo(() => {
    const start = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`
    const endMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const endYear = viewMonth === 11 ? viewYear + 1 : viewYear
    const end = `${endYear}-${String(endMonth + 1).padStart(2, '0')}-01`
    return items
      .filter(i => i.target_date >= start && i.target_date < end)
      .sort((a, b) => a.target_date.localeCompare(b.target_date))
  }, [items, viewMonth, viewYear])

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  function goToday() {
    setViewMonth(now.getMonth())
    setViewYear(now.getFullYear())
  }

  function openQuickAdd(dateKey: string) {
    setQuickAdd({
      date: dateKey,
      concept: '',
      publication_id: publications?.[0]?.id ?? '',
      priority: 'normal',
      beat: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Schedule</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">Editorial calendar with visual planning</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setView('calendar')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === 'calendar' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Calendar size={12} /> Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === 'list' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <List size={12} /> List
            </button>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-[var(--color-surface-2)] transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">{monthName}</h2>
          <button onClick={goToday} className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            Today
          </button>
        </div>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-[var(--color-surface-2)] transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
            {DAYS.map(d => (
              <div key={d} className="px-2 py-2 text-[10px] font-semibold text-[var(--color-text-muted)] text-center uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const dateKey = formatDateKey(cell.year, cell.month, cell.date)
              const isToday = dateKey === todayKey
              const dayItems = itemsByDate[dateKey] ?? []

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-[var(--color-border)] p-1.5 group cursor-pointer hover:bg-[var(--color-surface-2)]/50 transition-colors ${
                    !cell.isCurrentMonth ? 'opacity-30' : ''
                  }`}
                  onClick={() => cell.isCurrentMonth && openQuickAdd(dateKey)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-[var(--color-accent)] text-white' : ''
                    }`}>
                      {cell.date}
                    </span>
                    {cell.isCurrentMonth && (
                      <Plus size={12} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        className="text-[10px] leading-tight px-1.5 py-0.5 rounded truncate"
                        style={{
                          backgroundColor: `${STATUS_COLORS[item.status] ?? '#6366f1'}20`,
                          borderLeft: `2px solid ${PUB_COLORS[item.pub_slug] ?? '#6366f1'}`,
                        }}
                        title={`${item.concept} (${item.pub_name} · ${item.status})`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.concept}
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[9px] text-[var(--color-text-muted)] px-1.5">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          {monthItems.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]">
              No editorial items for {monthName}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {monthItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition-colors">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.status] ?? '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.concept}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      {item.pub_name}{item.author_name ? ` · ${item.author_name}` : ''}{item.beat ? ` · ${item.beat}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: `${STATUS_COLORS[item.status] ?? '#6366f1'}20`,
                        color: STATUS_COLORS[item.status] ?? '#6366f1',
                      }}
                    >
                      {item.status}
                    </span>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {new Date(item.target_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status legend */}
      <div className="flex items-center gap-4 justify-center flex-wrap">
        {Object.entries(STATUS_COLORS).filter(([s]) => s !== 'killed').map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-[var(--color-text-muted)] capitalize">{status}</span>
          </div>
        ))}
      </div>

      {/* Quick Add Modal */}
      {quickAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setQuickAdd(null)}>
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-[420px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">
                Add Editorial Item — {new Date(quickAdd.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>
              <button onClick={() => setQuickAdd(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Concept *</label>
                <input
                  value={quickAdd.concept}
                  onChange={(e) => setQuickAdd({ ...quickAdd, concept: e.target.value })}
                  placeholder="Story concept or headline..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Publication</label>
                  <select
                    value={quickAdd.publication_id}
                    onChange={(e) => setQuickAdd({ ...quickAdd, publication_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none"
                  >
                    {publications?.filter(p => p.domain).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--color-text-muted)] block mb-1">Priority</label>
                  <select
                    value={quickAdd.priority}
                    onChange={(e) => setQuickAdd({ ...quickAdd, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-muted)] block mb-1">Beat</label>
                <input
                  value={quickAdd.beat}
                  onChange={(e) => setQuickAdd({ ...quickAdd, beat: e.target.value })}
                  placeholder="e.g. Government, Sports, Business..."
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setQuickAdd(null)}
                  className="px-4 py-2 text-xs rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => quickAdd.concept.trim() && createItem.mutate(quickAdd)}
                  disabled={!quickAdd.concept.trim() || createItem.isPending}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                >
                  {createItem.isPending ? 'Adding...' : 'Add to Calendar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

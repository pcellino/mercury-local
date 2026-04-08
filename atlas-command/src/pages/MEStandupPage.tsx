// atlas-command/src/pages/MEStandupPage.tsx
// v2 — adds Today's Events panel (from cal_events), parse error fallback UI
// Route: /me

import { useMEStandup, MEDecision } from '../hooks/useMEStandup'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STEPS = [
  "Checking today's news across all beats",
  'Loading editorial calendar & today\'s events',
  'Checking open pitches & published content',
  'Synthesizing decisions for publisher',
]

const TAG_STYLES: Record<string, string> = {
  assign:  'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  approve: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  kill:    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  stale:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  concept: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pitch:   'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  gate:    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const CATEGORY_ICON: Record<string, string> = {
  game: '🏟',
  meeting: '🏛',
  race: '🏁',
  event: '📅',
}

function healthColor(days: number, threshold: number) {
  if (days == null) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (days <= threshold * 0.5) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  if (days <= threshold) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
}

function statusBadge(status: string, overdue = false) {
  if (overdue) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  if (status === 'in-progress') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (status === 'published') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
  return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
}

export default function MEStandupPage() {
  const { standup, status, error, resolved, loadingStep, load,
          resolve, resolvedCount, totalDecisions, allResolved } = useMEStandup()
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: 'me' | 'pc'; text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
  }) + ' ET'
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/New_York'
  })

  async function sendChat() {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'pc', text: msg }])
    setChatLoading(true)
    try {
      const resolvedSummary = Object.entries(resolved)
        .map(([id, out]) => {
          const d = standup?.decisions.find(x => x.id === Number(id))
          return `Decision ${id} [${d?.tag ?? '?'}]: ${out}`
        }).join('; ') || 'None yet'
      const { data } = await supabase.functions.invoke('me-standup-chat', {
        body: { message: msg, resolvedSummary, standupDate: standup?.date }
      })
      setChatHistory(prev => [...prev, { role: 'me', text: data?.reply ?? 'Error reaching ME.' }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'me', text: 'Connection error.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f0e8] dark:bg-gray-950 flex flex-col">
        <header className="border-b-2 border-double border-gray-900 dark:border-gray-100 px-6 py-3 flex items-baseline gap-5">
          <span className="font-serif text-2xl text-gray-900 dark:text-gray-100" style={{ fontFamily: 'Georgia,serif' }}>
            The Mercury
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 border-l border-gray-400 pl-4">
            Managing Editor · Morning Standup
          </span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
            ME initializing — running morning checks
          </p>
          <div className="flex flex-col gap-1.5 w-80">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-200 dark:border-gray-800">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  i < loadingStep  ? 'bg-green-600' :
                  i === loadingStep ? 'bg-amber-500 animate-pulse' :
                  'border border-gray-400'
                }`} />
                <span className={`font-mono text-[10px] ${i <= loadingStep ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f5f0e8] dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest text-red-600 mb-3">
            ME initialization failed
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-mono">{error}</p>
          <button onClick={load}
            className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider border border-gray-900 dark:border-gray-100 hover:bg-gray-900 hover:text-white transition-colors">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!standup) return null

  const remaining = totalDecisions - resolvedCount
  const hasEvents = standup.todayEvents && standup.todayEvents.length > 0

  // ── MAIN UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-gray-950 font-serif" style={{ fontFamily: 'Georgia,serif' }}>

      {/* MASTHEAD */}
      <header className="border-b-[3px] border-double border-gray-900 dark:border-gray-100 px-4 md:px-6 py-3 flex items-baseline gap-3 md:gap-5 flex-wrap">
        <span className="text-2xl md:text-3xl text-gray-900 dark:text-gray-100">The Mercury</span>
        <div className="text-[9px] font-mono uppercase tracking-widest text-gray-500 border-l border-gray-400 pl-3 leading-relaxed">
          Managing Editor<br />Morning Standup
        </div>
        <div className="ml-auto text-right font-mono text-[9px] text-gray-400 leading-relaxed">
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${
            allResolved ? 'bg-green-600' : 'bg-amber-500 animate-pulse'
          }`} />
          {timeStr}<br />{dateStr}
        </div>
      </header>

      {/* OVERDUE BANNER */}
      {standup.overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-600 px-4 py-1.5 text-[10px] text-red-700 dark:text-red-400 flex items-center gap-2 font-mono">
          <strong className="uppercase tracking-wider">Overdue</strong>
          {standup.overdue.length} item{standup.overdue.length !== 1 ? 's' : ''} past target — see slate below
        </div>
      )}

      {/* PARSE ERROR BANNER */}
      {standup._parse_error && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 px-4 py-1.5 text-[10px] text-amber-700 dark:text-amber-400 font-mono">
          ⚠️ ME response parse error — real Supabase data loaded, AI decisions unavailable. Retry to regenerate.
        </div>
      )}

      <div className="flex flex-col md:grid md:grid-cols-[1fr_272px] min-h-[calc(100vh-80px)]">

        {/* ── MAIN COLUMN ─────────────────────────────────────────────────── */}
        <main className="border-r border-gray-300 dark:border-gray-800 min-w-0">

          {/* DECISIONS */}
          <div className="bg-gray-900 text-gray-100 px-4 py-1 flex justify-between items-center">
            <span className="font-mono text-[9px] uppercase tracking-widest">Your decisions today</span>
            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
              allResolved ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}>
              {allResolved ? 'All resolved ✓' : `${remaining} of ${totalDecisions} remaining`}
            </span>
          </div>

          <div className="p-3 md:p-4 border-b border-gray-300 dark:border-gray-700 flex flex-col gap-2">
            {standup.decisions.length === 0 && (
              <p className="text-[12px] text-gray-400 italic py-2">No decisions generated — check API or retry.</p>
            )}
            {standup.decisions.map((d) => {
              const isResolved = resolved[d.id] !== undefined
              return (
                <div key={d.id} className={`border border-gray-300 dark:border-gray-700 rounded overflow-hidden transition-opacity ${isResolved ? 'opacity-40' : ''}`}>
                  <div className="flex items-start gap-2 p-2.5 bg-[#f5f0e8] dark:bg-gray-900">
                    <span className="font-mono text-[9px] text-gray-400 mt-0.5 flex-shrink-0 w-3">{d.id}</span>
                    <span className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${TAG_STYLES[d.tag] ?? TAG_STYLES.concept}`}>
                      {d.tag}
                    </span>
                    <span className="text-[12.5px] flex-1 leading-snug text-gray-900 dark:text-gray-100">{d.body}</span>
                    {d.pub && (
                      <span className="font-mono text-[8px] text-gray-400 flex-shrink-0 mt-0.5">{d.pub}</span>
                    )}
                  </div>

                  {isResolved ? (
                    <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 font-mono text-[9px] text-green-700 dark:text-green-400">
                      ✓ {resolved[d.id]}
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-1.5 flex-wrap px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                        {d.actions.map((a, i) => (
                          <button key={i}
                            onClick={() => resolve(d.id, a.outcome, d.tag, d.body, d.pub)}
                            className={`font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded border transition-colors ${
                              a.danger
                                ? 'border-red-300 text-red-700 hover:bg-red-700 hover:text-white hover:border-red-700'
                                : i === 0
                                  ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-700 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 dark:border-gray-600 dark:text-gray-300'
                            }`}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                      {d.note && (
                        <div className="px-3 pb-2 bg-gray-50 dark:bg-gray-800/50 font-serif text-[10.5px] text-gray-400 italic">
                          {d.note}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* NEWS RADAR */}
          <div className="bg-gray-900 text-gray-100 px-4 py-1">
            <span className="font-mono text-[9px] uppercase tracking-widest">News radar — story potential</span>
          </div>
          <div className="p-3 md:p-4 border-b border-gray-300 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-800">
            {standup.radar.map((r, i) => (
              <div key={i} className="py-2.5 grid grid-cols-[auto_1fr] gap-2.5 items-start">
                <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 mt-0.5">
                  {r.beat}
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-gray-900 dark:text-gray-100 leading-snug mb-1">{r.headline}</p>
                  <p className="text-[11.5px] text-gray-600 dark:text-gray-400 leading-relaxed">{r.body}</p>
                  {r.sources && (
                    <p className="font-mono text-[9px] text-gray-400 mt-1">{r.sources}</p>
                  )}
                </div>
              </div>
            ))}
            {standup.radar.length === 0 && (
              <p className="text-[12px] text-gray-400 italic py-2">No radar items.</p>
            )}
          </div>

          {/* EDITORIAL SLATE */}
          <div className="bg-gray-900 text-gray-100 px-4 py-1">
            <span className="font-mono text-[9px] uppercase tracking-widest">Editorial slate — today</span>
          </div>
          <div className="p-3 md:p-4 border-b border-gray-300 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-[11px] border-collapse" style={{ minWidth: 440 }}>
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-700">
                  {['Pub', 'Concept', 'Author', 'Beat', 'Status'].map(h => (
                    <th key={h} className="text-left py-1.5 pr-3 font-mono text-[8px] uppercase tracking-wider text-gray-400 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  ...standup.overdue.map((i: any) => ({ ...i, _overdue: true })),
                  ...standup.slate
                ].map((item: any, i: number) => (
                  <tr key={i} className={item._overdue ? 'bg-red-50/30 dark:bg-red-950/10' : ''}>
                    <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap text-[10px]">
                      {item.publications?.name ?? '—'}
                    </td>
                    <td className="py-1.5 pr-3 italic text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                      {item.concept}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap text-[10px]">
                      {item.authors?.name ?? '—'}
                    </td>
                    <td className="py-1.5 pr-3 text-gray-500 text-[10px]">{item.beat ?? '—'}</td>
                    <td className="py-1.5">
                      <span className={`font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded ${statusBadge(item.status, item._overdue)}`}>
                        {item._overdue ? 'overdue' : item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {standup.slate.length === 0 && standup.overdue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-3 text-[12px] text-gray-400 italic">No items on today's slate.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CONVERSATION */}
          <div className="bg-gray-900 text-gray-100 px-4 py-1">
            <span className="font-mono text-[9px] uppercase tracking-widest">Conversation</span>
          </div>
          <div className="max-h-44 overflow-y-auto px-4 py-2 divide-y divide-gray-100 dark:divide-gray-800">
            {chatHistory.length === 0 && (
              <p className="text-[11px] text-gray-400 italic py-2">
                Give direction on any decision, or type a new assignment…
              </p>
            )}
            {chatHistory.map((m, i) => (
              <div key={i} className={`py-2 flex flex-col ${m.role === 'pc' ? 'items-end' : 'items-start'}`}>
                <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400 mb-1">
                  {m.role === 'pc' ? 'Publisher' : 'ME'}
                </span>
                <p className={`text-[11.5px] leading-snug max-w-[85%] px-2.5 py-1.5 rounded ${
                  m.role === 'pc'
                    ? 'bg-gray-900 text-white dark:bg-gray-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                }`}>{m.text}</p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </main>

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside className="bg-[#ede8dc] dark:bg-gray-900/50 divide-y divide-gray-300 dark:divide-gray-800 text-[11.5px]">

          {/* TODAY'S EVENTS — cal_events */}
          <div>
            <div className="flex justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400">Today's events</span>
              <span className={`font-mono text-[8px] ${hasEvents ? 'text-amber-600' : 'text-gray-400'}`}>
                {hasEvents ? `${standup.todayEvents.length} scheduled` : 'none'}
              </span>
            </div>
            <div className="px-3 pb-2">
              {!hasEvents ? (
                <p className="text-[10.5px] text-gray-400 italic">No games or meetings in cal_events today.</p>
              ) : (
                standup.todayEvents.map((e: any, i: number) => (
                  <div key={i} className="py-1.5 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[11px] mt-0.5 flex-shrink-0">
                        {CATEGORY_ICON[e.category] ?? '📅'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-snug truncate">
                          {e.description}
                        </p>
                        <p className="font-mono text-[8px] text-gray-400">{e.beat}</p>
                        {e.result && (
                          <p className="font-mono text-[8px] text-green-600 dark:text-green-400">
                            ✓ {e.result}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LIBRARY HEALTH */}
          <div>
            <div className="flex justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400">Library health</span>
              <span className={`font-mono text-[8px] ${
                standup.health.some(h => h.days > h.threshold) ? 'text-red-600' : 'text-green-600'
              }`}>
                {standup.health.filter(h => h.days > h.threshold).length > 0
                  ? `${standup.health.filter(h => h.days > h.threshold).length} stale`
                  : 'all current'}
              </span>
            </div>
            <div className="px-3 pb-2 flex flex-col gap-0.5">
              {standup.health.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-0.5">
                  <span className="text-gray-700 dark:text-gray-300 text-[11px]">{h.beat}</span>
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${healthColor(h.days, h.threshold)}`}>
                    {h.days}d
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* OPEN PITCHES */}
          <div>
            <div className="flex justify-between px-3 pt-2 pb-1">
              <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400">Open pitches</span>
              <span className={`font-mono text-[8px] ${standup.pitches.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {standup.pitches.length > 0 ? `${standup.pitches.length} waiting` : 'none'}
              </span>
            </div>
            <div className="px-3 pb-2">
              {standup.pitches.length === 0
                ? <p className="text-[10.5px] text-gray-400 italic">No open pitches.</p>
                : standup.pitches.map((p: any, i: number) => (
                  <div key={i} className="py-1.5 border-b border-gray-200 dark:border-gray-800">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-[11px]">
                      {p.entities?.name ?? 'Unknown'}
                    </p>
                    <p className="font-mono text-[8px] text-gray-400">
                      {Math.floor((Date.now() - new Date(p.contacted_at).getTime()) / 3600000)}h
                      {p.contact_name && ` · ${p.contact_name}`}
                    </p>
                  </div>
                ))
              }
            </div>
          </div>

          {/* RECENTLY PUBLISHED */}
          <div>
            <div className="px-3 pt-2 pb-1">
              <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400">Published — 48h</span>
            </div>
            <div className="px-3 pb-2">
              {standup.recentPublished.length === 0
                ? <p className="text-[10.5px] text-gray-400 italic">Nothing in last 48h.</p>
                : standup.recentPublished.map((r: any, i: number) => (
                  <div key={i} className="py-1.5 border-b border-gray-200 dark:border-gray-800">
                    <p className="italic text-gray-900 dark:text-gray-100 leading-snug text-[11px]">
                      {r.concept}
                    </p>
                    <p className="font-mono text-[8px] text-gray-400">{r.publications?.name}</p>
                  </div>
                ))
              }
            </div>
          </div>

          {/* DECISIONS PROGRESS */}
          <div>
            <div className="px-3 pt-2 pb-1">
              <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400">Progress</span>
            </div>
            <div className="px-3 pb-2">
              {Object.keys(resolved).length === 0
                ? <p className="text-[10.5px] text-gray-400 italic">Awaiting decisions…</p>
                : Object.entries(resolved).map(([id, outcome]) => {
                  const d = standup.decisions.find(x => x.id === Number(id))
                  return (
                    <div key={id} className="py-1 border-b border-gray-200 dark:border-gray-800">
                      <span className={`font-mono text-[8px] mr-1 ${TAG_STYLES[d?.tag ?? 'concept']?.split(' ')[1] ?? ''}`}>
                        [{d?.tag}]
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 text-[10.5px]">{outcome}</span>
                    </div>
                  )
                })
              }
              {allResolved && (
                <p className="mt-2 font-mono text-[9px] text-green-700 dark:text-green-400">
                  ✓ All resolved — ME executing
                </p>
              )}
            </div>
          </div>

          {/* TOMORROW */}
          {standup.tomorrow_priority && (
            <div>
              <div className="px-3 pt-2 pb-1">
                <span className="font-mono text-[8px] uppercase tracking-wider text-gray-400">Tomorrow's priority</span>
              </div>
              <p className="px-3 pb-3 text-[11px] italic text-gray-600 dark:text-gray-400 leading-relaxed">
                {standup.tomorrow_priority}
              </p>
            </div>
          )}

        </aside>
      </div>

      {/* STICKY RESPONSE BAR */}
      <div className="sticky bottom-0 bg-gray-900 px-4 py-2 flex items-center gap-3 border-t-2 border-gray-800">
        <span className="font-mono text-[8px] uppercase tracking-widest text-gray-500 flex-shrink-0">ME →</span>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendChat()}
          placeholder="Give direction on any decision, or type a new assignment…"
          className="flex-1 bg-transparent border-0 border-b border-gray-700 focus:border-gray-300 text-gray-100 text-[12.5px] py-1 px-0 outline-none placeholder-gray-600"
          style={{ fontFamily: 'Georgia,serif' }}
        />
        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
          className="font-mono text-[9px] uppercase tracking-wider bg-gray-100 text-gray-900 px-3 py-1.5 rounded disabled:opacity-40 hover:bg-white transition-colors flex-shrink-0">
          {chatLoading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTranscripts, searchTranscripts, getTranscriptById, type Transcript } from '../lib/queries'
import { createEditorialItem } from '../lib/mutations'
import { supabase } from '../lib/supabase'
import {
  Search, FileText, ExternalLink, ChevronRight, ArrowLeft, X, Lightbulb, Plus,
} from 'lucide-react'
import { statusColor } from '../lib/utils'

interface StoryLead {
  id: string
  title: string
  meeting_date: string
  meeting_type: string | null
  summary: string | null
  publication_id: string | null
  pub_name: string | null
}

export default function Transcripts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set())
  const [showLeads, setShowLeads] = useState(true)

  // Story leads: transcripts with summaries that haven't been promoted to editorial calendar
  const storyLeads = useQuery({
    queryKey: ['story-leads'],
    queryFn: async (): Promise<StoryLead[]> => {
      // Get all editorial_calendar items sourced from transcripts
      const { data: ecItems } = await supabase
        .from('editorial_calendar')
        .select('notes')
        .eq('source_type', 'transcript')
      const usedTitles = new Set((ecItems ?? []).map((e: any) => e.notes).filter(Boolean))

      // Get transcripts with summaries (reviewed/processed status means they've been worked)
      const { data, error } = await supabase
        .from('transcripts')
        .select('id, title, meeting_date, meeting_type, summary, publication_id, publications(name)')
        .not('summary', 'is', null)
        .order('meeting_date', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? [])
        .map((row: any) => ({
          id: row.id,
          title: row.title,
          meeting_date: row.meeting_date,
          meeting_type: row.meeting_type,
          summary: row.summary,
          publication_id: row.publication_id,
          pub_name: row.publications?.name ?? null,
        }))
        .filter((t: StoryLead) => !usedTitles.has(t.title))
    },
  })

  async function promoteToEditorial(lead: StoryLead) {
    try {
      await createEditorialItem({
        publication_id: lead.publication_id!,
        concept: `[Transcript] ${lead.title}`,
        target_date: new Date().toISOString().split('T')[0],
        source_type: 'transcript',
        notes: lead.title,
        beat: lead.meeting_type ?? undefined,
      })
      setPromotedIds(prev => new Set([...prev, lead.id]))
    } catch (err) {
      console.error('Failed to promote story lead:', err)
    }
  }

  const allTranscripts = useQuery({
    queryKey: ['transcripts'],
    queryFn: () => getTranscripts(100),
  })

  const searchResults = useQuery({
    queryKey: ['transcript-search', searchQuery],
    queryFn: () => searchTranscripts(searchQuery),
    enabled: searching && searchQuery.length > 2,
  })

  const detail = useQuery({
    queryKey: ['transcript-detail', selectedId],
    queryFn: () => getTranscriptById(selectedId!),
    enabled: !!selectedId,
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.length > 2) setSearching(true)
  }

  function clearSearch() {
    setSearchQuery('')
    setSearching(false)
  }

  const transcripts = searching && searchQuery.length > 2
    ? (searchResults.data ?? [])
    : (allTranscripts.data ?? [])

  if (selectedId && detail.data) {
    return (
      <div className="max-w-5xl">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to transcripts
        </button>
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight mb-2">{detail.data.title}</h1>
          <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
            <span>{detail.data.meeting_date}</span>
            {detail.data.meeting_type && <span className="capitalize">{detail.data.meeting_type}</span>}
            {detail.data.word_count && <span>{detail.data.word_count.toLocaleString()} words</span>}
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(detail.data.status ?? 'raw')}`}>{detail.data.status ?? 'raw'}</span>
            {detail.data.source_url && (
              <a href={detail.data.source_url} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-[var(--color-accent-hover)]">
                Source <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>

        {detail.data.summary && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Summary</h3>
            <p className="text-sm text-[var(--color-text)] leading-relaxed">{detail.data.summary}</p>
          </div>
        )}

        {detail.data.processing_notes && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">Processing Notes</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{detail.data.processing_notes}</p>
          </div>
        )}

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 max-h-[600px] overflow-y-auto">
          <pre className="text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
            {detail.data.full_text || 'No transcript text available.'}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[var(--color-text-muted)]">{transcripts.length} transcripts</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length <= 2) setSearching(false) }}
            placeholder="Search transcripts (full-text)..."
            className="w-full pl-10 pr-10 py-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          {searching && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Story Leads */}
      {showLeads && storyLeads.data && storyLeads.data.filter(l => l.publication_id && !promotedIds.has(l.id)).length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-2">
              <Lightbulb size={14} /> Story Leads — Unworked Transcripts
            </h2>
            <button onClick={() => setShowLeads(false)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              Hide
            </button>
          </div>
          <div className="grid gap-3">
            {storyLeads.data
              .filter(l => l.publication_id && !promotedIds.has(l.id))
              .slice(0, 5)
              .map((lead) => (
              <div key={lead.id} className="bg-[var(--color-surface)] border border-amber-500/20 rounded-xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setSelectedId(lead.id)} className="text-sm font-medium hover:text-[var(--color-accent-hover)] transition-colors truncate text-left">
                      {lead.title}
                    </button>
                    {lead.pub_name && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] flex-shrink-0">{lead.pub_name}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                    {lead.summary ?? 'No summary available'}
                  </p>
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1 inline-block">{lead.meeting_date}</span>
                </div>
                <button
                  onClick={() => promoteToEditorial(lead)}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                  title="Create editorial concept from this transcript"
                >
                  <Plus size={12} /> Concept
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript list */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-2)]">
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Title</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Type</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Date</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Words</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Status</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {transcripts.map((t: Transcript) => (
              <tr
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <FileText size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize text-xs">{t.meeting_type ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--color-text-muted)]">{t.meeting_date}</td>
                <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{t.word_count?.toLocaleString() ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(t.status ?? 'raw')}`}>
                    {t.status ?? 'raw'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                </td>
              </tr>
            ))}
            {transcripts.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                {searching ? 'No results found' : 'No transcripts available'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTranscripts, searchTranscripts, getTranscriptById, type Transcript } from '../lib/queries'
import {
  Search, FileText, ExternalLink, ChevronRight, ArrowLeft, X,
} from 'lucide-react'
import { statusColor } from '../lib/utils'

export default function Transcripts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight">Transcripts</h1>
        <span className="text-xs text-[var(--color-text-muted)]">{transcripts.length} transcripts</span>
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

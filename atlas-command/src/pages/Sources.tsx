import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getSourceDocuments, searchSourceDocuments, getSourceDocumentById,
  getSourceDocumentPosts,
  type SourceDocumentDetail,
} from '../lib/queries'
import { formatDate } from '../lib/utils'
import { Search, X, ArrowLeft, FileText } from 'lucide-react'

const typeColor = (t: string) => {
  switch (t) {
    case 'arrest_log': return 'text-red-400 bg-red-400/10'
    case 'press_release': return 'text-blue-400 bg-blue-400/10'
    case 'foia': return 'text-amber-400 bg-amber-400/10'
    case 'agenda': return 'text-purple-400 bg-purple-400/10'
    case 'report': return 'text-green-400 bg-green-400/10'
    case 'budget': return 'text-cyan-400 bg-cyan-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

const statusBadge = (s: string) => {
  switch (s) {
    case 'processed': return 'text-green-400 bg-green-400/10'
    case 'pending': return 'text-yellow-400 bg-yellow-400/10'
    case 'raw': return 'text-orange-400 bg-orange-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export default function Sources() {
  const [search, setSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: docs, isLoading } = useQuery({
    queryKey: ['source-docs', activeSearch],
    queryFn: () => activeSearch ? searchSourceDocuments(activeSearch) : getSourceDocuments(),
  })

  const { data: detail } = useQuery({
    queryKey: ['source-doc', selectedId],
    queryFn: () => getSourceDocumentById(selectedId!),
    enabled: !!selectedId,
  })

  const { data: linkedPosts } = useQuery({
    queryKey: ['source-doc-posts', selectedId],
    queryFn: () => getSourceDocumentPosts(selectedId!),
    enabled: !!selectedId,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setActiveSearch(search)
    setSelectedId(null)
  }

  if (selectedId && detail) {
    return <DetailView doc={detail} posts={linkedPosts ?? []} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Source Documents</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            PDFs, press releases, FOIA responses, arrest logs, and other primary sources
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg">
          {docs?.length ?? 0} documents
        </span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setActiveSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="px-4 py-2 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]">
          Search
        </button>
      </form>

      {/* Document List */}
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading documents...</p>
      ) : !docs?.length ? (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No source documents found</p>
          <p className="text-xs mt-1">Documents are added during the content pipeline process</p>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Beat</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr
                  key={doc.id}
                  onClick={() => setSelectedId(doc.id)}
                  className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-[var(--color-text)] font-medium truncate max-w-xs">{doc.title}</p>
                    {doc.summary && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate max-w-xs">{doc.summary}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor(doc.document_type)}`}>
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{doc.source_org ?? '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(doc.document_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{doc.beat ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DetailView({ doc, posts, onBack }: {
  doc: SourceDocumentDetail
  posts: { id: string; title: string; slug: string; pub_date: string | null }[]
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-4">
          <ArrowLeft size={14} /> Back to documents
        </button>
        <h1 className="text-xl font-bold text-[var(--color-text)]">{doc.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-text-muted)]">
          <span className={`px-2 py-0.5 rounded-full ${typeColor(doc.document_type)}`}>
            {doc.document_type.replace(/_/g, ' ')}
          </span>
          <span className={`px-2 py-0.5 rounded-full ${statusBadge(doc.status)}`}>
            {doc.status}
          </span>
          {doc.source_org && <span>Source: {doc.source_org}</span>}
          <span>Date: {formatDate(doc.document_date)}</span>
          {doc.beat && <span>Beat: {doc.beat}</span>}
          {doc.file_format && <span>Format: {doc.file_format.toUpperCase()}</span>}
          {doc.record_count && <span>{doc.record_count} records</span>}
        </div>
      </div>

      {/* Summary */}
      {doc.summary && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-2">Summary</h2>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{doc.summary}</p>
        </div>
      )}

      {/* Linked Posts */}
      {posts.length > 0 && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Linked Articles ({posts.length})</h2>
          <div className="space-y-2">
            {posts.map(p => (
              <a
                key={p.id}
                href={`/posts/${p.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
              >
                <span className="text-sm text-[var(--color-accent-hover)]">{p.title}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{formatDate(p.pub_date)}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Processing Notes */}
      {doc.processing_notes && (
        <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-yellow-400 mb-2">Processing Notes</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{doc.processing_notes}</p>
        </div>
      )}

      {/* Extracted Text */}
      {doc.extracted_text && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">
            Extracted Text
            <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
              {doc.extracted_text.length.toLocaleString()} chars
            </span>
          </h2>
          <pre className="text-xs text-[var(--color-text-muted)] whitespace-pre-wrap font-mono max-h-[600px] overflow-y-auto leading-relaxed">
            {doc.extracted_text}
          </pre>
        </div>
      )}

      {/* Structured Data */}
      {doc.structured_data && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Structured Data</h2>
          <pre className="text-xs text-[var(--color-text-muted)] whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto">
            {JSON.stringify(doc.structured_data, null, 2)}
          </pre>
        </div>
      )}

      {/* File Info */}
      {doc.file_path && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-2">File Info</h2>
          <div className="text-xs text-[var(--color-text-muted)] space-y-1">
            <p>Path: <span className="font-mono">{doc.file_path}</span></p>
            {doc.file_size_bytes && <p>Size: {(doc.file_size_bytes / 1024).toFixed(1)} KB</p>}
            {doc.period_start && <p>Period: {formatDate(doc.period_start)} – {formatDate(doc.period_end)}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

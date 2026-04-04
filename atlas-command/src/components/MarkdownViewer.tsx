import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDocumentById, type Document } from '../lib/queries'
import { X, FileText, Pin, ChevronDown } from 'lucide-react'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'

/* ── Inline doc viewer (slide-over panel) ── */

interface MarkdownViewerProps {
  docId: string | null
  onClose: () => void
}

export default function MarkdownViewer({ docId, onClose }: MarkdownViewerProps) {
  if (!docId) return null

  return <ViewerPanel docId={docId} onClose={onClose} />
}

function ViewerPanel({ docId, onClose }: { docId: string; onClose: () => void }) {
  const { data: doc, isLoading, error } = useQuery({
    queryKey: ['document', docId],
    queryFn: () => getDocumentById(docId),
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative w-full max-w-2xl bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl flex flex-col overflow-hidden animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          <FileText size={15} className="text-[var(--color-accent-hover)] shrink-0" />
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="h-4 w-48 bg-[var(--color-surface-2)] rounded animate-pulse" />
            ) : (
              <>
                <h2 className="text-[14px] font-medium truncate">{doc?.title}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc?.pub_slug && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-white px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: PUB_COLORS[doc.pub_slug] ?? '#6366f1' }}
                    >
                      {PUB_SHORT[doc.pub_slug] ?? doc.pub_slug}
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--color-text-muted)] capitalize">{doc?.doc_type}</span>
                  {doc?.pinned && <Pin size={10} className="text-amber-400" />}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-[var(--color-surface-2)] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
              ))}
            </div>
          )}
          {error && (
            <p className="text-[13px] text-red-400">Failed to load document.</p>
          )}
          {doc && (
            <div className="article-content prose-sm">
              <MarkdownRenderer content={doc.content} />
            </div>
          )}
        </div>

        {/* Footer meta */}
        {doc && (
          <div className="shrink-0 px-5 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
            {doc.project && <span>Project: {doc.project}</span>}
            {doc.file_path && <span className="truncate">{doc.file_path}</span>}
            {doc.updated_at && <span className="ml-auto shrink-0">Updated {new Date(doc.updated_at).toLocaleDateString()}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Simple markdown → HTML renderer ── */

function MarkdownRenderer({ content }: { content: string }) {
  const html = markdownToHtml(content)
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

function markdownToHtml(md: string): string {
  // Strip YAML frontmatter
  let text = md.replace(/^---[\s\S]*?---\n*/, '')

  // Escape HTML
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (``` ... ```)
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-[var(--color-surface-2)] rounded-lg p-3 overflow-x-auto text-[12px] my-3"><code>${code.trim()}</code></pre>`
  )

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded text-[12px]">$1</code>')

  // Headers
  text = text.replace(/^#### (.+)$/gm, '<h4 class="text-[13px] font-semibold mt-4 mb-1.5">$1</h4>')
  text = text.replace(/^### (.+)$/gm, '<h3 class="text-[14px] font-semibold mt-5 mb-2">$1</h3>')
  text = text.replace(/^## (.+)$/gm, '<h2 class="text-[15px] font-semibold mt-6 mb-2">$1</h2>')
  text = text.replace(/^# (.+)$/gm, '<h1 class="text-[17px] font-bold mt-6 mb-3">$1</h1>')

  // Bold and italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Blockquotes
  text = text.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-2 border-[var(--color-accent)] pl-3 text-[var(--color-text-muted)] my-2">$1</blockquote>')

  // Horizontal rules
  text = text.replace(/^---$/gm, '<hr class="border-[var(--color-border)] my-4" />')

  // Unordered lists
  text = text.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-[13px] leading-relaxed">$1</li>')

  // Ordered lists
  text = text.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-[13px] leading-relaxed">$1</li>')

  // Wrap consecutive <li> in <ul>/<ol>
  text = text.replace(/((?:<li class="ml-4 list-disc[^>]*>.*<\/li>\n?)+)/g, '<ul class="my-2">$1</ul>')
  text = text.replace(/((?:<li class="ml-4 list-decimal[^>]*>.*<\/li>\n?)+)/g, '<ol class="my-2">$1</ol>')

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[var(--color-accent-hover)] hover:underline" target="_blank" rel="noopener">$1</a>')

  // Simple table support (pipe tables)
  text = text.replace(
    /(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)+)/g,
    (table) => {
      const rows = table.trim().split('\n')
      if (rows.length < 2) return table
      const headers = rows[0].split('|').filter(c => c.trim())
      const body = rows.slice(2) // skip header + separator
      let html = '<div class="overflow-x-auto my-3"><table class="w-full text-[12px] border-collapse">'
      html += '<thead><tr>'
      headers.forEach(h => { html += `<th class="text-left px-2 py-1.5 border-b border-[var(--color-border)] font-medium text-[var(--color-text-muted)]">${h.trim()}</th>` })
      html += '</tr></thead><tbody>'
      body.forEach(row => {
        const cells = row.split('|').filter(c => c.trim())
        html += '<tr>'
        cells.forEach(c => { html += `<td class="px-2 py-1.5 border-b border-[var(--color-border)]/50">${c.trim()}</td>` })
        html += '</tr>'
      })
      html += '</tbody></table></div>'
      return html
    }
  )

  // Paragraphs: wrap remaining non-empty non-HTML lines
  text = text.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('<')) return line
    return `<p class="text-[13px] leading-relaxed my-1.5">${line}</p>`
  }).join('\n')

  return text
}

/* ── Doc type badge helper ── */

const DOC_TYPE_COLORS: Record<string, string> = {
  brand: 'bg-purple-400/10 text-purple-400',
  editorial: 'bg-blue-400/10 text-blue-400',
  scope: 'bg-amber-400/10 text-amber-400',
  voice: 'bg-green-400/10 text-green-400',
  beat: 'bg-teal-400/10 text-teal-400',
  reference: 'bg-gray-400/10 text-gray-400',
  template: 'bg-orange-400/10 text-orange-400',
  guideline: 'bg-pink-400/10 text-pink-400',
}

export function DocTypeBadge({ type }: { type: string }) {
  const cls = DOC_TYPE_COLORS[type] ?? 'bg-gray-400/10 text-gray-400'
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${cls}`}>
      {type}
    </span>
  )
}

/* ── Compact doc list item (for project cards, etc.) ── */

export function DocListItem({ doc, onClick }: { doc: Document; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left py-1 px-1 rounded hover:bg-[var(--color-surface-2)]/50 group transition-colors"
    >
      <FileText size={12} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-hover)] shrink-0" />
      <span className="text-[12px] truncate group-hover:text-[var(--color-accent-hover)]">{doc.title}</span>
      {doc.pinned && <Pin size={9} className="text-amber-400 shrink-0" />}
    </button>
  )
}

/* ── Collapsible doc section (for embedding in cards) ── */

export function DocSection({ docs, onSelect }: { docs: Document[]; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  if (docs.length === 0) return null

  const visible = expanded ? docs : docs.slice(0, 2)

  return (
    <div className="mt-2 pt-2 border-t border-[var(--color-border)]/50">
      <div className="flex items-center gap-1.5 mb-1">
        <FileText size={11} className="text-[var(--color-text-muted)]" />
        <span className="text-[11px] text-[var(--color-text-muted)] font-medium">Docs ({docs.length})</span>
      </div>
      <div className="space-y-0.5">
        {visible.map(doc => (
          <DocListItem key={doc.id} doc={doc} onClick={() => onSelect(doc.id)} />
        ))}
      </div>
      {docs.length > 2 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[11px] text-[var(--color-accent-hover)] hover:underline mt-1 flex items-center gap-0.5"
        >
          <ChevronDown size={11} />
          {docs.length - 2} more
        </button>
      )}
    </div>
  )
}

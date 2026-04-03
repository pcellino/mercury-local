import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCompetitors, getCompetitorArticles, getPublications } from '../lib/queries'
import { createCompetitor, updateCompetitor, deleteCompetitor } from '../lib/mutations'
import { formatRelative } from '../lib/utils'
import { Shield, Plus, X, Trash2, ExternalLink, AlertTriangle, CheckCircle, Globe, AlertCircle } from 'lucide-react'

export default function Competitors() {
  const queryClient = useQueryClient()
  const [pubFilter, setPubFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedComp, setSelectedComp] = useState<string | null>(null)
  const [uncoveredOnly, setUncoveredOnly] = useState(true)

  const { data: pubs } = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const { data: competitors, isLoading } = useQuery({
    queryKey: ['competitors', pubFilter],
    queryFn: () => getCompetitors(pubFilter || undefined),
  })

  const { data: articles } = useQuery({
    queryKey: ['competitor-articles', selectedComp, uncoveredOnly],
    queryFn: () => getCompetitorArticles(selectedComp ?? undefined, uncoveredOnly),
    enabled: !!selectedComp,
  })

  const [mutError, setMutError] = useState<string | null>(null)

  const deleteMut = useMutation({
    mutationFn: deleteCompetitor,
    onSuccess: () => {
      setMutError(null)
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      setSelectedComp(null)
    },
    onError: (err: any) => setMutError(err.message ?? 'Failed to delete competitor'),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateCompetitor(id, { is_active: active }),
    onSuccess: () => { setMutError(null); queryClient.invalidateQueries({ queryKey: ['competitors'] }) },
    onError: (err: any) => setMutError(err.message ?? 'Failed to update competitor'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <Shield size={20} className="text-[var(--color-accent)]" />
            Competitive Monitoring
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Track competitor coverage and identify gaps
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)]"
        >
          <Plus size={12} /> Add Competitor
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={pubFilter}
          onChange={e => setPubFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
        >
          <option value="">All Publications</option>
          {pubs?.filter(p => p.domain).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Error banner */}
      {mutError && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-400/10 border border-red-400/20 rounded-lg text-xs text-red-400">
          <AlertCircle size={14} /> {mutError}
          <button onClick={() => setMutError(null)} className="ml-auto hover:text-red-300"><X size={12} /></button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Competitor List */}
        <div className="col-span-4 space-y-2">
          {isLoading ? (
            <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
          ) : !competitors?.length ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <Shield size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No competitors tracked</p>
              <p className="text-xs mt-1">Add competitors to monitor their coverage</p>
            </div>
          ) : (
            competitors.map(comp => (
              <button
                key={comp.id}
                onClick={() => setSelectedComp(comp.id)}
                className={`w-full text-left bg-[var(--color-surface)] border rounded-xl p-4 transition-colors ${
                  selectedComp === comp.id
                    ? 'border-[var(--color-accent)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className={comp.is_active ? 'text-green-400' : 'text-slate-500'} />
                    <span className="text-sm font-medium text-[var(--color-text)]">{comp.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMut.mutate({ id: comp.id, active: !comp.is_active }) }}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        comp.is_active ? 'text-green-400 bg-green-400/10' : 'text-slate-400 bg-slate-400/10'
                      }`}
                    >
                      {comp.is_active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{comp.domain}</p>
                {comp.pub_name && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">vs. {comp.pub_name}</p>}
                {comp.region && <p className="text-[10px] text-[var(--color-text-muted)]">{comp.region}</p>}
              </button>
            ))
          )}
        </div>

        {/* Articles Panel */}
        <div className="col-span-8">
          {selectedComp ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-[var(--color-text)]">
                    Coverage from {competitors?.find(c => c.id === selectedComp)?.name}
                  </h2>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                    <input
                      type="checkbox"
                      checked={uncoveredOnly}
                      onChange={e => setUncoveredOnly(e.target.checked)}
                      className="rounded border-[var(--color-border)]"
                    />
                    Uncovered only
                  </label>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this competitor and all its tracked articles?')) {
                      deleteMut.mutate(selectedComp)
                    }
                  }}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10"
                  title="Delete competitor"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {!articles?.length ? (
                <div className="text-center py-12 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                  <p className="text-sm">No articles tracked yet</p>
                  <p className="text-xs mt-1">Articles will appear here as competitor feeds are monitored</p>
                </div>
              ) : (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 font-medium">Article</th>
                        <th className="text-left px-4 py-3 font-medium">Beat</th>
                        <th className="text-left px-4 py-3 font-medium">Published</th>
                        <th className="text-left px-4 py-3 font-medium">Coverage</th>
                        <th className="px-4 py-3 font-medium w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map(art => (
                        <tr key={art.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)]">
                          <td className="px-4 py-3">
                            <p className="text-[var(--color-text)] truncate max-w-xs">{art.title}</p>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{art.beat_category ?? '—'}</td>
                          <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs">{formatRelative(art.published_at)}</td>
                          <td className="px-4 py-3">
                            {art.has_local_coverage ? (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle size={12} /> Covered
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-400">
                                <AlertTriangle size={12} /> Gap
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={art.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-[var(--color-text-muted)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
              <Shield size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a competitor to view their coverage</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showAdd && (
        <AddCompetitorModal
          publications={pubs ?? []}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            queryClient.invalidateQueries({ queryKey: ['competitors'] })
          }}
        />
      )}
    </div>
  )
}

function AddCompetitorModal({ publications, onClose, onCreated }: {
  publications: { id: string; name: string; slug: string; domain: string | null }[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [pubId, setPubId] = useState('')
  const [region, setRegion] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !domain || !pubId) return
    setSaving(true)
    setError(null)
    try {
      await createCompetitor({
        publication_id: pubId,
        name,
        domain,
        feed_url: feedUrl || undefined,
        region: region || undefined,
        notes: notes || undefined,
      })
      onCreated()
    } catch (err: any) {
      setError(err.message ?? 'Failed to add competitor')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Add Competitor</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Name</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="e.g. Charlotte Observer"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Domain</label>
              <input
                type="text" value={domain} onChange={e => setDomain(e.target.value)} required
                placeholder="e.g. charlotteobserver.com"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Competes With</label>
              <select
                value={pubId} onChange={e => setPubId(e.target.value)} required
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
              >
                <option value="">Select publication...</option>
                {publications.filter(p => p.domain).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Region</label>
              <input
                type="text" value={region} onChange={e => setRegion(e.target.value)}
                placeholder="e.g. Charlotte metro"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">RSS Feed URL (optional)</label>
            <input
              type="text" value={feedUrl} onChange={e => setFeedUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Notes</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-400/10 border border-red-400/20 rounded-lg text-xs text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Cancel</button>
            <button
              type="submit" disabled={saving || !name || !domain || !pubId}
              className="px-4 py-2 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Competitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

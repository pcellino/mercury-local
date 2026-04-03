import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getPublications } from '../lib/queries'
import { Plus, Pencil, Trash2, X, Search, ExternalLink } from 'lucide-react'
import { PUB_COLORS, PUB_SHORT, PUB_DOMAINS } from '../lib/utils'

interface TagRow {
  id: string
  name: string
  slug: string
  description: string | null
  publication_id: string | null
  pub_name: string | null
  pub_slug: string | null
  post_count: number
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function Tags() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [pubFilter, setPubFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formSlugManual, setFormSlugManual] = useState(false)
  const [formDesc, setFormDesc] = useState('')
  const [formPubId, setFormPubId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: publications } = useQuery({ queryKey: ['publications'], queryFn: getPublications })

  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags-full'],
    queryFn: async (): Promise<TagRow[]> => {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, slug, description, publication_id, publications(name, slug)')
        .order('name')
      if (error) throw error

      // Get post counts per tag
      const { data: counts } = await supabase
        .from('post_tags')
        .select('tag_id')
      const countMap = new Map<string, number>()
      for (const row of counts ?? []) {
        countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1)
      }

      return (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        publication_id: t.publication_id,
        pub_name: t.publications?.name ?? null,
        pub_slug: t.publications?.slug ?? null,
        post_count: countMap.get(t.id) ?? 0,
      }))
    },
  })

  const filtered = (tags ?? []).filter((t) => {
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase())
    const matchesPub = !pubFilter || t.publication_id === pubFilter
    return matchesSearch && matchesPub
  })

  function startCreate() {
    setCreating(true)
    setEditingId(null)
    setFormName('')
    setFormSlug('')
    setFormSlugManual(false)
    setFormDesc('')
    setFormPubId('')
    setError(null)
  }

  function startEdit(tag: TagRow) {
    setEditingId(tag.id)
    setCreating(false)
    setFormName(tag.name)
    setFormSlug(tag.slug)
    setFormSlugManual(true)
    setFormDesc(tag.description ?? '')
    setFormPubId(tag.publication_id ?? '')
    setError(null)
  }

  function cancelForm() {
    setCreating(false)
    setEditingId(null)
    setError(null)
  }

  async function handleSave() {
    if (!formName.trim()) return
    setSaving(true)
    setError(null)

    try {
      const slug = formSlug || toSlug(formName)
      const payload = {
        name: formName.trim(),
        slug,
        description: formDesc || null,
        publication_id: formPubId || null,
      }

      if (editingId) {
        const { error: err } = await supabase.from('tags').update(payload).eq('id', editingId)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('tags').insert(payload)
        if (err) throw err
      }

      queryClient.invalidateQueries({ queryKey: ['tags-full'] })
      queryClient.invalidateQueries({ queryKey: ['all-tags'] })
      cancelForm()
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tagId: string, tagName: string) {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all posts.`)) return
    try {
      await supabase.from('post_tags').delete().eq('tag_id', tagId)
      await supabase.from('tags').delete().eq('id', tagId)
      queryClient.invalidateQueries({ queryKey: ['tags-full'] })
      queryClient.invalidateQueries({ queryKey: ['all-tags'] })
    } catch (err) {
      console.error('Failed to delete tag:', err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-[var(--color-text-muted)]">{tags?.length ?? 0} tags across all publications</p>
        <button
          onClick={startCreate}
          className="flex items-center gap-1.5 bg-[var(--color-accent)] text-white px-3 py-1.5 rounded-lg text-[13px] font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <Plus size={14} /> New Tag
        </button>
      </div>

      {/* Create/Edit form */}
      {(creating || editingId) && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-accent)]/30 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{editingId ? 'Edit Tag' : 'Create Tag'}</h2>
            <button onClick={cancelForm} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={16} /></button>
          </div>
          {error && <div className="text-xs text-red-400 mb-3">{error}</div>}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Name *</label>
              <input
                value={formName}
                onChange={(e) => { setFormName(e.target.value); if (!formSlugManual) setFormSlug(toSlug(e.target.value)) }}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="Tag name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Slug</label>
              <input
                value={formSlug}
                onChange={(e) => { setFormSlug(e.target.value); setFormSlugManual(true) }}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="auto-generated"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Publication</label>
              <select
                value={formPubId}
                onChange={(e) => setFormPubId(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="">All publications</option>
                {publications?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1">Description</label>
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
                placeholder="Optional description for tag page"
              />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !formName.trim()}
            className="flex items-center gap-1.5 bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : editingId ? 'Update Tag' : 'Create Tag'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <select
          value={pubFilter}
          onChange={(e) => setPubFilter(e.target.value)}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        >
          <option value="">All Publications</option>
          {publications?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading tags...</p>}

      {/* Tag table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-surface-2)]">
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Tag</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-20">Pub</th>
              <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-48">Description</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-16">Posts</th>
              <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tag) => (
              <tr key={tag.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] ml-2 font-mono">/{tag.slug}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {tag.pub_slug ? (
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: PUB_COLORS[tag.pub_slug] ?? '#6366f1' }}
                    >
                      {PUB_SHORT[tag.pub_slug] ?? tag.pub_slug}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--color-text-muted)] text-xs truncate max-w-[200px]">{tag.description ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className={tag.post_count > 0 ? 'text-[var(--color-accent-hover)] font-semibold' : 'text-[var(--color-text-muted)]'}>
                    {tag.post_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {tag.pub_slug && (
                      <a
                        href={`https://${PUB_DOMAINS[tag.pub_slug] ?? 'cltmercury.com'}/tag/${tag.slug}`}
                        target="_blank"
                        rel="noopener"
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors"
                        title="View tag page"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => startEdit(tag)}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors"
                      title="Edit tag"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                      title="Delete tag"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                {search ? 'No tags match your search' : 'No tags found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mt-4">Showing {filtered.length} of {tags?.length ?? 0} tags</p>
    </div>
  )
}

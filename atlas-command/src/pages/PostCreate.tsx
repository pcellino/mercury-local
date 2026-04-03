import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublications, getAuthors } from '../lib/queries'
import { createPost, type CreatePostPayload } from '../lib/mutations'
import { useAuth } from '../lib/auth'
import { ArrowLeft, Plus, Rocket } from 'lucide-react'

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function PostCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [publicationId, setPublicationId] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [beat, setBeat] = useState('')
  const [status, setStatus] = useState('draft')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: publications } = useQuery({ queryKey: ['publications'], queryFn: getPublications })
  const { data: authors } = useQuery({ queryKey: ['authors'], queryFn: getAuthors })

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  async function handleCreate() {
    if (!title.trim() || !publicationId) return
    setSaving(true)
    setError(null)

    try {
      const payload: CreatePostPayload = {
        title: title.trim(),
        slug: slug || toSlug(title),
        publication_id: publicationId,
        author_id: authorId || null,
        beat: beat || null,
        status,
        excerpt: excerpt || null,
        content: content || null,
      }
      const newId = await createPost(payload)
      navigate(`/posts/${newId}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Create New Post</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Fill in the essentials, then fine-tune in the full editor</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter headline..."
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
            placeholder="auto-generated-from-title"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>

        {/* Publication + Author row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Publication <span className="text-red-400">*</span>
            </label>
            <select
              value={publicationId}
              onChange={(e) => setPublicationId(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="">Select publication...</option>
              {publications?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Author
            </label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="">Select author...</option>
              {authors?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Beat + Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Beat
            </label>
            <input
              type="text"
              value={beat}
              onChange={(e) => setBeat(e.target.value)}
              placeholder="e.g. hornets, city-council"
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief summary for cards and social sharing..."
            rows={2}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-y"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5">
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Article body in markdown..."
            rows={12}
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleCreate}
            disabled={saving || !title.trim() || !publicationId}
            className="flex items-center gap-2 bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>Creating...</>
            ) : (
              <><Plus size={16} /> Create Post</>
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

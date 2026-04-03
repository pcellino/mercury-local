import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPageById, getPublications } from '../lib/queries'
import { updatePage, type UpdatePagePayload } from '../lib/mutations'
import { useAuth } from '../lib/auth'
import { PUB_COLORS, PUB_SHORT, PUB_DOMAINS } from '../lib/utils'
import { ArrowLeft, Save, ExternalLink, FileText, Settings, AlertCircle, Check } from 'lucide-react'

type TabId = 'content' | 'hub' | 'seo'

export default function PageEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabId>('content')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('')
  const [publicationId, setPublicationId] = useState('')
  const [hubBeat, setHubBeat] = useState('')
  const [hubTag, setHubTag] = useState('')
  const [hubLimit, setHubLimit] = useState('')
  const [hubHeading, setHubHeading] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: () => getPageById(id!),
    enabled: !!id,
  })

  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

  useEffect(() => {
    if (!page) return
    setTitle(page.title ?? '')
    setSlug(page.slug ?? '')
    setContent(page.content ?? '')
    setStatus(page.status ?? 'published')
    setPublicationId(page.publication_id ?? '')
    setHubBeat(page.hub_beat ?? '')
    setHubTag(page.hub_tag ?? '')
    setHubLimit(page.hub_limit?.toString() ?? '')
    setHubHeading(page.hub_heading ?? '')
    setSeoTitle(page.seo_title ?? '')
    setMetaDescription(page.meta_description ?? '')
    setDirty(false)
  }, [page])

  const markDirty = () => { if (!dirty) setDirty(true) }

  const liveUrl = useMemo(() => {
    if (!page) return null
    const domain = PUB_DOMAINS[page.pub_slug ?? ''] ?? 'cltmercury.com'
    return `https://${domain}/${page.slug}`
  }, [page])

  async function handleSave() {
    if (!id || !user) return
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const payload: UpdatePagePayload = {
        title,
        slug,
        content: content || null,
        status: status || 'published',
        publication_id: publicationId || null,
        hub_beat: hubBeat || null,
        hub_tag: hubTag || null,
        hub_limit: hubLimit ? parseInt(hubLimit) : null,
        hub_heading: hubHeading || null,
        seo_title: seoTitle || null,
        meta_description: metaDescription || null,
      }
      await updatePage(id, payload)
      queryClient.invalidateQueries({ queryKey: ['page', id] })
      queryClient.invalidateQueries({ queryKey: ['stale-hubs'] })
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--color-text-muted)]">Loading page...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">Page not found</p>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'hub', label: 'Hub Settings', icon: Settings },
    { id: 'seo', label: 'SEO', icon: Settings },
  ]

  const inputClass = "w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
  const labelClass = "block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5"
  const selectClass = "bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text-muted)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{page.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              {page.hub_beat && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-400/10 text-purple-400">
                  Hub: {page.hub_beat}
                </span>
              )}
              {page.pub_slug && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                  style={{ backgroundColor: PUB_COLORS[page.pub_slug] ?? '#6366f1' }}
                >
                  {PUB_SHORT[page.pub_slug] ?? page.pub_slug}
                </span>
              )}
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors">
                  <ExternalLink size={14} />
                </a>
              )}
              {page.updated_at && (
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  Updated {new Date(page.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </span>
          )}
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check size={14} /> Saved
            </span>
          )}
          {dirty && !saved && (
            <span className="text-xs text-yellow-400">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !user}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty() }}
              className={inputClass}
              placeholder="Page title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="url-slug"
              />
            </div>
            <div>
              <label className={labelClass}>Publication</label>
              <select
                value={publicationId}
                onChange={(e) => { setPublicationId(e.target.value); markDirty() }}
                className={`${selectClass} w-full`}
              >
                <option value="">— Select —</option>
                {publications?.map((pub) => (
                  <option key={pub.id} value={pub.id}>{pub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); markDirty() }}
              className={`${selectClass} w-full`}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Body (HTML/Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markDirty() }}
              rows={24}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
              placeholder="Page content..."
            />
            {content && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {content.length.toLocaleString()} characters
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hub Settings Tab */}
      {activeTab === 'hub' && (
        <div className="space-y-5">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 mb-2">
            <p className="text-xs text-[var(--color-text-muted)]">
              Hub settings control the dynamic article feed on this page. Set <strong>hub_beat</strong> or <strong>hub_tag</strong> to pull matching articles, and <strong>hub_limit</strong> to control how many appear.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hub Beat</label>
              <input
                type="text"
                value={hubBeat}
                onChange={(e) => { setHubBeat(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="e.g. government, sports, business"
              />
            </div>
            <div>
              <label className={labelClass}>Hub Tag</label>
              <input
                type="text"
                value={hubTag}
                onChange={(e) => { setHubTag(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="e.g. hornets, charlotte-fc"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Hub Limit</label>
              <input
                type="number"
                value={hubLimit}
                onChange={(e) => { setHubLimit(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="Number of articles to show (e.g. 10)"
              />
            </div>
            <div>
              <label className={labelClass}>Hub Heading</label>
              <input
                type="text"
                value={hubHeading}
                onChange={(e) => { setHubHeading(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="Custom heading for article feed section"
              />
            </div>
          </div>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>SEO Title</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => { setSeoTitle(e.target.value); markDirty() }}
              className={inputClass}
              placeholder="Custom title for search engines"
            />
            {seoTitle && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {seoTitle.length}/60 characters
                {seoTitle.length > 60 && <span className="text-yellow-400 ml-1">(over recommended length)</span>}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => { setMetaDescription(e.target.value); markDirty() }}
              rows={3}
              className={inputClass}
              placeholder="Description for search engine results (150-160 chars ideal)"
            />
            {metaDescription && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {metaDescription.length}/160 characters
                {metaDescription.length > 160 && <span className="text-yellow-400 ml-1">(over recommended length)</span>}
              </p>
            )}
          </div>

          {/* Search Preview */}
          <div>
            <label className={labelClass}>Search Preview</label>
            <div className="bg-white rounded-lg p-4 border border-[var(--color-border)]">
              <p className="text-[#1a0dab] text-base font-normal leading-tight truncate">
                {seoTitle || title || 'Page Title'}
              </p>
              <p className="text-[#006621] text-xs mt-1 truncate">
                {liveUrl ?? 'https://example.com/page-slug'}
              </p>
              <p className="text-[#545454] text-xs mt-1 line-clamp-2">
                {metaDescription || 'No description set.'}
              </p>
            </div>
          </div>

          {/* Read-only metadata */}
          <div className="border-t border-[var(--color-border)] pt-5 mt-5">
            <label className={labelClass}>Page Metadata (read-only)</label>
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)]">
              <div>
                <span className="font-semibold">ID:</span>{' '}
                <span className="font-mono">{page.id}</span>
              </div>
              <div>
                <span className="font-semibold">Source:</span> {page.source ?? '—'}
              </div>
              <div>
                <span className="font-semibold">Updated:</span>{' '}
                {page.updated_at ? new Date(page.updated_at).toLocaleString() : '—'}
              </div>
              {page.original_url && (
                <div className="col-span-2">
                  <span className="font-semibold">Original URL:</span>{' '}
                  <a href={page.original_url} target="_blank" rel="noopener" className="text-[var(--color-accent)]">{page.original_url}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

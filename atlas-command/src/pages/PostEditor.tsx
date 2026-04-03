import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPostById, getPublications, getAuthors, getAllTags } from '../lib/queries'
import { updatePost, addTagToPost, removeTagFromPost, type UpdatePostPayload } from '../lib/mutations'
import { getPathStats, siteIdForPub, postPathname } from '../lib/fathom'
import { useAuth } from '../lib/auth'
import { statusColor, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { ArrowLeft, Save, ExternalLink, X, Plus, Image, FileText, Settings, Tag, AlertCircle, Check, Eye, Users, Clock } from 'lucide-react'

type TabId = 'content' | 'meta' | 'seo' | 'tags' | 'settings'

export default function PostEditor() {
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
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [beat, setBeat] = useState('')
  const [authorId, setAuthorId] = useState('')
  const [publicationId, setPublicationId] = useState('')
  const [pubDate, setPubDate] = useState('')
  const [featured, setFeatured] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [heroImageAlt, setHeroImageAlt] = useState('')
  const [heroImageWidth, setHeroImageWidth] = useState('')
  const [heroImageHeight, setHeroImageHeight] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [summary, setSummary] = useState('')
  const [followUpBy, setFollowUpBy] = useState('')
  const [followUpNote, setFollowUpNote] = useState('')

  // Tag state
  const [postTagIds, setPostTagIds] = useState<Set<string>>(new Set())
  const [tagSearch, setTagSearch] = useState('')

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => getPostById(id!),
    enabled: !!id,
  })

  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

  const { data: authors } = useQuery({
    queryKey: ['authors'],
    queryFn: getAuthors,
  })

  const { data: allTags } = useQuery({
    queryKey: ['all-tags'],
    queryFn: getAllTags,
  })

  // Fathom article stats (30-day)
  const fathomSiteId = post?.pub_slug ? siteIdForPub(post.pub_slug) : null
  const fathomPath = post ? postPathname(post.beat, post.slug) : null
  const articleStats = useQuery({
    queryKey: ['article-stats', fathomSiteId, fathomPath],
    queryFn: () => {
      const to = new Date().toISOString().split('T')[0]
      const d = new Date(); d.setDate(d.getDate() - 30)
      const from = d.toISOString().split('T')[0]
      return getPathStats(fathomSiteId!, fathomPath!, from, to)
    },
    enabled: !!fathomSiteId && !!fathomPath && post?.status === 'published',
    staleTime: 300_000,
  })

  // Populate form when post loads
  useEffect(() => {
    if (!post) return
    setTitle(post.title ?? '')
    setSlug(post.slug ?? '')
    setExcerpt(post.excerpt ?? '')
    setContent(post.content ?? '')
    setStatus(post.status ?? 'draft')
    setBeat(post.beat ?? '')
    setAuthorId(post.author_id ?? '')
    setPublicationId(post.publication_id ?? '')
    setPubDate(post.pub_date ? post.pub_date.slice(0, 16) : '')
    setFeatured(post.featured ?? false)
    setHeroImageUrl(post.hero_image_url ?? '')
    setHeroImageAlt(post.hero_image_alt ?? '')
    setHeroImageWidth(post.hero_image_width?.toString() ?? '')
    setHeroImageHeight(post.hero_image_height?.toString() ?? '')
    setSeoTitle(post.seo_title ?? '')
    setMetaDescription(post.meta_description ?? '')
    setSummary(post.summary ?? '')
    setFollowUpBy(post.follow_up_by ?? '')
    setFollowUpNote(post.follow_up_note ?? '')
    setPostTagIds(new Set(post.tags.map(t => t.id)))
    setDirty(false)
  }, [post])

  // Mark dirty on any field change
  const markDirty = () => { if (!dirty) setDirty(true) }

  // Build the live URL for this post
  const liveUrl = useMemo(() => {
    if (!post) return null
    const domainMap: Record<string, string> = {
      'charlotte-mercury': 'cltmercury.com',
      'farmington-mercury': 'farmingtonmercury.com',
      'strolling-ballantyne': 'strollingballantyne.com',
      'strolling-firethorne': 'strollingfirethorne.com',
      'grand-national-today': 'grandnationaltoday.com',
      'mercury-local': 'mercurylocal.com',
      'peter-cellino': 'petercellino.com',
    }
    const domain = domainMap[post.pub_slug ?? ''] ?? 'cltmercury.com'
    const beatPath = post.beat ? `${post.beat}/` : ''
    return `https://${domain}/${beatPath}${post.slug}`
  }, [post])

  // Filtered tags for search
  const filteredTags = useMemo(() => {
    if (!allTags) return []
    const search = tagSearch.toLowerCase()
    return allTags
      .filter(t => !postTagIds.has(t.id))
      .filter(t => !search || t.name.toLowerCase().includes(search))
      .slice(0, 20)
  }, [allTags, postTagIds, tagSearch])

  const currentTags = useMemo(() => {
    if (!allTags) return []
    return allTags.filter(t => postTagIds.has(t.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [allTags, postTagIds])

  // Save handler
  async function handleSave() {
    if (!id || !user) return
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const payload: UpdatePostPayload = {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || null,
        status,
        beat: beat || null,
        author_id: authorId || null,
        publication_id: publicationId || null,
        pub_date: pubDate ? new Date(pubDate).toISOString() : null,
        featured,
        hero_image_url: heroImageUrl || null,
        hero_image_alt: heroImageAlt || null,
        hero_image_width: heroImageWidth ? parseInt(heroImageWidth) : null,
        hero_image_height: heroImageHeight ? parseInt(heroImageHeight) : null,
        seo_title: seoTitle || null,
        meta_description: metaDescription || null,
        summary: summary || null,
        follow_up_by: followUpBy || null,
        follow_up_note: followUpNote || null,
      }
      await updatePost(id, payload)

      // Sync tags
      const currentIds = new Set(post?.tags.map(t => t.id) ?? [])
      const toAdd = [...postTagIds].filter(tid => !currentIds.has(tid))
      const toRemove = [...currentIds].filter(tid => !postTagIds.has(tid))
      await Promise.all([
        ...toAdd.map(tid => addTagToPost(id, tid)),
        ...toRemove.map(tid => removeTagFromPost(id, tid)),
      ])

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['post', id] })
      queryClient.invalidateQueries({ queryKey: ['recent-posts-full'] })

      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleTagAdd(tagId: string) {
    setPostTagIds(prev => new Set([...prev, tagId]))
    setTagSearch('')
    markDirty()
  }

  function handleTagRemove(tagId: string) {
    setPostTagIds(prev => {
      const next = new Set(prev)
      next.delete(tagId)
      return next
    })
    markDirty()
  }

  if (postLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[var(--color-text-muted)]">Loading post...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-400">Post not found</p>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'meta', label: 'Image & Media', icon: Image },
    { id: 'seo', label: 'SEO', icon: Settings },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
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
            <h1 className="text-xl font-bold tracking-tight">{post.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor(post.status)}`}>
                {post.status}
              </span>
              {post.pub_slug && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                  style={{ backgroundColor: PUB_COLORS[post.pub_slug] ?? '#6366f1' }}
                >
                  {PUB_SHORT[post.pub_slug] ?? post.pub_slug}
                </span>
              )}
              {liveUrl && post.status === 'published' && (
                <a href={liveUrl} target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors">
                  <ExternalLink size={14} />
                </a>
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

      {/* Fathom Article Stats */}
      {articleStats.data && (articleStats.data.pageviews > 0 || articleStats.data.visits > 0) && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 flex items-center gap-3">
            <Eye size={16} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold">{articleStats.data.pageviews.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Pageviews (30d)</p>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 flex items-center gap-3">
            <Users size={16} className="text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold">{articleStats.data.visits.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Visits (30d)</p>
            </div>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 flex items-center gap-3">
            <Clock size={16} className="text-purple-400 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold">
                {articleStats.data.avgDuration < 60
                  ? `${Math.round(articleStats.data.avgDuration)}s`
                  : `${Math.floor(articleStats.data.avgDuration / 60)}m ${Math.round(articleStats.data.avgDuration % 60)}s`}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Avg Duration</p>
            </div>
          </div>
        </div>
      )}

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
              placeholder="Article title"
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
                placeholder="url-friendly-slug"
              />
            </div>
            <div>
              <label className={labelClass}>Beat</label>
              <input
                type="text"
                value={beat}
                onChange={(e) => { setBeat(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="e.g. government, sports, business"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className={labelClass}>Author</label>
              <select
                value={authorId}
                onChange={(e) => { setAuthorId(e.target.value); markDirty() }}
                className={`${selectClass} w-full`}
              >
                <option value="">— Select —</option>
                {authors?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => { setExcerpt(e.target.value); markDirty() }}
              rows={3}
              className={inputClass}
              placeholder="Short excerpt for article cards and social sharing"
            />
          </div>

          <div>
            <label className={labelClass}>Summary</label>
            <textarea
              value={summary}
              onChange={(e) => { setSummary(e.target.value); markDirty() }}
              rows={2}
              className={inputClass}
              placeholder="Internal summary"
            />
          </div>

          <div>
            <label className={labelClass}>Body (Markdown)</label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); markDirty() }}
              rows={20}
              className={`${inputClass} font-mono text-xs leading-relaxed`}
              placeholder="Article content in markdown..."
            />
            {content && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {content.length.toLocaleString()} characters · ~{Math.ceil(content.split(/\s+/).length / 250)} min read
              </p>
            )}
          </div>
        </div>
      )}

      {/* Image & Media Tab */}
      {activeTab === 'meta' && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Hero Image URL</label>
            <input
              type="text"
              value={heroImageUrl}
              onChange={(e) => { setHeroImageUrl(e.target.value); markDirty() }}
              className={inputClass}
              placeholder="https://... image URL"
            />
            {heroImageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]">
                <img
                  src={heroImageUrl}
                  alt={heroImageAlt || 'Hero preview'}
                  className="max-h-64 w-auto object-contain mx-auto"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Image Alt Text</label>
            <input
              type="text"
              value={heroImageAlt}
              onChange={(e) => { setHeroImageAlt(e.target.value); markDirty() }}
              className={inputClass}
              placeholder="Descriptive alt text for the hero image"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Image Width (px)</label>
              <input
                type="number"
                value={heroImageWidth}
                onChange={(e) => { setHeroImageWidth(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="1200"
              />
            </div>
            <div>
              <label className={labelClass}>Image Height (px)</label>
              <input
                type="number"
                value={heroImageHeight}
                onChange={(e) => { setHeroImageHeight(e.target.value); markDirty() }}
                className={inputClass}
                placeholder="630"
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
              placeholder="Custom title for search engines (defaults to article title)"
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

          {/* SEO Preview */}
          <div>
            <label className={labelClass}>Search Preview</label>
            <div className="bg-white rounded-lg p-4 border border-[var(--color-border)]">
              <p className="text-[#1a0dab] text-base font-normal leading-tight truncate">
                {seoTitle || title || 'Page Title'}
              </p>
              <p className="text-[#006621] text-xs mt-1 truncate">
                {liveUrl ?? 'https://example.com/article-slug'}
              </p>
              <p className="text-[#545454] text-xs mt-1 line-clamp-2">
                {metaDescription || excerpt || 'No description set.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === 'tags' && (
        <div className="space-y-5">
          <div>
            <label className={labelClass}>Current Tags ({currentTags.length})</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-3">
              {currentTags.length === 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">No tags assigned</span>
              )}
              {currentTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                >
                  {tag.name}
                  <button
                    onClick={() => handleTagRemove(tag.id)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Add Tags</label>
            <div className="relative">
              <Plus size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Search tags to add..."
              />
            </div>
            {tagSearch && filteredTags.length > 0 && (
              <div className="mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg max-h-48 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagAdd(tag.id)}
                    className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] transition-colors border-b border-[var(--color-border)] last:border-0"
                  >
                    <span className="font-medium">{tag.name}</span>
                    <span className="text-[var(--color-text-muted)] ml-2 text-xs">/{tag.slug}</span>
                  </button>
                ))}
              </div>
            )}
            {tagSearch && filteredTags.length === 0 && (
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">No matching tags found</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); markDirty() }}
                className={`${selectClass} w-full`}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Publish Date</label>
              <input
                type="datetime-local"
                value={pubDate}
                onChange={(e) => { setPubDate(e.target.value); markDirty() }}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => { setFeatured(e.target.checked); markDirty() }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[var(--color-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
            </label>
            <span className="text-sm text-[var(--color-text)]">Featured article</span>
          </div>

          <div>
            <label className={labelClass}>Follow-up Date</label>
            <input
              type="date"
              value={followUpBy}
              onChange={(e) => { setFollowUpBy(e.target.value); markDirty() }}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Follow-up Note</label>
            <textarea
              value={followUpNote}
              onChange={(e) => { setFollowUpNote(e.target.value); markDirty() }}
              rows={2}
              className={inputClass}
              placeholder="Internal note about what to follow up on"
            />
          </div>

          {/* Read-only metadata */}
          <div className="border-t border-[var(--color-border)] pt-5 mt-5">
            <label className={labelClass}>Post Metadata (read-only)</label>
            <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)]">
              <div>
                <span className="font-semibold">ID:</span>{' '}
                <span className="font-mono">{post.id}</span>
              </div>
              <div>
                <span className="font-semibold">Source:</span> {post.source ?? '—'}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{' '}
                {post.created_at ? new Date(post.created_at).toLocaleString() : '—'}
              </div>
              <div>
                <span className="font-semibold">Updated:</span>{' '}
                {post.updated_at ? new Date(post.updated_at).toLocaleString() : '—'}
              </div>
              {post.original_url && (
                <div className="col-span-2">
                  <span className="font-semibold">Original URL:</span>{' '}
                  <a href={post.original_url} target="_blank" rel="noopener" className="text-[var(--color-accent)]">{post.original_url}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

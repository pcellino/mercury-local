import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getPublicationBySlug, getPublicationStats, getPublicationAuthors,
  getPublicationPages, getPublicationEditorial, getRecentPosts,
  getPublicationBeats, getPublicationVoiceProfiles, getPublicationFeeds,
  getPublicationLog,
  type PubAuthor, type PubPage, type BeatResearch, type VoiceProfile, type FeedSource,
} from '../lib/queries'
import {
  updatePublication, updateAuthor, updateBeatResearch, updateVoiceProfile,
  updatePublicationLog,
  createFeedSource, updateFeedSource, deleteFeedSource,
  type UpdatePublicationPayload, type UpdateAuthorPayload,
} from '../lib/mutations'
import { getSiteAggregates, getTopPages, getAllCurrentVisitors } from '../lib/fathom'
import { useAuth } from '../lib/auth'
import { formatRelative, statusColor, PUB_COLORS, PUB_SHORT } from '../lib/utils'
import { HealthScoreCompact } from '../components/HealthScores'
import {
  ArrowLeft, ExternalLink, Pencil, Globe, FileText, Clock, Inbox, Eye,
  Users, BarChart3, Calendar, Settings, Save, Check, AlertCircle, ChevronRight, BookOpen,
  Rss, Plus, Trash2, X, List, Search,
} from 'lucide-react'

type TabId = 'overview' | 'posts' | 'pages' | 'editorial' | 'beats' | 'feeds' | 'log' | 'authors' | 'settings'

export default function Publication() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  // Settings form state
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formTagline, setFormTagline] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [formDomain, setFormDomain] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLogoUrl, setFormLogoUrl] = useState('')

  // Author edit state
  const [editingAuthor, setEditingAuthor] = useState<string | null>(null)
  const [authorBio, setAuthorBio] = useState('')
  const [authorBeatDesc, setAuthorBeatDesc] = useState('')
  const [authorCredentials, setAuthorCredentials] = useState('')

  // Beat research state
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null)
  const [beatContent, setBeatContent] = useState('')
  const [beatEditing, setBeatEditing] = useState(false)
  const [beatSaving, setBeatSaving] = useState(false)

  // Voice profile state
  const [voiceAuthorId, setVoiceAuthorId] = useState<string | null>(null)
  const [voiceContent, setVoiceContent] = useState('')
  const [voiceEditing, setVoiceEditing] = useState(false)
  const [voiceSaving, setVoiceSaving] = useState(false)

  // Publication log state
  const [logEditing, setLogEditing] = useState(false)
  const [logContent, setLogContent] = useState('')
  const [logSaving, setLogSaving] = useState(false)
  const [logSearch, setLogSearch] = useState('')

  // Feed source state
  const [addingFeed, setAddingFeed] = useState(false)
  const [feedName, setFeedName] = useState('')
  const [feedUrl, setFeedUrl] = useState('')
  const [feedType, setFeedType] = useState('rss')
  const [feedBeat, setFeedBeat] = useState('')
  const [feedNotes, setFeedNotes] = useState('')

  const { data: pub, isLoading: pubLoading } = useQuery({
    queryKey: ['publication', slug],
    queryFn: () => getPublicationBySlug(slug!),
    enabled: !!slug,
  })

  const pubStats = useQuery({
    queryKey: ['pub-stats'],
    queryFn: getPublicationStats,
  })

  const myStats = pubStats.data?.find(s => s.pub_slug === slug)

  // Fathom traffic
  const fathomRange = useMemo(() => {
    const to = new Date().toISOString().split('T')[0]
    const d = new Date(); d.setDate(d.getDate() - 30)
    return { from: d.toISOString().split('T')[0], to }
  }, [])

  const fathomStats = useQuery({
    queryKey: ['fathom-pub', pub?.fathom_site_id, fathomRange.from, fathomRange.to],
    queryFn: () => getSiteAggregates(pub!.fathom_site_id!, fathomRange.from, fathomRange.to),
    enabled: !!pub?.fathom_site_id,
    staleTime: 300_000,
  })

  const currentVisitors = useQuery({
    queryKey: ['fathom-visitors-pub', pub?.fathom_site_id],
    queryFn: () => getAllCurrentVisitors(),
    enabled: !!pub?.fathom_site_id,
    staleTime: 30_000,
  })

  const visitorCount = slug
    ? currentVisitors.data?.find(v => v.pubSlug === slug)?.visitors ?? 0
    : 0

  const topPagesData = useQuery({
    queryKey: ['fathom-top-pages-pub', pub?.fathom_site_id, fathomRange.from, fathomRange.to],
    queryFn: () => getTopPages(pub!.fathom_site_id!, fathomRange.from, fathomRange.to, 10),
    enabled: !!pub?.fathom_site_id && activeTab === 'overview',
    staleTime: 300_000,
  })

  // Posts for this pub
  const allPosts = useQuery({
    queryKey: ['recent-posts-full', ''],
    queryFn: () => getRecentPosts(200),
  })
  const pubPosts = useMemo(
    () => (allPosts.data ?? []).filter(p => p.pub_slug === slug),
    [allPosts.data, slug]
  )

  // Pages
  const pages = useQuery({
    queryKey: ['pub-pages', pub?.id],
    queryFn: () => getPublicationPages(pub!.id),
    enabled: !!pub?.id,
  })

  // Editorial
  const editorial = useQuery({
    queryKey: ['pub-editorial', pub?.id],
    queryFn: () => getPublicationEditorial(pub!.id),
    enabled: !!pub?.id,
  })

  // Authors
  const authors = useQuery({
    queryKey: ['pub-authors', pub?.id],
    queryFn: () => getPublicationAuthors(pub!.id),
    enabled: !!pub?.id,
  })

  // Beats
  const beats = useQuery({
    queryKey: ['pub-beats', pub?.id],
    queryFn: () => getPublicationBeats(pub!.id),
    enabled: !!pub?.id,
  })

  // Voice profiles
  const voiceProfiles = useQuery({
    queryKey: ['pub-voices', pub?.id],
    queryFn: () => getPublicationVoiceProfiles(pub!.id),
    enabled: !!pub?.id && activeTab === 'authors',
  })

  // Feed sources
  const feeds = useQuery({
    queryKey: ['pub-feeds', pub?.id],
    queryFn: () => getPublicationFeeds(pub!.id),
    enabled: !!pub?.id,
  })

  // Publication log
  const pubLog = useQuery({
    queryKey: ['pub-log', pub?.id],
    queryFn: () => getPublicationLog(pub!.id),
    enabled: !!pub?.id && activeTab === 'log',
  })

  const color = PUB_COLORS[slug ?? ''] ?? '#6366f1'
  const short = PUB_SHORT[slug ?? ''] ?? slug?.slice(0, 3).toUpperCase()

  // Settings handlers
  function initSettingsForm() {
    if (!pub) return
    setFormName(pub.name)
    setFormTagline(pub.tagline ?? '')
    setFormRegion(pub.region ?? '')
    setFormDomain(pub.domain ?? '')
    setFormDescription(pub.description ?? '')
    setFormLogoUrl(pub.logo_url ?? '')
    setEditing(true)
  }

  async function handleSaveSettings() {
    if (!pub || !user) return
    setSaving(true); setError(null); setSaved(false)
    try {
      const updates: UpdatePublicationPayload = {
        name: formName,
        tagline: formTagline || null,
        region: formRegion || null,
        domain: formDomain || null,
        description: formDescription || null,
        logo_url: formLogoUrl || null,
      }
      await updatePublication(pub.id, updates)
      queryClient.invalidateQueries({ queryKey: ['publication', slug] })
      queryClient.invalidateQueries({ queryKey: ['pub-stats'] })
      setSaved(true); setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally { setSaving(false) }
  }

  function startEditAuthor(a: PubAuthor) {
    setEditingAuthor(a.id)
    setAuthorBio(a.bio ?? '')
    setAuthorBeatDesc(a.beat_description ?? '')
    setAuthorCredentials(a.credentials ?? '')
  }

  async function handleSaveAuthor() {
    if (!editingAuthor || !user) return
    setSaving(true); setError(null)
    try {
      const updates: UpdateAuthorPayload = {
        bio: authorBio || null,
        beat_description: authorBeatDesc || null,
        credentials: authorCredentials || null,
      }
      await updateAuthor(editingAuthor, updates)
      queryClient.invalidateQueries({ queryKey: ['pub-authors', pub?.id] })
      setEditingAuthor(null)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally { setSaving(false) }
  }

  async function handleSaveLog() {
    if (!pubLog.data || !user) return
    setLogSaving(true); setError(null)
    try {
      await updatePublicationLog(pubLog.data.id, logContent)
      queryClient.invalidateQueries({ queryKey: ['pub-log', pub?.id] })
      setLogEditing(false)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save log')
    } finally { setLogSaving(false) }
  }

  async function handleAddFeed() {
    if (!pub || !user || !feedName || !feedUrl) return
    setSaving(true); setError(null)
    try {
      await createFeedSource({
        publication_id: pub.id,
        name: feedName,
        url: feedUrl,
        feed_type: feedType,
        beat_category: feedBeat || undefined,
        notes: feedNotes || undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['pub-feeds', pub.id] })
      setAddingFeed(false); setFeedName(''); setFeedUrl(''); setFeedType('rss'); setFeedBeat(''); setFeedNotes('')
    } catch (err: any) {
      setError(err.message ?? 'Failed to add feed')
    } finally { setSaving(false) }
  }

  async function handleToggleFeed(feedId: string, currentActive: boolean) {
    if (!user) return
    try {
      await updateFeedSource(feedId, { active: !currentActive })
      queryClient.invalidateQueries({ queryKey: ['pub-feeds', pub?.id] })
    } catch (err: any) {
      setError(err.message ?? 'Failed to toggle feed')
    }
  }

  async function handleDeleteFeed(feedId: string) {
    if (!user) return
    try {
      await deleteFeedSource(feedId)
      queryClient.invalidateQueries({ queryKey: ['pub-feeds', pub?.id] })
    } catch (err: any) {
      setError(err.message ?? 'Failed to delete feed')
    }
  }

  function toggleVoice(authorId: string, vp: VoiceProfile | undefined) {
    if (voiceAuthorId === authorId) {
      setVoiceAuthorId(null); setVoiceEditing(false)
    } else {
      setVoiceAuthorId(authorId)
      setVoiceContent(vp?.content ?? '')
      setVoiceEditing(false)
    }
  }

  async function handleSaveVoice() {
    if (!voiceAuthorId || !user) return
    const vp = (voiceProfiles.data ?? []).find(v => v.author_id === voiceAuthorId)
    if (!vp) return
    setVoiceSaving(true); setError(null)
    try {
      await updateVoiceProfile(vp.id, voiceContent)
      queryClient.invalidateQueries({ queryKey: ['pub-voices', pub?.id] })
      setVoiceEditing(false)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save voice profile')
    } finally { setVoiceSaving(false) }
  }

  function openBeat(beat: BeatResearch) {
    setSelectedBeat(beat.id)
    setBeatContent(beat.content)
    setBeatEditing(false)
  }

  async function handleSaveBeat() {
    if (!selectedBeat || !user) return
    setBeatSaving(true); setError(null)
    try {
      await updateBeatResearch(selectedBeat, { content: beatContent, updated_by: 'atlas-command' })
      queryClient.invalidateQueries({ queryKey: ['pub-beats', pub?.id] })
      setBeatEditing(false)
    } catch (err: any) {
      setError(err.message ?? 'Failed to save beat')
    } finally { setBeatSaving(false) }
  }

  if (pubLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-[var(--color-text-muted)]">Loading publication...</p></div>
  }
  if (!pub) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-red-400">Publication not found</p></div>
  }

  const tabs: { id: TabId; label: string; icon: typeof Globe }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'pages', label: 'Pages', icon: Globe },
    { id: 'editorial', label: 'Editorial', icon: Calendar },
    { id: 'beats', label: 'Beats', icon: BookOpen },
    { id: 'feeds', label: 'Feeds', icon: Rss },
    { id: 'log', label: 'Log', icon: List },
    { id: 'authors', label: 'Authors', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const inputClass = "w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
  const labelClass = "block text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-1.5"

  function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return `${m}m ${s}s`
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] transition-colors text-[var(--color-text-muted)]">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: color }}>
            {short}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{pub.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {pub.domain && (
                <a href={`https://${pub.domain}`} target="_blank" rel="noopener" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] flex items-center gap-1">
                  {pub.domain} <ExternalLink size={10} />
                </a>
              )}
              {pub.tagline && <span className="text-xs text-[var(--color-text-muted)]">· {pub.tagline}</span>}
              {pub.region && <span className="text-xs text-[var(--color-text-muted)]">· {pub.region}</span>}
            </div>
          </div>
        </div>
        {visitorCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {visitorCount} live
          </div>
        )}
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

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-green-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Published</span></div>
              <p className="text-2xl font-bold">{myStats?.published_posts ?? 0}</p>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><Clock size={14} className="text-blue-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Scheduled</span></div>
              <p className="text-2xl font-bold">{myStats?.scheduled_posts ?? 0}</p>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><Inbox size={14} className="text-yellow-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Drafts</span></div>
              <p className="text-2xl font-bold">{myStats?.draft_posts ?? 0}</p>
            </div>
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1"><Globe size={14} className="text-purple-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Pages</span></div>
              <p className="text-2xl font-bold">{myStats?.published_pages ?? 0}</p>
            </div>
          </div>

          {/* Fathom traffic */}
          {fathomStats.data && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-blue-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Visits (30d)</span></div>
                <p className="text-2xl font-bold">{fathomStats.data.visits.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1"><Eye size={14} className="text-green-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Pageviews (30d)</span></div>
                <p className="text-2xl font-bold">{fathomStats.data.pageviews.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1"><BarChart3 size={14} className="text-purple-400" /><span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Avg Duration</span></div>
                <p className="text-2xl font-bold">{formatDuration(fathomStats.data.avgDuration)}</p>
              </div>
            </div>
          )}

          {/* Health Score */}
          {pub && <div className="mb-6"><HealthScoreCompact pubId={pub.id} /></div>}

          <div className="grid grid-cols-2 gap-8">
            {/* Latest posts */}
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Latest Posts</h2>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                {pubPosts.slice(0, 8).map((post) => (
                  <div key={post.id} className="px-4 py-2.5 border-b border-[var(--color-border)] last:border-0 flex items-center justify-between">
                    <Link to={`/posts/${post.id}`} className="text-sm truncate hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5 flex-1 min-w-0">
                      <Pencil size={10} className="text-[var(--color-text-muted)] flex-shrink-0" />
                      <span className="truncate">{post.title}</span>
                    </Link>
                    <span className="text-[10px] text-[var(--color-text-muted)] ml-2 flex-shrink-0">{formatRelative(post.pub_date)}</span>
                  </div>
                ))}
                {pubPosts.length === 0 && <p className="px-4 py-6 text-sm text-center text-[var(--color-text-muted)]">No posts yet</p>}
              </div>
            </div>

            {/* Top pages from Fathom */}
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Top Pages (30d)</h2>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                {topPagesData.data && topPagesData.data.length > 0 ? (
                  topPagesData.data.map((page, i) => (
                    <div key={i} className="px-4 py-2.5 border-b border-[var(--color-border)] last:border-0 flex items-center justify-between">
                      <span className="text-xs font-mono text-[var(--color-text-muted)] truncate flex-1 min-w-0">{page.pathname}</span>
                      <span className="text-xs font-semibold text-[var(--color-accent-hover)] ml-2 flex-shrink-0">{page.pageviews.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-sm text-center text-[var(--color-text-muted)]">{topPagesData.isLoading ? 'Loading...' : 'No data'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Open editorial items */}
          {editorial.data && editorial.data.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">Open Editorial Items</h2>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-2)]">
                      <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Concept</th>
                      <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-20">Status</th>
                      <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-24">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editorial.data.slice(0, 10).map((item) => (
                      <tr key={item.id} className="border-t border-[var(--color-border)]">
                        <td className="px-4 py-2 truncate max-w-[300px]">{item.concept}</td>
                        <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(item.status)}`}>{item.status}</span></td>
                        <td className="px-4 py-2 text-[var(--color-text-muted)]">{item.target_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== POSTS TAB ===== */}
      {activeTab === 'posts' && (
        <div>
          <div className="mb-4 text-sm text-[var(--color-text-muted)]">{pubPosts.length} articles</div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Article</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-32">Author</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Beat</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Date</th>
                </tr>
              </thead>
              <tbody>
                {pubPosts.map((post) => (
                  <tr key={post.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3">
                      <Link to={`/posts/${post.id}`} className="hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-1.5">
                        <Pencil size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                        <span className="truncate">{post.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{post.author_name ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize">{post.beat ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(post.status)}`}>{post.status}</span></td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatRelative(post.pub_date)}</td>
                  </tr>
                ))}
                {pubPosts.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No articles</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== PAGES TAB ===== */}
      {activeTab === 'pages' && (
        <div>
          <div className="mb-4 text-sm text-[var(--color-text-muted)]">{pages.data?.length ?? 0} pages</div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Title</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Type</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Updated</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-16"></th>
                </tr>
              </thead>
              <tbody>
                {(pages.data ?? []).map((page: PubPage) => {
                  const isHub = !!(page.hub_beat || page.hub_tag)
                  const isStale = page.updated_at
                    ? (Date.now() - new Date(page.updated_at).getTime()) > 30 * 24 * 60 * 60 * 1000
                    : false
                  return (
                    <tr key={page.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{page.title}</span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">/{page.slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isHub ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-400">Hub</span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-surface-2)] text-[var(--color-text-muted)]">Static</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          page.status === 'archived' ? 'bg-gray-500/20 text-gray-400' :
                          isStale ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {page.status === 'archived' ? 'archived' : isStale ? 'stale' : page.status ?? 'published'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatRelative(page.updated_at)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/pages/${page.id}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors">
                          <Pencil size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
                {(pages.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No pages</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== EDITORIAL TAB ===== */}
      {activeTab === 'editorial' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">{editorial.data?.length ?? 0} open items</span>
            <Link to="/editorial" className="text-xs text-[var(--color-accent-hover)] hover:underline flex items-center gap-1">
              Full Calendar <ChevronRight size={12} />
            </Link>
          </div>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Concept</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Beat</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Target Date</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-28">Author</th>
                </tr>
              </thead>
              <tbody>
                {(editorial.data ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{item.concept}</span>
                        {item.post_id && (
                          <Link to={`/posts/${item.post_id}`} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)]"><Pencil size={10} /></Link>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize">{item.beat ?? '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(item.status)}`}>{item.status}</span></td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{item.target_date}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{item.author_name ?? '—'}</td>
                  </tr>
                ))}
                {(editorial.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No open editorial items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== BEATS TAB ===== */}
      {activeTab === 'beats' && (
        <div className="flex gap-6">
          {/* Beat list sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="text-sm text-[var(--color-text-muted)] mb-3">{beats.data?.length ?? 0} beats</div>
            <div className="space-y-1">
              {(beats.data ?? []).map((beat: BeatResearch) => (
                <button
                  key={beat.id}
                  onClick={() => openBeat(beat)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    selectedBeat === beat.id
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                      : 'hover:bg-[var(--color-surface-2)] text-[var(--color-text)]'
                  }`}
                >
                  <div className="font-medium truncate">{beat.beat_name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[var(--color-text-muted)] capitalize">{beat.beat_category ?? 'general'}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">·</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{(beat.content?.length ?? 0).toLocaleString()} chars</span>
                  </div>
                </button>
              ))}
              {(beats.data ?? []).length === 0 && (
                <p className="text-sm text-[var(--color-text-muted)] px-3 py-4">No beats configured</p>
              )}
            </div>
          </div>

          {/* Beat content viewer/editor */}
          <div className="flex-1 min-w-0">
            {selectedBeat && beats.data ? (() => {
              const beat = beats.data.find((b: BeatResearch) => b.id === selectedBeat)
              if (!beat) return null
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold">{beat.beat_name}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                        <span className="capitalize">{beat.beat_category ?? 'general'}</span>
                        <span>·</span>
                        <span>Updated {beat.last_updated ? new Date(beat.last_updated).toLocaleDateString() : 'never'}</span>
                        {beat.updated_by && <><span>·</span><span>by {beat.updated_by}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!beatEditing ? (
                        <button
                          onClick={() => setBeatEditing(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveBeat}
                            disabled={beatSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Save size={12} /> {beatSaving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => { setBeatEditing(false); setBeatContent(beat.content) }}
                            className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {beatEditing ? (
                    <textarea
                      value={beatContent}
                      onChange={(e) => setBeatContent(e.target.value)}
                      className="w-full h-[600px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-y"
                      placeholder="Beat research content (markdown)"
                    />
                  ) : (
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 max-h-[650px] overflow-y-auto">
                      <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-mono text-[var(--color-text)]">
                        {beat.content || 'No content yet. Click Edit to add beat research notes.'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })() : (
              <div className="flex items-center justify-center h-64 text-sm text-[var(--color-text-muted)]">
                <div className="text-center">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Select a beat to view research</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== FEEDS TAB ===== */}
      {activeTab === 'feeds' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-[var(--color-text-muted)]">{feeds.data?.length ?? 0} sources</span>
            <button
              onClick={() => setAddingFeed(!addingFeed)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors"
            >
              {addingFeed ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add Source</>}
            </button>
          </div>

          {addingFeed && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelClass}>Name</label><input type="text" value={feedName} onChange={(e) => setFeedName(e.target.value)} className={inputClass} placeholder="Source name" /></div>
                <div><label className={labelClass}>URL</label><input type="text" value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} className={inputClass} placeholder="https://..." /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Type</label>
                  <select value={feedType} onChange={(e) => setFeedType(e.target.value)} className={inputClass}>
                    <option value="rss">RSS</option>
                    <option value="youtube">YouTube</option>
                    <option value="api">API</option>
                    <option value="website">Website</option>
                  </select>
                </div>
                <div><label className={labelClass}>Beat</label><input type="text" value={feedBeat} onChange={(e) => setFeedBeat(e.target.value)} className={inputClass} placeholder="e.g. sports, government" /></div>
                <div><label className={labelClass}>Notes</label><input type="text" value={feedNotes} onChange={(e) => setFeedNotes(e.target.value)} className={inputClass} placeholder="Optional notes" /></div>
              </div>
              <button onClick={handleAddFeed} disabled={saving || !feedName || !feedUrl} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Save size={12} /> {saving ? 'Adding...' : 'Add Feed'}
              </button>
            </div>
          )}

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold">Source</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-20">Type</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-24">Beat</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-16">Active</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wide font-semibold w-12"></th>
                </tr>
              </thead>
              <tbody>
                {(feeds.data ?? []).map((feed: FeedSource) => (
                  <tr key={feed.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3">
                      <div>
                        <a href={feed.url} target="_blank" rel="noopener" className="text-sm hover:text-[var(--color-accent-hover)] transition-colors flex items-center gap-1">
                          {feed.name} <ExternalLink size={10} className="text-[var(--color-text-muted)]" />
                        </a>
                        {feed.notes && <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{feed.notes}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        feed.feed_type === 'rss' ? 'bg-orange-500/20 text-orange-400' :
                        feed.feed_type === 'youtube' ? 'bg-red-500/20 text-red-400' :
                        feed.feed_type === 'api' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                      }`}>{feed.feed_type}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)] capitalize text-xs">{feed.beat_category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleFeed(feed.id, feed.active)}
                        className={`w-8 h-4 rounded-full transition-colors relative ${feed.active ? 'bg-green-500' : 'bg-[var(--color-surface-2)]'}`}
                      >
                        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${feed.active ? 'left-4' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteFeed(feed.id)} className="text-[var(--color-text-muted)] hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(feeds.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">No feed sources configured</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== LOG TAB ===== */}
      {activeTab === 'log' && (
        <div>
          {pubLog.data ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--color-text-muted)]">Publication Log</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{(pubLog.data.content?.length ?? 0).toLocaleString()} chars</span>
                </div>
                <div className="flex items-center gap-2">
                  {!logEditing && (
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                      <input
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Search log..."
                        className="pl-7 pr-3 py-1.5 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] w-48"
                      />
                    </div>
                  )}
                  {!logEditing ? (
                    <button
                      onClick={() => { setLogContent(pubLog.data!.content); setLogEditing(true) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  ) : (
                    <>
                      <button onClick={handleSaveLog} disabled={logSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                        <Save size={12} /> {logSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setLogEditing(false)} className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Cancel</button>
                    </>
                  )}
                </div>
              </div>

              {logEditing ? (
                <textarea
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  className="w-full h-[650px] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-y"
                />
              ) : (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 max-h-[650px] overflow-y-auto">
                  <pre className="text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">
                    {logSearch
                      ? pubLog.data.content.split('\n').filter(line => line.toLowerCase().includes(logSearch.toLowerCase())).join('\n') || 'No matches found'
                      : pubLog.data.content || 'No log content yet.'
                    }
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-[var(--color-text-muted)]">
              {pubLog.isLoading ? 'Loading log...' : 'No publication log found'}
            </div>
          )}
        </div>
      )}

      {/* ===== AUTHORS TAB ===== */}
      {activeTab === 'authors' && (
        <div className="space-y-4">
          {(authors.data ?? []).map((author: PubAuthor) => (
            <div key={author.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {author.avatar_url ? (
                    <img src={author.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
                      {author.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm">{author.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">/{author.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--color-accent-hover)] font-semibold">{author.post_count_30d} posts (30d)</span>
                  {(() => {
                    const vp = (voiceProfiles.data ?? []).find(v => v.author_id === author.id)
                    return vp ? (
                      <button
                        onClick={() => toggleVoice(author.id, vp)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                          voiceAuthorId === author.id
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-purple-400'
                        }`}
                      >
                        <BookOpen size={10} /> Voice
                      </button>
                    ) : null
                  })()}
                  {editingAuthor !== author.id && (
                    <button onClick={() => startEditAuthor(author)} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)] transition-colors">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
              {author.beat_description && editingAuthor !== author.id && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2"><span className="font-semibold">Beat:</span> {author.beat_description}</p>
              )}
              {author.credentials && editingAuthor !== author.id && (
                <p className="text-xs text-[var(--color-text-muted)] mb-2"><span className="font-semibold">Credentials:</span> {author.credentials}</p>
              )}
              {author.bio && editingAuthor !== author.id && (
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-3">{author.bio}</p>
              )}

              {/* Inline author editor */}
              {editingAuthor === author.id && (
                <div className="mt-3 space-y-3 border-t border-[var(--color-border)] pt-3">
                  <div>
                    <label className={labelClass}>Beat Description</label>
                    <input type="text" value={authorBeatDesc} onChange={(e) => setAuthorBeatDesc(e.target.value)} className={inputClass} placeholder="What this author covers" />
                  </div>
                  <div>
                    <label className={labelClass}>Credentials</label>
                    <input type="text" value={authorCredentials} onChange={(e) => setAuthorCredentials(e.target.value)} className={inputClass} placeholder="Title or credentials" />
                  </div>
                  <div>
                    <label className={labelClass}>Bio</label>
                    <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} rows={4} className={inputClass} placeholder="Author biography" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveAuthor} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                      <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={() => setEditingAuthor(null)} className="px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Voice Profile viewer/editor */}
              {voiceAuthorId === author.id && (() => {
                const vp = (voiceProfiles.data ?? []).find(v => v.author_id === author.id)
                if (!vp) return null
                return (
                  <div className="mt-3 border-t border-purple-500/20 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-purple-400" />
                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Voice Profile</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">Updated {vp.last_updated ? new Date(vp.last_updated).toLocaleDateString() : 'never'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!voiceEditing ? (
                          <button onClick={() => { setVoiceContent(vp.content); setVoiceEditing(true) }} className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 rounded transition-colors">
                            <Pencil size={10} /> Edit
                          </button>
                        ) : (
                          <>
                            <button onClick={handleSaveVoice} disabled={voiceSaving} className="flex items-center gap-1 px-2 py-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50">
                              <Save size={10} /> {voiceSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setVoiceEditing(false)} className="px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Cancel</button>
                          </>
                        )}
                      </div>
                    </div>
                    {voiceEditing ? (
                      <textarea
                        value={voiceContent}
                        onChange={(e) => setVoiceContent(e.target.value)}
                        className="w-full h-96 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--color-text)] focus:outline-none focus:border-purple-500 transition-colors resize-y"
                      />
                    ) : (
                      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 max-h-96 overflow-y-auto">
                        <pre className="text-xs font-mono text-[var(--color-text)] whitespace-pre-wrap leading-relaxed">{vp.content || 'No voice profile content.'}</pre>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ))}
          {(authors.data ?? []).length === 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-8 text-center text-sm text-[var(--color-text-muted)]">No authors assigned to this publication</div>
          )}
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'settings' && (
        <div>
          {error && <div className="mb-4 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={14} /> {error}</div>}
          {saved && <div className="mb-4 text-xs text-green-400 flex items-center gap-1"><Check size={14} /> Saved</div>}

          {!editing ? (
            <div className="space-y-6">
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Publication Info</h2>
                  <button onClick={initSettingsForm} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-accent-hover)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-colors">
                    <Pencil size={12} /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-xs font-semibold text-[var(--color-text-muted)]">Name</span><p>{pub.name}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--color-text-muted)]">Domain</span><p>{pub.domain ?? '—'}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--color-text-muted)]">Tagline</span><p>{pub.tagline ?? '—'}</p></div>
                  <div><span className="text-xs font-semibold text-[var(--color-text-muted)]">Region</span><p>{pub.region ?? '—'}</p></div>
                  <div className="col-span-2"><span className="text-xs font-semibold text-[var(--color-text-muted)]">Description</span><p>{pub.description ?? '—'}</p></div>
                </div>
              </div>

              {/* Read-only metadata */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-3">Metadata</h2>
                <div className="grid grid-cols-2 gap-3 text-xs text-[var(--color-text-muted)]">
                  <div><span className="font-semibold">Slug:</span> <span className="font-mono">{pub.slug}</span></div>
                  <div><span className="font-semibold">Status:</span> {pub.status ?? '—'}</div>
                  <div><span className="font-semibold">Fathom Site ID:</span> <span className="font-mono">{pub.fathom_site_id ?? '—'}</span></div>
                  <div><span className="font-semibold">Primary Color:</span> <span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ backgroundColor: pub.primary_color ?? '#666' }} /> {pub.primary_color ?? '—'}</div>
                  <div><span className="font-semibold">Created:</span> {pub.created_at ? new Date(pub.created_at).toLocaleDateString() : '—'}</div>
                  <div><span className="font-semibold">Updated:</span> {pub.updated_at ? new Date(pub.updated_at).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold mb-2">Edit Publication</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Name</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Domain</label><input type="text" value={formDomain} onChange={(e) => setFormDomain(e.target.value)} className={inputClass} placeholder="example.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Tagline</label><input type="text" value={formTagline} onChange={(e) => setFormTagline(e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Region</label><input type="text" value={formRegion} onChange={(e) => setFormRegion(e.target.value)} className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Description</label><textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} className={inputClass} placeholder="About this publication" /></div>
              <div><label className={labelClass}>Logo URL</label><input type="text" value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} className={inputClass} placeholder="https://..." /></div>
              <div className="flex items-center gap-2 pt-2">
                <button onClick={handleSaveSettings} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

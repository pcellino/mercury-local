import { supabase } from './supabase'

// ---------- Publications ----------
export interface Publication {
  id: string
  name: string
  slug: string
  domain: string | null
}

export async function getPublications(): Promise<Publication[]> {
  const { data, error } = await supabase
    .from('publications')
    .select('id, name, slug, domain')
    .order('name')
  if (error) throw error
  return data ?? []
}

// ---------- Full Publication ----------
export interface FullPublication {
  id: string
  name: string
  slug: string
  domain: string | null
  tagline: string | null
  region: string | null
  logo_url: string | null
  status: string | null
  description: string | null
  fathom_site_id: string | null
  social_links: Record<string, string>
  primary_color: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getPublicationBySlug(slug: string): Promise<FullPublication> {
  const { data, error } = await supabase
    .from('publications')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data as FullPublication
}

// ---------- Publication-scoped queries ----------

export interface PubAuthor {
  id: string
  name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  email: string | null
  credentials: string | null
  beat_description: string | null
  post_count_30d: number
}

export async function getPublicationAuthors(pubId: string): Promise<PubAuthor[]> {
  const { data, error } = await supabase
    .from('authors')
    .select('id, name, slug, bio, avatar_url, email, credentials, beat_description')
    .eq('publication_id', pubId)
    .order('name')
  if (error) throw error

  // Get 30-day post counts per author
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const authors = data ?? []
  const counts = await Promise.all(
    authors.map(async (a) => {
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', a.id)
        .eq('status', 'published')
        .gte('pub_date', thirtyDaysAgo)
      return count ?? 0
    })
  )
  return authors.map((a, i) => ({ ...a, post_count_30d: counts[i] }))
}

export interface PubPage {
  id: string
  title: string
  slug: string
  status: string | null
  hub_beat: string | null
  hub_tag: string | null
  hub_limit: number | null
  updated_at: string | null
}

export async function getPublicationPages(pubId: string): Promise<PubPage[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('id, title, slug, status, hub_beat, hub_tag, hub_limit, updated_at')
    .eq('publication_id', pubId)
    .order('title')
  if (error) throw error
  return data ?? []
}

export async function getPublicationEditorial(pubId: string): Promise<EditorialItem[]> {
  const { data, error } = await supabase
    .from('editorial_calendar')
    .select(`
      id, concept, status, target_date, priority, beat, notes, post_id,
      publications!inner(name, slug),
      authors(name)
    `)
    .eq('publication_id', pubId)
    .not('status', 'in', '("published","killed")')
    .order('target_date', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    concept: row.concept,
    status: row.status,
    target_date: row.target_date,
    priority: row.priority,
    beat: row.beat,
    notes: row.notes,
    post_id: row.post_id,
    pub_name: row.publications?.name ?? '',
    pub_slug: row.publications?.slug ?? '',
    author_name: row.authors?.name ?? null,
  }))
}

// ---------- Transcripts ----------
export interface Transcript {
  id: string
  title: string
  meeting_date: string
  meeting_type: string | null
  status: string | null
  word_count: number | null
  source_url: string | null
  summary: string | null
  publication_id: string | null
  pub_name?: string
}

export interface TranscriptDetail extends Transcript {
  full_text: string | null
  speakers: any | null
  key_quotes: any | null
  processing_notes: string | null
  file_path: string | null
}

export async function getTranscripts(limit = 50): Promise<Transcript[]> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('id, title, meeting_date, meeting_type, status, word_count, source_url, summary, publication_id')
    .order('meeting_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function searchTranscripts(query: string): Promise<Transcript[]> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('id, title, meeting_date, meeting_type, status, word_count, source_url, summary, publication_id')
    .textSearch('search_vector', query, { type: 'websearch' })
    .order('meeting_date', { ascending: false })
    .limit(30)
  if (error) throw error
  return data ?? []
}

export async function getTranscriptById(id: string): Promise<TranscriptDetail> {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as TranscriptDetail
}

// ---------- Publication Log ----------
export interface PublicationLog {
  id: string
  publication_id: string
  content: string
  article_count: number
  last_updated: string | null
  updated_by: string | null
}

export async function getPublicationLog(pubId: string): Promise<PublicationLog | null> {
  const { data, error } = await supabase
    .from('publication_logs')
    .select('*')
    .eq('publication_id', pubId)
    .maybeSingle()
  if (error) throw error
  return data as PublicationLog | null
}

// ---------- Feed Sources ----------
export interface FeedSource {
  id: string
  publication_id: string
  name: string
  url: string
  feed_type: string
  beat_category: string | null
  active: boolean
  notes: string | null
  last_fetched: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getPublicationFeeds(pubId: string): Promise<FeedSource[]> {
  const { data, error } = await supabase
    .from('feed_sources')
    .select('*')
    .eq('publication_id', pubId)
    .order('name')
  if (error) throw error
  return data ?? []
}

// ---------- Voice Profiles ----------
export interface VoiceProfile {
  id: string
  author_id: string
  content: string
  last_updated: string | null
  updated_by: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getVoiceProfileByAuthor(authorId: string): Promise<VoiceProfile | null> {
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('author_id', authorId)
    .maybeSingle()
  if (error) throw error
  return data as VoiceProfile | null
}

export async function getPublicationVoiceProfiles(pubId: string): Promise<(VoiceProfile & { author_name: string })[]> {
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*, authors!inner(name, publication_id)')
    .eq('authors.publication_id', pubId)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    author_name: row.authors?.name ?? '',
    authors: undefined,
  }))
}

// ---------- Beat Research ----------
export interface BeatResearch {
  id: string
  publication_id: string
  beat_name: string
  beat_slug: string
  beat_category: string | null
  content: string
  last_updated: string | null
  updated_by: string | null
  article_count: number
  created_at: string | null
  updated_at: string | null
}

export async function getPublicationBeats(pubId: string): Promise<BeatResearch[]> {
  const { data, error } = await supabase
    .from('beat_research')
    .select('*')
    .eq('publication_id', pubId)
    .order('beat_name')
  if (error) throw error
  return data ?? []
}

export async function getBeatById(id: string): Promise<BeatResearch> {
  const { data, error } = await supabase
    .from('beat_research')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as BeatResearch
}

// ---------- Publication Stats ----------
export interface PubStats {
  publication_id: string
  pub_name: string
  pub_slug: string
  pub_domain: string | null
  published_posts: number
  scheduled_posts: number
  draft_posts: number
  published_pages: number
  latest_post_date: string | null
  latest_post_title: string | null
}

export async function getPublicationStats(): Promise<PubStats[]> {
  const { data, error } = await supabase.rpc('get_publication_stats')
  // Fallback: if RPC doesn't exist, do it client-side
  if (error) {
    // Client-side fallback
    const pubs = await getPublications()
    const stats: PubStats[] = []
    for (const pub of pubs) {
      const [published, scheduled, drafts, pages, latest] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('publication_id', pub.id).eq('status', 'published'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('publication_id', pub.id).eq('status', 'scheduled'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('publication_id', pub.id).eq('status', 'draft'),
        supabase.from('pages').select('id', { count: 'exact', head: true }).eq('publication_id', pub.id).eq('status', 'published'),
        supabase.from('posts').select('title, pub_date').eq('publication_id', pub.id).eq('status', 'published').order('pub_date', { ascending: false }).limit(1),
      ])
      stats.push({
        publication_id: pub.id,
        pub_name: pub.name,
        pub_slug: pub.slug,
        pub_domain: pub.domain,
        published_posts: published.count ?? 0,
        scheduled_posts: scheduled.count ?? 0,
        draft_posts: drafts.count ?? 0,
        published_pages: pages.count ?? 0,
        latest_post_date: latest.data?.[0]?.pub_date ?? null,
        latest_post_title: latest.data?.[0]?.title ?? null,
      })
    }
    return stats
  }
  return data ?? []
}

// ---------- Editorial Calendar ----------
export interface EditorialItem {
  id: string
  concept: string
  status: string
  target_date: string
  priority: string | null
  beat: string | null
  notes: string | null
  pub_name: string
  pub_slug: string
  author_name: string | null
  post_id: string | null
}

export async function getEditorialCalendar(filter?: { status?: string; pubSlug?: string }): Promise<EditorialItem[]> {
  let query = supabase
    .from('editorial_calendar')
    .select(`
      id, concept, status, target_date, priority, beat, notes, post_id,
      publications!inner(name, slug),
      authors(name)
    `)
    .order('target_date', { ascending: true })

  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    concept: row.concept,
    status: row.status,
    target_date: row.target_date,
    priority: row.priority,
    beat: row.beat,
    notes: row.notes,
    post_id: row.post_id,
    pub_name: row.publications?.name ?? '',
    pub_slug: row.publications?.slug ?? '',
    author_name: row.authors?.name ?? null,
  }))
}

// ---------- Recent Posts ----------
export interface RecentPost {
  id: string
  title: string
  slug: string
  beat: string | null
  status: string
  pub_date: string | null
  pub_name: string
  pub_slug: string
  author_name: string | null
}

export async function getRecentPosts(limit = 100, statusFilter?: string): Promise<RecentPost[]> {
  let query = supabase
    .from('posts')
    .select(`
      id, title, slug, beat, status, pub_date,
      publications!inner(name, slug),
      authors(name)
    `)
    .order('pub_date', { ascending: false })
    .limit(limit)

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    beat: row.beat,
    status: row.status,
    pub_date: row.pub_date,
    pub_name: row.publications?.name ?? '',
    pub_slug: row.publications?.slug ?? '',
    author_name: row.authors?.name ?? null,
  }))
}

// ---------- Authors ----------
export interface Author {
  id: string
  name: string
  slug: string
}

export async function getAuthors(): Promise<Author[]> {
  const { data, error } = await supabase
    .from('authors')
    .select('id, name, slug')
    .order('name')
  if (error) throw error
  return data ?? []
}

// ---------- Aggregate Counts ----------
export interface AggregateStats {
  totalPublished: number
  totalScheduled: number
  totalDrafts: number
  totalPages: number
  editorialOpen: number
}

export async function getAggregateStats(): Promise<AggregateStats> {
  const [published, scheduled, drafts, pages, editorial] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('pages').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('editorial_calendar').select('id', { count: 'exact', head: true }).not('status', 'in', '("published","killed")'),
  ])
  return {
    totalPublished: published.count ?? 0,
    totalScheduled: scheduled.count ?? 0,
    totalDrafts: drafts.count ?? 0,
    totalPages: pages.count ?? 0,
    editorialOpen: editorial.count ?? 0,
  }
}

// ---------- Analytics ----------

export interface PostsByWeek {
  week: string
  date: string
  [key: string]: string | number
}

export async function getPostsByWeek(weeks = 12): Promise<PostsByWeek[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      pub_date,
      publications!inner(slug)
    `)
    .eq('status', 'published')
    .gte('pub_date', new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('pub_date', { ascending: true })

  if (error) throw error

  const grouped: Record<string, Record<string, string | number>> = {}

  for (const post of data ?? []) {
    const date = new Date(post.pub_date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    const pubs = post.publications as any
    const pubSlug = (Array.isArray(pubs) ? pubs[0]?.slug : pubs?.slug) ?? 'unknown'

    if (!grouped[weekKey]) {
      grouped[weekKey] = { date: weekKey, week: weekKey }
    }
    const key = pubSlug as string
    grouped[weekKey][key] = ((grouped[weekKey][key] as number) ?? 0) + 1
  }

  return Object.values(grouped).sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateA - dateB
  }) as PostsByWeek[]
}

export interface AuthorStats {
  author_name: string
  post_count: number
}

export async function getAuthorStats(days = 30): Promise<AuthorStats[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      authors(name)
    `)
    .eq('status', 'published')
    .gte('pub_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

  if (error) throw error

  const grouped: Record<string, number> = {}

  for (const post of data ?? []) {
    const auth = post.authors as any
    const authorName = (Array.isArray(auth) ? auth[0]?.name : auth?.name) ?? 'Unknown'
    grouped[authorName] = (grouped[authorName] ?? 0) + 1
  }

  return Object.entries(grouped)
    .map(([name, count]) => ({ author_name: name, post_count: count }))
    .sort((a, b) => b.post_count - a.post_count)
}

export interface BeatStats {
  beat: string
  count: number
}

// ---------- Single Post (Full) ----------
export interface FullPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  author_id: string | null
  author_name: string | null
  publication_id: string | null
  pub_name: string | null
  pub_slug: string | null
  category_id: string | null
  status: string
  featured: boolean
  hero_image_url: string | null
  hero_image_alt: string | null
  hero_image_width: number | null
  hero_image_height: number | null
  pub_date: string | null
  beat: string | null
  seo_title: string | null
  meta_description: string | null
  summary: string | null
  follow_up_by: string | null
  follow_up_note: string | null
  source: string | null
  original_url: string | null
  created_at: string | null
  updated_at: string | null
  tags: { id: string; name: string; slug: string }[]
}

export async function getPostById(id: string): Promise<FullPost> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, excerpt, content, author_id, publication_id, category_id,
      status, featured, hero_image_url, hero_image_alt, hero_image_width, hero_image_height,
      pub_date, beat, seo_title, meta_description, summary,
      follow_up_by, follow_up_note, source, original_url, created_at, updated_at,
      publications(name, slug),
      authors(name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const pubs = (data as any).publications
  const auth = (data as any).authors

  // Fetch tags separately via post_tags join
  const { data: tagRows } = await supabase
    .from('post_tags')
    .select('tag_id, tags(id, name, slug)')
    .eq('post_id', id)

  const tags = (tagRows ?? []).map((r: any) => {
    const t = Array.isArray(r.tags) ? r.tags[0] : r.tags
    return { id: t?.id ?? '', name: t?.name ?? '', slug: t?.slug ?? '' }
  }).filter(t => t.id)

  return {
    ...data,
    author_name: Array.isArray(auth) ? auth[0]?.name : auth?.name ?? null,
    pub_name: Array.isArray(pubs) ? pubs[0]?.name : pubs?.name ?? null,
    pub_slug: Array.isArray(pubs) ? pubs[0]?.slug : pubs?.slug ?? null,
    tags,
  } as FullPost
}

// ---------- All Tags ----------
export interface Tag {
  id: string
  name: string
  slug: string
}

export async function getAllTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name')
  if (error) throw error
  return data ?? []
}

// ---------- Single Page (Full) ----------
export interface FullPage {
  id: string
  title: string
  slug: string
  content: string | null
  status: string | null
  publication_id: string | null
  pub_name: string | null
  pub_slug: string | null
  hub_beat: string | null
  hub_tag: string | null
  hub_limit: number | null
  hub_heading: string | null
  seo_title: string | null
  meta_description: string | null
  source: string | null
  original_url: string | null
  pub_date: string | null
  updated_at: string | null
}

export async function getPageById(id: string): Promise<FullPage> {
  const { data, error } = await supabase
    .from('pages')
    .select(`
      id, title, slug, content, status, publication_id,
      hub_beat, hub_tag, hub_limit, hub_heading,
      seo_title, meta_description, source, original_url, pub_date, updated_at,
      publications(name, slug)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  const pubs = (data as any).publications

  return {
    ...data,
    pub_name: Array.isArray(pubs) ? pubs[0]?.name : pubs?.name ?? null,
    pub_slug: Array.isArray(pubs) ? pubs[0]?.slug : pubs?.slug ?? null,
  } as FullPage
}

// ---------- Source Documents ----------
export interface SourceDocument {
  id: string
  title: string
  document_type: string
  source_org: string | null
  source_org_type: string | null
  document_date: string
  period_start: string | null
  period_end: string | null
  summary: string | null
  record_count: number | null
  file_path: string | null
  file_format: string | null
  file_size_bytes: number | null
  publication_id: string | null
  beat: string | null
  status: string
  processing_notes: string | null
  created_at: string | null
  updated_at: string | null
  pub_name?: string
}

export interface SourceDocumentDetail extends SourceDocument {
  extracted_text: string | null
  structured_data: any | null
}

export async function getSourceDocuments(limit = 100): Promise<SourceDocument[]> {
  const { data, error } = await supabase
    .from('source_documents')
    .select(`
      id, title, document_type, source_org, source_org_type, document_date,
      period_start, period_end, summary, record_count, file_path, file_format,
      file_size_bytes, publication_id, beat, status, processing_notes,
      created_at, updated_at,
      publications(name)
    `)
    .order('document_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    pub_name: row.publications?.name ?? null,
    publications: undefined,
  }))
}

export async function searchSourceDocuments(query: string): Promise<SourceDocument[]> {
  const { data, error } = await supabase
    .from('source_documents')
    .select(`
      id, title, document_type, source_org, source_org_type, document_date,
      period_start, period_end, summary, record_count, file_path, file_format,
      file_size_bytes, publication_id, beat, status, processing_notes,
      created_at, updated_at,
      publications(name)
    `)
    .textSearch('search_vector', query, { type: 'websearch' })
    .order('document_date', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    pub_name: row.publications?.name ?? null,
    publications: undefined,
  }))
}

export async function getSourceDocumentById(id: string): Promise<SourceDocumentDetail> {
  const { data, error } = await supabase
    .from('source_documents')
    .select(`*, publications(name)`)
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    ...data,
    pub_name: (data as any).publications?.name ?? null,
    publications: undefined,
  } as unknown as SourceDocumentDetail
}

export async function getSourceDocumentPosts(docId: string): Promise<{ id: string; title: string; slug: string; pub_date: string | null }[]> {
  const { data, error } = await supabase
    .from('post_source_documents')
    .select('posts(id, title, slug, pub_date)')
    .eq('source_document_id', docId)
  if (error) throw error
  return (data ?? []).map((row: any) => {
    const p = Array.isArray(row.posts) ? row.posts[0] : row.posts
    return { id: p?.id ?? '', title: p?.title ?? '', slug: p?.slug ?? '', pub_date: p?.pub_date ?? null }
  }).filter(p => p.id)
}

// ---------- Feed Items ----------
export interface FeedItem {
  id: string
  feed_source_id: string | null
  publication_id: string | null
  title: string
  url: string
  published_at: string | null
  summary: string | null
  author: string | null
  beat_category: string | null
  status: string
  editorial_calendar_id: string | null
  similarity_score: number | null
  similar_post_id: string | null
  created_at: string | null
  feed_name?: string
  pub_name?: string
  similar_post_title?: string
}

export async function getFeedItems(filters?: { status?: string; pubId?: string }, limit = 100): Promise<FeedItem[]> {
  let query = supabase
    .from('feed_items')
    .select(`
      id, feed_source_id, publication_id, title, url, published_at, summary, author,
      beat_category, status, editorial_calendar_id, similarity_score, similar_post_id,
      created_at,
      feed_sources(name),
      publications(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.pubId) {
    query = query.eq('publication_id', filters.pubId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    feed_name: row.feed_sources?.name ?? null,
    pub_name: row.publications?.name ?? null,
    feed_sources: undefined,
    publications: undefined,
  }))
}

// ---------- Competitors ----------
export interface Competitor {
  id: string
  publication_id: string | null
  name: string
  domain: string
  feed_url: string | null
  region: string | null
  notes: string | null
  is_active: boolean
  created_at: string | null
  updated_at: string | null
  pub_name?: string
}

export async function getCompetitors(pubId?: string): Promise<Competitor[]> {
  let query = supabase
    .from('competitors')
    .select('*, publications(name)')
    .order('name')

  if (pubId) {
    query = query.eq('publication_id', pubId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    pub_name: row.publications?.name ?? null,
    publications: undefined,
  }))
}

export interface CompetitorArticle {
  id: string
  competitor_id: string
  title: string
  url: string
  published_at: string | null
  beat_category: string | null
  has_local_coverage: boolean
  local_post_id: string | null
  created_at: string | null
}

export async function getCompetitorArticles(competitorId?: string, uncoveredOnly = false, limit = 100): Promise<CompetitorArticle[]> {
  let query = supabase
    .from('competitor_articles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (competitorId) {
    query = query.eq('competitor_id', competitorId)
  }
  if (uncoveredOnly) {
    query = query.eq('has_local_coverage', false)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ---------- Publication Health Score ----------
export interface HealthScore {
  publication_id: string
  pub_name: string
  pub_slug: string
  velocity_score: number      // posts per week vs target
  beat_coverage_score: number  // how many beats have recent content
  hub_freshness_score: number  // % of hub pages updated in last 30d
  pipeline_depth_score: number // editorial items in pipeline
  overall_score: number        // weighted composite
  details: {
    posts_this_week: number
    weekly_target: number
    active_beats: number
    total_beats: number
    fresh_hubs: number
    total_hubs: number
    pipeline_items: number
  }
}

export async function getPublicationHealthScores(): Promise<HealthScore[]> {
  const pubs = await getPublications()
  const scores: HealthScore[] = []

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  for (const pub of pubs.filter(p => p.domain)) {
    // Posts this week
    const { count: postsThisWeek } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)
      .eq('status', 'published')
      .gte('pub_date', weekAgo)

    // Distinct beats with content in last 30d
    const { data: recentBeats } = await supabase
      .from('posts')
      .select('beat')
      .eq('publication_id', pub.id)
      .eq('status', 'published')
      .gte('pub_date', thirtyDaysAgo)
      .not('beat', 'is', null)

    const activeBeatSet = new Set((recentBeats ?? []).map(r => r.beat))

    // Total beats for this pub (from beat_research)
    const { count: totalBeats } = await supabase
      .from('beat_research')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)

    // Hub page freshness
    const { data: hubs } = await supabase
      .from('pages')
      .select('id, updated_at')
      .eq('publication_id', pub.id)
      .eq('status', 'published')
      .not('hub_beat', 'is', null)

    const freshHubs = (hubs ?? []).filter(h =>
      h.updated_at && new Date(h.updated_at) > new Date(thirtyDaysAgo)
    ).length
    const totalHubs = (hubs ?? []).length

    // Editorial pipeline depth
    const { count: pipelineItems } = await supabase
      .from('editorial_calendar')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)
      .not('status', 'in', '("published","killed")')

    const pw = postsThisWeek ?? 0
    const weeklyTarget = 3 // default target
    const tb = totalBeats ?? 0
    const pi = pipelineItems ?? 0

    const velocityScore = Math.min(100, Math.round((pw / weeklyTarget) * 100))
    const beatCoverageScore = tb > 0 ? Math.round((activeBeatSet.size / tb) * 100) : 0
    const hubFreshnessScore = totalHubs > 0 ? Math.round((freshHubs / totalHubs) * 100) : 100
    const pipelineDepthScore = Math.min(100, Math.round((pi / 5) * 100)) // 5 items = 100%

    const overall = Math.round(
      velocityScore * 0.35 +
      beatCoverageScore * 0.25 +
      hubFreshnessScore * 0.20 +
      pipelineDepthScore * 0.20
    )

    scores.push({
      publication_id: pub.id,
      pub_name: pub.name,
      pub_slug: pub.slug,
      velocity_score: velocityScore,
      beat_coverage_score: beatCoverageScore,
      hub_freshness_score: hubFreshnessScore,
      pipeline_depth_score: pipelineDepthScore,
      overall_score: overall,
      details: {
        posts_this_week: pw,
        weekly_target: weeklyTarget,
        active_beats: activeBeatSet.size,
        total_beats: tb,
        fresh_hubs: freshHubs,
        total_hubs: totalHubs,
        pipeline_items: pi,
      },
    })
  }

  return scores.sort((a, b) => b.overall_score - a.overall_score)
}

export async function getBeatStats(days = 30): Promise<BeatStats[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('beat')
    .eq('status', 'published')
    .gte('pub_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

  if (error) throw error

  const grouped: Record<string, number> = {}

  for (const post of data ?? []) {
    const beat = post.beat ?? 'Uncategorized'
    grouped[beat] = (grouped[beat] ?? 0) + 1
  }

  return Object.entries(grouped)
    .map(([beat, count]) => ({ beat, count }))
    .sort((a, b) => b.count - a.count)
}

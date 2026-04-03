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

export async function getRecentPosts(limit = 20): Promise<RecentPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, beat, status, pub_date,
      publications!inner(name, slug),
      authors(name)
    `)
    .eq('status', 'published')
    .order('pub_date', { ascending: false })
    .limit(limit)

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

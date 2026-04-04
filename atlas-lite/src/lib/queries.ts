import { supabase } from './supabase'
import { todayET } from './todayET'

// ---------- Publications ----------
export interface Publication {
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
  primary_color: string | null
}

export async function getPublications(): Promise<Publication[]> {
  const { data, error } = await supabase
    .from('publications')
    .select('id, name, slug, domain, tagline, region, logo_url, status, description, fathom_site_id, primary_color')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function getPublicationBySlug(slug: string): Promise<Publication> {
  const { data, error } = await supabase
    .from('publications')
    .select('id, name, slug, domain, tagline, region, logo_url, status, description, fathom_site_id, primary_color')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data as Publication
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
  if (error) {
    // Fallback — same pattern as Alpha
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
  publication_id: string
  author_name: string | null
  author_id: string | null
  post_id: string | null
}

export async function getEditorialPipeline(): Promise<{
  overdue: EditorialItem[]
  today: EditorialItem[]
  upcoming: EditorialItem[]
}> {
  const { data, error } = await supabase
    .from('editorial_calendar')
    .select(`
      id, concept, status, target_date, priority, beat, notes, post_id, publication_id, author_id,
      publications!inner(name, slug),
      authors(name)
    `)
    .not('status', 'in', '("published","killed")')
    .order('target_date', { ascending: true })

  if (error) throw error

  const today = todayET()
  const plus3Date = new Date(today + 'T00:00:00')
  plus3Date.setDate(plus3Date.getDate() + 3)
  const plus3Str = plus3Date.toISOString().split('T')[0]

  const items: EditorialItem[] = (data ?? []).map((row: any) => ({
    id: row.id,
    concept: row.concept,
    status: row.status,
    target_date: row.target_date,
    priority: row.priority,
    beat: row.beat,
    notes: row.notes,
    post_id: row.post_id,
    publication_id: row.publication_id,
    author_id: row.author_id ?? null,
    pub_name: row.publications?.name ?? '',
    pub_slug: row.publications?.slug ?? '',
    author_name: row.authors?.name ?? null,
  }))

  return {
    overdue: items.filter(i => i.target_date < today),
    today: items.filter(i => i.target_date === today),
    upcoming: items.filter(i => i.target_date > today && i.target_date <= plus3Str),
  }
}

// ---------- Recently Published ----------
export interface RecentPost {
  id: string
  title: string
  slug: string
  beat: string | null
  status: string
  pub_date: string | null
  pub_name: string
  pub_slug: string
  pub_domain: string | null
  author_name: string | null
}

export async function getRecentlyPublished(limit = 10): Promise<RecentPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, title, slug, beat, status, pub_date,
      publications!inner(name, slug, domain),
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
    pub_domain: row.publications?.domain ?? null,
    author_name: row.authors?.name ?? null,
  }))
}

// ---------- Alerts ----------
export interface Alert {
  id: string
  type: 'overdue' | 'stale-hub' | 'velocity-drop' | 'thin-pipeline' | 'stale-beat'
  severity: 'critical' | 'warning' | 'info'
  message: string
  publication: string
  pubSlug: string
}

export async function computeAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = []
  const today = todayET()

  // 1. Overdue editorial items
  const { data: overdueItems } = await supabase
    .from('editorial_calendar')
    .select('id, concept, target_date, publications!inner(name, slug)')
    .not('status', 'in', '("published","killed")')
    .lt('target_date', today)
    .limit(20)

  for (const item of overdueItems ?? []) {
    const pub = (item as any).publications
    alerts.push({
      id: `overdue-${item.id}`,
      type: 'overdue',
      severity: 'critical',
      message: `"${item.concept}" was due ${item.target_date}`,
      publication: pub?.name ?? '',
      pubSlug: pub?.slug ?? '',
    })
  }

  // 2. Stale hub pages (>30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: stalePages } = await supabase
    .from('pages')
    .select('id, title, updated_at, publications!inner(name, slug)')
    .eq('status', 'published')
    .not('hub_beat', 'is', null)
    .lt('updated_at', thirtyDaysAgo)
    .limit(20)

  for (const page of stalePages ?? []) {
    const pub = (page as any).publications
    alerts.push({
      id: `stale-hub-${page.id}`,
      type: 'stale-hub',
      severity: 'warning',
      message: `Hub page "${page.title}" hasn't been updated in 30+ days`,
      publication: pub?.name ?? '',
      pubSlug: pub?.slug ?? '',
    })
  }

  // 3. Velocity drops (0 posts in last 7 days per pub)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: pubs } = await supabase.from('publications').select('id, name, slug').eq('status', 'active')
  for (const pub of pubs ?? []) {
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)
      .eq('status', 'published')
      .gte('pub_date', sevenDaysAgo)
    if ((count ?? 0) === 0) {
      alerts.push({
        id: `velocity-${pub.id}`,
        type: 'velocity-drop',
        severity: 'warning',
        message: 'No posts published in the last 7 days',
        publication: pub.name,
        pubSlug: pub.slug,
      })
    }
  }

  // 4. Thin pipelines (<2 items in next 2 weeks)
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  for (const pub of pubs ?? []) {
    const { count } = await supabase
      .from('editorial_calendar')
      .select('id', { count: 'exact', head: true })
      .eq('publication_id', pub.id)
      .not('status', 'in', '("published","killed")')
      .gte('target_date', today)
      .lte('target_date', twoWeeks)
    if ((count ?? 0) < 2) {
      alerts.push({
        id: `pipeline-${pub.id}`,
        type: 'thin-pipeline',
        severity: 'info',
        message: `Only ${count ?? 0} editorial items planned for next 2 weeks`,
        publication: pub.name,
        pubSlug: pub.slug,
      })
    }
  }

  return alerts.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 }
    return sev[a.severity] - sev[b.severity]
  })
}

// ---------- Pipeline Counts ----------
export interface PipelineCounts {
  concept: number
  assigned: number
  drafting: number
  review: number
  scheduled: number
}

export async function getPipelineCounts(): Promise<PipelineCounts> {
  const statuses = ['concept', 'assigned', 'drafting', 'review', 'scheduled'] as const
  const counts: PipelineCounts = { concept: 0, assigned: 0, drafting: 0, review: 0, scheduled: 0 }

  const results = await Promise.all(
    statuses.map(s =>
      supabase
        .from('editorial_calendar')
        .select('id', { count: 'exact', head: true })
        .eq('status', s)
    )
  )

  statuses.forEach((s, i) => {
    counts[s] = results[i].count ?? 0
  })

  return counts
}

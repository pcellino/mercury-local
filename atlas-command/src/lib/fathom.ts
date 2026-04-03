// Fathom Analytics client — calls our /api/fathom proxy

// Site IDs mapped to publication slugs
export const FATHOM_SITES: Record<string, { id: string; name: string }> = {
  'charlotte-mercury': { id: 'OXCUIWUS', name: 'The Charlotte Mercury' },
  'farmington-mercury': { id: 'BEEYFCZE', name: 'The Farmington Mercury' },
  'strolling-ballantyne': { id: 'FEALMTSO', name: 'Strolling Ballantyne' },
  'strolling-firethorne': { id: 'LWVCNMPP', name: 'Strolling Firethorne' },
  'grand-national-today': { id: 'HTQBJVGV', name: 'Grand National Today' },
  'mercury-local': { id: 'GBFVBSGG', name: 'Mercury Local' },
  'peter-cellino': { id: 'SAEIYNJG', name: 'Peter Cellino' },
}

export interface SiteStats {
  pubSlug: string
  pubName: string
  siteId: string
  visits: number
  pageviews: number
  avgDuration: number
}

export interface TopPage {
  pathname: string
  pageviews: number
  visits: number
  avgDuration: number
}

export interface CurrentVisitors {
  pubSlug: string
  pubName: string
  visitors: number
}

async function fathomFetch(endpoint: string, params: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams({ endpoint, ...params })
  const res = await fetch(`/api/fathom?${searchParams.toString()}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error ?? `Fathom API error: ${res.status}`)
  }
  return res.json()
}

// Get aggregate stats for a single site over a date range
export async function getSiteAggregates(
  siteId: string,
  dateFrom: string,
  dateTo: string
): Promise<{ visits: number; pageviews: number; avgDuration: number }> {
  const data = await fathomFetch('aggregations', {
    entity: 'pageview',
    entity_id: siteId,
    aggregates: 'visits,pageviews,avg_duration',
    date_from: dateFrom,
    date_to: dateTo,
  })
  const row = Array.isArray(data) ? data[0] : data
  return {
    visits: parseInt(row?.visits ?? '0'),
    pageviews: parseInt(row?.pageviews ?? '0'),
    avgDuration: parseFloat(row?.avg_duration ?? '0'),
  }
}

// Get all site stats across all publications
export async function getAllSiteStats(dateFrom: string, dateTo: string): Promise<SiteStats[]> {
  const results = await Promise.all(
    Object.entries(FATHOM_SITES).map(async ([slug, site]) => {
      try {
        const stats = await getSiteAggregates(site.id, dateFrom, dateTo)
        return {
          pubSlug: slug,
          pubName: site.name,
          siteId: site.id,
          ...stats,
        }
      } catch {
        return {
          pubSlug: slug,
          pubName: site.name,
          siteId: site.id,
          visits: 0,
          pageviews: 0,
          avgDuration: 0,
        }
      }
    })
  )
  return results.sort((a, b) => b.pageviews - a.pageviews)
}

// Get top pages for a site
export async function getTopPages(
  siteId: string,
  dateFrom: string,
  dateTo: string,
  limit = 20
): Promise<TopPage[]> {
  const data = await fathomFetch('aggregations', {
    entity: 'pageview',
    entity_id: siteId,
    aggregates: 'visits,pageviews,avg_duration',
    field_grouping: 'pathname',
    date_from: dateFrom,
    date_to: dateTo,
    sort_by: 'pageviews:desc',
    limit: limit.toString(),
  })
  return (Array.isArray(data) ? data : []).map((row: any) => ({
    pathname: row.pathname ?? '/',
    pageviews: parseInt(row.pageviews ?? '0'),
    visits: parseInt(row.visits ?? '0'),
    avgDuration: parseFloat(row.avg_duration ?? '0'),
  }))
}

// Get top referrers for a site
export interface TopReferrer {
  referrer: string
  visits: number
  pageviews: number
}

export async function getTopReferrers(
  siteId: string,
  dateFrom: string,
  dateTo: string,
  limit = 10
): Promise<TopReferrer[]> {
  const data = await fathomFetch('aggregations', {
    entity: 'pageview',
    entity_id: siteId,
    aggregates: 'visits,pageviews',
    field_grouping: 'referrer_hostname',
    date_from: dateFrom,
    date_to: dateTo,
    sort_by: 'pageviews:desc',
    limit: limit.toString(),
  })
  return (Array.isArray(data) ? data : []).map((row: any) => ({
    referrer: row.referrer_hostname || '(direct)',
    visits: parseInt(row.visits ?? '0'),
    pageviews: parseInt(row.pageviews ?? '0'),
  }))
}

// Get current visitors across all sites
export async function getAllCurrentVisitors(): Promise<CurrentVisitors[]> {
  const results = await Promise.all(
    Object.entries(FATHOM_SITES).map(async ([slug, site]) => {
      try {
        const data = await fathomFetch('current_visitors', {
          site_id: site.id,
        })
        return {
          pubSlug: slug,
          pubName: site.name,
          visitors: typeof data === 'object' ? (data.total ?? 0) : 0,
        }
      } catch {
        return { pubSlug: slug, pubName: site.name, visitors: 0 }
      }
    })
  )
  return results
}

// Get pageviews for a specific path on a site
export async function getPathStats(
  siteId: string,
  pathname: string,
  dateFrom: string,
  dateTo: string
): Promise<{ visits: number; pageviews: number; avgDuration: number }> {
  const data = await fathomFetch('aggregations', {
    entity: 'pageview',
    entity_id: siteId,
    aggregates: 'visits,pageviews,avg_duration',
    field_grouping: 'pathname',
    date_from: dateFrom,
    date_to: dateTo,
    filters: JSON.stringify([{ property: 'pathname', operator: 'is', value: pathname }]),
  })
  const row = Array.isArray(data) ? data[0] : data
  return {
    visits: parseInt(row?.visits ?? '0'),
    pageviews: parseInt(row?.pageviews ?? '0'),
    avgDuration: parseFloat(row?.avg_duration ?? '0'),
  }
}

// Map pub_slug to Fathom site ID
export function siteIdForPub(pubSlug: string): string | null {
  return FATHOM_SITES[pubSlug]?.id ?? null
}

// Build the pathname for a post (matches Next.js routing: /[beat]/[slug] or /[slug])
export function postPathname(beat: string | null, slug: string): string {
  return beat ? `/${beat}/${slug}` : `/${slug}`
}

// Fetch top pages across ALL sites and build a lookup map: "siteId:pathname" → pageviews
export async function getAllTopPagesMap(
  dateFrom: string,
  dateTo: string,
  limit = 50
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  const allPages = await Promise.all(
    Object.entries(FATHOM_SITES).map(async ([, site]) => {
      try {
        const pages = await getTopPages(site.id, dateFrom, dateTo, limit)
        return pages.map(p => ({ siteId: site.id, ...p }))
      } catch {
        return []
      }
    })
  )
  for (const pages of allPages) {
    for (const page of pages) {
      map.set(`${page.siteId}:${page.pathname}`, page.pageviews)
    }
  }
  return map
}

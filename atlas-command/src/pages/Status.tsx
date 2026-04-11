import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Activity, AlertTriangle, CheckCircle, Clock, Rocket, ExternalLink, Pencil, BookOpen, Users } from 'lucide-react'
import { formatDate } from '../lib/utils'
import HealthScores from '../components/HealthScores'

interface ScheduledPost {
  id: string
  title: string
  slug: string
  pub_date: string
  status: string
}

interface StaleHub {
  id: string
  title: string
  slug: string
  updated_at: string
  pub_name: string
}

interface StaleBeat {
  id: string
  beat_name: string
  beat_slug: string
  updated_at: string
  article_count: number
  pub_name: string
}

interface AuthorWorkload {
  author_id: string
  author_name: string
  posts_7d: number
  posts_30d: number
  editorial_items: number
}

export default function Status() {
  const scheduled = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async (): Promise<ScheduledPost[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, pub_date, status')
        .eq('status', 'scheduled')
        .order('pub_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  const staleHubs = useQuery({
    queryKey: ['stale-hubs'],
    queryFn: async (): Promise<StaleHub[]> => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 14)
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug, updated_at, publications!inner(name)')
        .not('hub_beat', 'is', null)
        .eq('status', 'published')
        .lt('updated_at', cutoff.toISOString())
        .order('updated_at', { ascending: true })
        .limit(20)
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        updated_at: row.updated_at,
        pub_name: row.publications?.name ?? '',
      }))
    },
  })

  const overdue = useQuery({
    queryKey: ['overdue-editorial'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10)
      const { data, error } = await supabase
        .from('editorial_calendar')
        .select('id, concept, target_date, status, publications!inner(name)')
        .lt('target_date', today)
        .not('status', 'in', '("published","killed")')
        .order('target_date', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        ...row,
        pub_name: row.publications?.name ?? '',
      }))
    },
  })

  const staleBeats = useQuery({
    queryKey: ['stale-beats'],
    queryFn: async (): Promise<StaleBeat[]> => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 14)
      const { data, error } = await supabase
        .from('beat_research')
        .select('id, beat_name, beat_slug, article_count, updated_at, publications!inner(name)')
        .lt('updated_at', cutoff.toISOString())
        .order('updated_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: row.id,
        beat_name: row.beat_name,
        beat_slug: row.beat_slug,
        article_count: row.article_count ?? 0,
        updated_at: row.updated_at,
        pub_name: row.publications?.name ?? '',
      }))
    },
  })

  const authorWorkload = useQuery({
    queryKey: ['author-workload'],
    queryFn: async (): Promise<AuthorWorkload[]> => {
      const now = new Date()
      const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30)

      // Get all authors
      const { data: authors, error: aErr } = await supabase
        .from('authors')
        .select('id, name')
        .order('name')
      if (aErr) throw aErr

      // Get post counts per author (7d and 30d)
      const { data: posts7d } = await supabase
        .from('posts')
        .select('author_id')
        .gte('pub_date', d7.toISOString())
        .eq('status', 'published')
      const { data: posts30d } = await supabase
        .from('posts')
        .select('author_id')
        .gte('pub_date', d30.toISOString())
        .eq('status', 'published')

      // Get active editorial items per author
      const { data: ecItems } = await supabase
        .from('editorial_calendar')
        .select('author_id')
        .not('status', 'in', '("published","killed")')

      const count7d = new Map<string, number>()
      const count30d = new Map<string, number>()
      const countEc = new Map<string, number>()

      for (const p of posts7d ?? []) {
        if (p.author_id) count7d.set(p.author_id, (count7d.get(p.author_id) ?? 0) + 1)
      }
      for (const p of posts30d ?? []) {
        if (p.author_id) count30d.set(p.author_id, (count30d.get(p.author_id) ?? 0) + 1)
      }
      for (const e of ecItems ?? []) {
        if (e.author_id) countEc.set(e.author_id, (countEc.get(e.author_id) ?? 0) + 1)
      }

      return (authors ?? []).map((a: any) => ({
        author_id: a.id,
        author_name: a.name,
        posts_7d: count7d.get(a.id) ?? 0,
        posts_30d: count30d.get(a.id) ?? 0,
        editorial_items: countEc.get(a.id) ?? 0,
      })).filter((a: AuthorWorkload) => a.posts_30d > 0 || a.editorial_items > 0)
    },
  })

  const cronHealth = scheduled.data?.length === 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity size={24} className="text-[var(--color-accent-hover)]" />
          Status & Alerts
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">System health, deployments, and attention items</p>
      </div>

      {/* Health indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className={`bg-[var(--color-surface)] border rounded-xl p-5 ${cronHealth ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {cronHealth ? <CheckCircle size={16} className="text-green-400" /> : <Clock size={16} className="text-yellow-400" />}
            <span className="text-sm font-semibold">pg_cron Scheduler</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            {cronHealth ? 'No pending scheduled posts — queue clear' : `${scheduled.data?.length} posts waiting to publish`}
          </p>
        </div>

        <div className={`bg-[var(--color-surface)] border rounded-xl p-5 ${(overdue.data?.length ?? 0) === 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {(overdue.data?.length ?? 0) === 0 ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}
            <span className="text-sm font-semibold">Editorial Deadlines</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            {(overdue.data?.length ?? 0) === 0 ? 'No overdue editorial items' : `${overdue.data?.length} items past target date`}
          </p>
        </div>

        <div className={`bg-[var(--color-surface)] border rounded-xl p-5 ${(staleHubs.data?.length ?? 0) === 0 ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {(staleHubs.data?.length ?? 0) === 0 ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-yellow-400" />}
            <span className="text-sm font-semibold">Hub Freshness</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            {(staleHubs.data?.length ?? 0) === 0 ? 'All hub pages updated within 14 days' : `${staleHubs.data?.length} hub pages stale (>14 days)`}
          </p>
        </div>

        <div className={`bg-[var(--color-surface)] border rounded-xl p-5 ${(staleBeats.data?.length ?? 0) === 0 ? 'border-green-500/30' : 'border-orange-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {(staleBeats.data?.length ?? 0) === 0 ? <CheckCircle size={16} className="text-green-400" /> : <BookOpen size={16} className="text-orange-400" />}
            <span className="text-sm font-semibold">Beat Research</span>
          </div>
          <p className="text-[12px] text-[var(--color-text-muted)]">
            {(staleBeats.data?.length ?? 0) === 0 ? 'All beat research updated within 14 days' : `${staleBeats.data?.length} beat files stale (>14 days)`}
          </p>
        </div>
      </div>

      {/* Vercel Deployments */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3 flex items-center gap-2">
          <Rocket size={14} className="text-[var(--color-accent-hover)]" /> Vercel Deployments
        </h2>
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Charlotte Mercury Atlas — Production</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">View build logs, deployment history, and domain settings</p>
          </div>
          <a
            href="https://vercel.com/mercury-local/mercury-local"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] text-xs font-semibold rounded-lg hover:bg-[var(--color-accent)]/20 transition-colors"
          >
            <ExternalLink size={12} /> Vercel Dashboard
          </a>
        </div>
      </div>

      {/* Overdue Editorial */}
      {overdue.data && overdue.data.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Overdue Editorial Items
          </h2>
          <div className="bg-[var(--color-surface)] border border-red-500/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Concept</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-36">Publication</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-24">Status</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-28">Target Date</th>
                </tr>
              </thead>
              <tbody>
                {overdue.data.map((item: any) => (
                  <tr key={item.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">{item.concept}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{item.pub_name}</td>
                    <td className="px-4 py-3 capitalize text-[var(--color-text-muted)]">{item.status}</td>
                    <td className="px-4 py-3 text-red-400">{formatDate(item.target_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduled Posts */}
      {scheduled.data && scheduled.data.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock size={14} /> Scheduled Posts
          </h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Title</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-36">Scheduled For</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.data.map((post) => (
                  <tr key={post.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">{post.title}</td>
                    <td className="px-4 py-3 text-blue-400">{formatDate(post.pub_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stale Hubs */}
      {staleHubs.data && staleHubs.data.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={14} /> Stale Hub Pages (&gt;14 days)
          </h2>
          <div className="bg-[var(--color-surface)] border border-yellow-500/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Hub Page</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-36">Publication</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-28">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {staleHubs.data.map((hub) => (
                  <tr key={hub.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/pages/${hub.id}`}
                        className="flex items-center gap-1.5 hover:text-[var(--color-accent-hover)] transition-colors"
                      >
                        <Pencil size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                        {hub.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{hub.pub_name}</td>
                    <td className="px-4 py-3 text-yellow-400">{formatDate(hub.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stale Beat Research */}
      {staleBeats.data && staleBeats.data.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-orange-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <BookOpen size={14} /> Stale Beat Research (&gt;14 days)
          </h2>
          <div className="bg-[var(--color-surface)] border border-orange-500/20 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Beat</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-36">Publication</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-24">Articles</th>
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-28">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {staleBeats.data.map((beat) => (
                  <tr key={beat.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={12} className="text-[var(--color-text-muted)] flex-shrink-0" />
                        {beat.beat_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{beat.pub_name}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{beat.article_count}</td>
                    <td className="px-4 py-3 text-orange-400">{formatDate(beat.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Publication Health Dashboard */}
      <div className="mb-8">
        <HealthScores />
      </div>

      {/* Author Workload */}
      {authorWorkload.data && authorWorkload.data.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users size={14} className="text-[var(--color-accent)]" /> Author Workload
          </h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold">Author</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-24">7 Days</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-24">30 Days</th>
                  <th className="text-right px-4 py-2.5 text-[11px] text-[var(--color-text-muted)] uppercase font-semibold w-24">In Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {authorWorkload.data.map((a) => (
                  <tr key={a.author_id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50">
                    <td className="px-4 py-3 font-medium">{a.author_name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={a.posts_7d >= 3 ? 'text-green-400' : a.posts_7d >= 1 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}>
                        {a.posts_7d}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={a.posts_30d >= 12 ? 'text-green-400' : a.posts_30d >= 4 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}>
                        {a.posts_30d}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--color-accent-hover)]">
                      {a.editorial_items}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

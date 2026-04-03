import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getDeployments, type Deployment } from '../lib/vercel'
import { Activity, AlertTriangle, CheckCircle, Clock, Rocket, GitCommit, ExternalLink } from 'lucide-react'
import { formatDate } from '../lib/utils'

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

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
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

  const deployments = useQuery({
    queryKey: ['deployments'],
    queryFn: getDeployments,
    refetchInterval: 300_000, // 5 min
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
      <div className="grid grid-cols-3 gap-4 mb-8">
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
      </div>

      {/* Vercel Deployments */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3 flex items-center gap-2">
          <Rocket size={14} className="text-[var(--color-accent-hover)]" /> Vercel Deployments
        </h2>
        {deployments.data && deployments.data.length > 0 ? (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            {deployments.data.slice(0, 10).map((d: Deployment) => (
              <div key={d.id} className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-2)]/50">
                <div className={`w-2 h-2 rounded-full shrink-0 ${d.state === 'READY' ? 'bg-green-400' : d.state === 'ERROR' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{d.commitMessage.split('\n')[0]}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                      <GitCommit size={10} /> {d.commitSha}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{d.commitRef}</span>
                    {d.target === 'production' && (
                      <span className="text-[9px] bg-green-400/10 text-green-400 px-1.5 py-0.5 rounded font-semibold">PROD</span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">{timeAgo(d.created)}</span>
                {d.inspectorUrl && (
                  <a href={d.inspectorUrl} target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-hover)]">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : deployments.isLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">Loading deployments...</p>
        ) : (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Vercel API proxy not configured. Add <code className="text-[var(--color-accent-hover)]">VERCEL_TOKEN</code> to .env and restart to see deployments.
            </p>
          </div>
        )}
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
        <div>
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
                  <tr key={hub.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-3">{hub.title}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{hub.pub_name}</td>
                    <td className="px-4 py-3 text-yellow-400">{formatDate(hub.updated_at)}</td>
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

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { getPublications, getRecentPosts, getEditorialCalendar } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { Sun, Moon, Download, Database, RefreshCw, CheckCircle, AlertTriangle, Clock, BookOpen, ExternalLink, Rocket, Pencil, Users } from 'lucide-react'
import { PUB_COLORS, PUB_SHORT, formatDate } from '../lib/utils'
import HealthScores from '../components/HealthScores'

// ---------- Theme management ----------
type Theme = 'dark' | 'light'

function getStoredTheme(): Theme {
  try {
    return (localStorage.getItem('atlas-theme') as Theme) ?? 'dark'
  } catch {
    return 'dark'
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem('atlas-theme', theme)
  } catch {
    // ignore
  }
}

// ---------- CSV Export ----------
function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.map(escape).join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ]
  return lines.join('\n')
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'system', label: 'System' },
] as const

type TabId = typeof TABS[number]['id']

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const activeTab = (params.get('tab') as TabId) || 'general'
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [exporting, setExporting] = useState<string | null>(null)

  const { data: publications } = useQuery({
    queryKey: ['publications'],
    queryFn: getPublications,
  })

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  function setTab(tab: TabId) {
    setParams({ tab })
  }

  async function exportPosts() {
    setExporting('posts')
    try {
      const posts = await getRecentPosts(5000)
      const csv = toCSV(posts.map(p => ({
        title: p.title,
        slug: p.slug,
        status: p.status,
        beat: p.beat,
        pub_date: p.pub_date,
        publication: p.pub_name,
        author: p.author_name,
      })))
      downloadCSV(`mercury-posts-${new Date().toISOString().split('T')[0]}.csv`, csv)
    } finally {
      setExporting(null)
    }
  }

  async function exportEditorial() {
    setExporting('editorial')
    try {
      const items = await getEditorialCalendar()
      const csv = toCSV(items.map(i => ({
        concept: i.concept,
        status: i.status,
        target_date: i.target_date,
        priority: i.priority,
        beat: i.beat,
        publication: i.pub_name,
        author: i.author_name,
        notes: i.notes,
      })))
      downloadCSV(`mercury-editorial-${new Date().toISOString().split('T')[0]}.csv`, csv)
    } finally {
      setExporting(null)
    }
  }

  async function exportActivity() {
    setExporting('activity')
    try {
      const { data } = await supabase
        .from('activity_log')
        .select('created_at, action, entity_type, entity_title, actor, details')
        .order('created_at', { ascending: false })
        .limit(5000)

      const csv = toCSV((data ?? []).map((row: Record<string, unknown>) => ({
        timestamp: row.created_at,
        action: row.action,
        entity_type: row.entity_type,
        entity_title: row.entity_title,
        actor: row.actor,
        details: JSON.stringify(row.details),
      })))
      downloadCSV(`mercury-activity-${new Date().toISOString().split('T')[0]}.csv`, csv)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Configuration, data tools, and system health</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[var(--color-accent-hover)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent-hover)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="max-w-3xl space-y-6">
          {/* Appearance */}
          <Section title="Appearance">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px]">Theme</p>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">
                  Currently using <span className="font-medium">{theme}</span> mode
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent-hover)] transition-colors"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </Section>

          {/* Data Export */}
          <Section title="Data Export" subtitle="Export data as CSV for analysis in Excel, Sheets, or other tools.">
            <div className="space-y-2">
              <ExportRow label="All Posts" description="Title, slug, status, beat, date, publication, author" loading={exporting === 'posts'} onClick={exportPosts} />
              <ExportRow label="Editorial Calendar" description="Concepts, status, dates, priority, assignments" loading={exporting === 'editorial'} onClick={exportEditorial} />
              <ExportRow label="Activity Log" description="All logged actions with timestamps and details" loading={exporting === 'activity'} onClick={exportActivity} />
            </div>
          </Section>

          {/* Publications */}
          <Section title="Publications" subtitle="Connected publications and their domains.">
            <div className="space-y-2">
              {publications?.filter(p => p.domain).map(pub => (
                <div key={pub.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: PUB_COLORS[pub.slug] ?? '#6366f1' }}
                    >
                      {(PUB_SHORT[pub.slug] ?? pub.slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium">{pub.name}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">{pub.domain}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* System Info */}
          <Section title="System">
            <div className="space-y-2 text-[13px]">
              <InfoRow label="Version" value="Phase 16 · v0.16.0" />
              <InfoRow label="Stack" value="Vite + React 18 + TypeScript + Tailwind v4" />
              <InfoRow label="Data" value="Supabase (Pro)" />
              <InfoRow label="Hosting" value="Vercel" />
              <InfoRow label="Publications" value={`${publications?.filter(p => p.domain).length ?? '...'} active`} />
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'system' && <SystemTab />}
    </div>
  )
}

/* ─── System Tab (absorbed from Status page) ─── */

function SystemTab() {
  const scheduled = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: async () => {
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
    queryFn: async () => {
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
        id: row.id, title: row.title, slug: row.slug,
        updated_at: row.updated_at, pub_name: row.publications?.name ?? '',
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
      return (data ?? []).map((row: any) => ({ ...row, pub_name: row.publications?.name ?? '' }))
    },
  })

  const staleBeats = useQuery({
    queryKey: ['stale-beats'],
    queryFn: async () => {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 14)
      const { data, error } = await supabase
        .from('beat_research')
        .select('id, beat_name, beat_slug, article_count, updated_at, publications!inner(name)')
        .lt('updated_at', cutoff.toISOString())
        .order('updated_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row: any) => ({
        id: row.id, beat_name: row.beat_name, beat_slug: row.beat_slug,
        article_count: row.article_count ?? 0, updated_at: row.updated_at,
        pub_name: row.publications?.name ?? '',
      }))
    },
  })

  const authorWorkload = useQuery({
    queryKey: ['author-workload'],
    queryFn: async () => {
      const now = new Date()
      const d7 = new Date(now); d7.setDate(d7.getDate() - 7)
      const d30 = new Date(now); d30.setDate(d30.getDate() - 30)

      const { data: authors, error: aErr } = await supabase.from('authors').select('id, name').order('name')
      if (aErr) throw aErr

      const { data: posts7d } = await supabase.from('posts').select('author_id').gte('pub_date', d7.toISOString()).eq('status', 'published')
      const { data: posts30d } = await supabase.from('posts').select('author_id').gte('pub_date', d30.toISOString()).eq('status', 'published')
      const { data: ecItems } = await supabase.from('editorial_calendar').select('author_id').not('status', 'in', '("published","killed")')

      const count7d = new Map<string, number>()
      const count30d = new Map<string, number>()
      const countEc = new Map<string, number>()
      for (const p of posts7d ?? []) { if (p.author_id) count7d.set(p.author_id, (count7d.get(p.author_id) ?? 0) + 1) }
      for (const p of posts30d ?? []) { if (p.author_id) count30d.set(p.author_id, (count30d.get(p.author_id) ?? 0) + 1) }
      for (const e of ecItems ?? []) { if (e.author_id) countEc.set(e.author_id, (countEc.get(e.author_id) ?? 0) + 1) }

      return (authors ?? [])
        .map((a: any) => ({
          author_id: a.id, author_name: a.name,
          posts_7d: count7d.get(a.id) ?? 0, posts_30d: count30d.get(a.id) ?? 0,
          editorial_items: countEc.get(a.id) ?? 0,
        }))
        .filter((a: any) => a.posts_30d > 0 || a.editorial_items > 0)
    },
  })

  const cronHealth = scheduled.data?.length === 0

  return (
    <div className="space-y-6">
      {/* Health indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthCard
          ok={cronHealth}
          icon={cronHealth ? CheckCircle : Clock}
          title="pg_cron"
          detail={cronHealth ? 'Queue clear' : `${scheduled.data?.length} posts queued`}
          color={cronHealth ? 'green' : 'yellow'}
        />
        <HealthCard
          ok={(overdue.data?.length ?? 0) === 0}
          icon={(overdue.data?.length ?? 0) === 0 ? CheckCircle : AlertTriangle}
          title="Deadlines"
          detail={(overdue.data?.length ?? 0) === 0 ? 'No overdue items' : `${overdue.data?.length} overdue`}
          color={(overdue.data?.length ?? 0) === 0 ? 'green' : 'red'}
        />
        <HealthCard
          ok={(staleHubs.data?.length ?? 0) === 0}
          icon={(staleHubs.data?.length ?? 0) === 0 ? CheckCircle : AlertTriangle}
          title="Hub Freshness"
          detail={(staleHubs.data?.length ?? 0) === 0 ? 'All fresh' : `${staleHubs.data?.length} stale`}
          color={(staleHubs.data?.length ?? 0) === 0 ? 'green' : 'yellow'}
        />
        <HealthCard
          ok={(staleBeats.data?.length ?? 0) === 0}
          icon={(staleBeats.data?.length ?? 0) === 0 ? CheckCircle : BookOpen}
          title="Beat Research"
          detail={(staleBeats.data?.length ?? 0) === 0 ? 'All fresh' : `${staleBeats.data?.length} stale`}
          color={(staleBeats.data?.length ?? 0) === 0 ? 'green' : 'orange'}
        />
      </div>

      {/* Vercel */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket size={16} className="text-[var(--color-accent-hover)]" />
          <div>
            <p className="text-[13px] font-medium">Vercel — Production</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">Build logs, deployment history, domains</p>
          </div>
        </div>
        <a
          href="https://vercel.com/mercury-local/mercury-local"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)]/10 text-[var(--color-accent-hover)] text-[12px] font-medium rounded-lg hover:bg-[var(--color-accent)]/20 transition-colors"
        >
          <ExternalLink size={12} /> Dashboard
        </a>
      </div>

      {/* Overdue editorial */}
      {overdue.data && overdue.data.length > 0 && (
        <Section title="Overdue Editorial" titleColor="text-red-400">
          <div className="bg-[var(--color-bg)] border border-red-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Concept</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-32">Publication</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-24">Status</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-28">Target</th>
                </tr>
              </thead>
              <tbody>
                {overdue.data.map((item: any) => (
                  <tr key={item.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2.5">{item.concept}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{item.pub_name}</td>
                    <td className="px-4 py-2.5 capitalize text-[var(--color-text-muted)]">{item.status}</td>
                    <td className="px-4 py-2.5 text-red-400">{formatDate(item.target_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Scheduled posts */}
      {scheduled.data && scheduled.data.length > 0 && (
        <Section title="Scheduled Posts" titleColor="text-blue-400">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Title</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-32">Scheduled For</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.data.map((post: any) => (
                  <tr key={post.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2.5">{post.title}</td>
                    <td className="px-4 py-2.5 text-blue-400">{formatDate(post.pub_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Stale hubs */}
      {staleHubs.data && staleHubs.data.length > 0 && (
        <Section title="Stale Hub Pages" titleColor="text-yellow-400">
          <div className="bg-[var(--color-bg)] border border-yellow-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Hub Page</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-32">Publication</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-28">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {staleHubs.data.map((hub: any) => (
                  <tr key={hub.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2.5">
                      <Link to={`/pages/${hub.id}`} className="flex items-center gap-1.5 hover:text-[var(--color-accent-hover)] transition-colors">
                        <Pencil size={12} className="text-[var(--color-text-muted)]" />
                        {hub.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{hub.pub_name}</td>
                    <td className="px-4 py-2.5 text-yellow-400">{formatDate(hub.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Stale beats */}
      {staleBeats.data && staleBeats.data.length > 0 && (
        <Section title="Stale Beat Research" titleColor="text-orange-400">
          <div className="bg-[var(--color-bg)] border border-orange-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Beat</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-32">Publication</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-20">Articles</th>
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-28">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {staleBeats.data.map((beat: any) => (
                  <tr key={beat.id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2.5"><BookOpen size={12} className="inline mr-1.5 text-[var(--color-text-muted)]" />{beat.beat_name}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{beat.pub_name}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{beat.article_count}</td>
                    <td className="px-4 py-2.5 text-orange-400">{formatDate(beat.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Publication Health */}
      <div className="mt-2">
        <HealthScores />
      </div>

      {/* Author Workload */}
      {authorWorkload.data && authorWorkload.data.length > 0 && (
        <Section title="Author Workload">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[var(--color-surface-2)]">
                  <th className="text-left px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Author</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-20">7d</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-20">30d</th>
                  <th className="text-right px-4 py-2 text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium w-24">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {authorWorkload.data.map((a: any) => (
                  <tr key={a.author_id} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2.5 font-medium">{a.author_name}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={a.posts_7d >= 3 ? 'text-green-400' : a.posts_7d >= 1 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}>{a.posts_7d}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={a.posts_30d >= 12 ? 'text-green-400' : a.posts_30d >= 4 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}>{a.posts_30d}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-[var(--color-accent-hover)]">{a.editorial_items}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  )
}

/* ─── Shared components ─── */

function Section({ title, subtitle, titleColor, children }: {
  title: string
  subtitle?: string
  titleColor?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <h2 className={`text-[13px] font-semibold mb-3 ${titleColor ?? ''}`}>{title}</h2>
      {subtitle && <p className="text-[12px] text-[var(--color-text-muted)] mb-3 -mt-1">{subtitle}</p>}
      {children}
    </section>
  )
}

function HealthCard({ ok, icon: Icon, title, detail, color }: {
  ok: boolean | undefined
  icon: typeof CheckCircle
  title: string
  detail: string
  color: string
}) {
  const borderColor = color === 'green' ? 'border-green-500/30' :
    color === 'red' ? 'border-red-500/30' :
    color === 'orange' ? 'border-orange-500/30' : 'border-yellow-500/30'
  const iconColor = color === 'green' ? 'text-green-400' :
    color === 'red' ? 'text-red-400' :
    color === 'orange' ? 'text-orange-400' : 'text-yellow-400'

  return (
    <div className={`bg-[var(--color-surface)] border rounded-xl p-4 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className={iconColor} />
        <span className="text-[13px] font-medium">{title}</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)]">{detail}</p>
    </div>
  )
}

function ExportRow({ label, description, loading, onClick }: {
  label: string
  description: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[12px] text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
      >
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
        {loading ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span>{value}</span>
    </div>
  )
}

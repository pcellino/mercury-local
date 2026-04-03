import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublications, getRecentPosts, getEditorialCalendar } from '../lib/queries'
import { supabase } from '../lib/supabase'
import { Sun, Moon, Download, Database, RefreshCw } from 'lucide-react'
import { PUB_COLORS, PUB_SHORT } from '../lib/utils'

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

export default function Settings() {
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Atlas Command configuration and data tools</p>
      </div>

      {/* Appearance */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Theme</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Currently using <span className="font-medium">{theme}</span> mode
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </section>

      {/* Data Export */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Download size={16} className="text-[var(--color-accent-hover)]" />
          Data Export
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Export data as CSV files for analysis in Excel, Google Sheets, or other tools.
        </p>
        <div className="space-y-3">
          <ExportRow
            label="All Posts"
            description="Title, slug, status, beat, date, publication, author"
            loading={exporting === 'posts'}
            onClick={exportPosts}
          />
          <ExportRow
            label="Editorial Calendar"
            description="Concepts, status, dates, priority, assignments"
            loading={exporting === 'editorial'}
            onClick={exportEditorial}
          />
          <ExportRow
            label="Activity Log"
            description="All logged actions with timestamps and details"
            loading={exporting === 'activity'}
            onClick={exportActivity}
          />
        </div>
      </section>

      {/* Publications Overview */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Database size={16} className="text-[var(--color-accent-hover)]" />
          Publications
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Connected publications and their configuration.
        </p>
        <div className="space-y-2">
          {publications?.filter(p => p.domain).map(pub => (
            <div
              key={pub.id}
              className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: PUB_COLORS[pub.slug] ?? '#6366f1' }}
                >
                  {(PUB_SHORT[pub.slug] ?? pub.slug.slice(0, 2).toUpperCase()).slice(0, 2)}
                </span>
                <div>
                  <p className="text-sm font-medium">{pub.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{pub.domain}</p>
                </div>
              </div>
              <a
                href={`/publications/${pub.slug}`}
                className="text-xs text-[var(--color-accent-hover)] hover:underline"
              >
                View →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* System Info */}
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">System</h2>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Version</span>
            <span>Phase 11 · v0.11.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Stack</span>
            <span>Vite + React 18 + TypeScript + Tailwind v4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Data</span>
            <span>Supabase (Pro)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Hosting</span>
            <span>Vercel</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Publications</span>
            <span>{publications?.filter(p => p.domain).length ?? '...'} active</span>
          </div>
        </div>
      </section>
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
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
      >
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
        {loading ? 'Exporting...' : 'Export CSV'}
      </button>
    </div>
  )
}

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export function statusColor(status: string): string {
  switch (status) {
    case 'published': return 'text-green-400 bg-green-400/10'
    case 'scheduled': return 'text-blue-400 bg-blue-400/10'
    case 'draft': return 'text-yellow-400 bg-yellow-400/10'
    case 'concept': return 'text-purple-400 bg-purple-400/10'
    case 'assigned': return 'text-cyan-400 bg-cyan-400/10'
    case 'drafting': return 'text-orange-400 bg-orange-400/10'
    case 'review': return 'text-amber-400 bg-amber-400/10'
    case 'killed': return 'text-red-400 bg-red-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

export const PUB_COLORS: Record<string, string> = {
  'charlotte-mercury': '#6366f1',
  'farmington-mercury': '#22c55e',
  'strolling-ballantyne': '#f97316',
  'strolling-firethorne': '#c2724e',
  'grand-national-today': '#ef4444',
  'mercury-local': '#3b82f6',
  'peter-cellino': '#8b5cf6',
  'queen-city-garage': '#eab308',
}

export const PUB_SHORT: Record<string, string> = {
  'charlotte-mercury': 'CLT',
  'farmington-mercury': 'FM',
  'strolling-ballantyne': 'SB',
  'strolling-firethorne': 'SF',
  'grand-national-today': 'GNT',
  'mercury-local': 'ML',
  'peter-cellino': 'PC',
  'queen-city-garage': 'QCG',
}

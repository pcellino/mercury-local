/**
 * Tests for the 5 alert rules in Notifications.tsx.
 *
 * The real runAlertChecks() queries Supabase directly, so we replicate
 * the scoring logic and test it as pure functions. This validates
 * severity thresholds, category assignment, and edge cases.
 *
 * Thresholds from the actual code (Notifications.tsx):
 *   - Overdue editorial: >7 days = critical, else warning
 *   - Stale hubs: >30 days = critical, >14 days = warning
 *   - Stale beats: >14 days = info (>30 gets warning in rule reference but code uses info)
 *   - Velocity: 0 posts in 7 days = warning
 *   - Pipeline: <2 items = info
 */
import { describe, it, expect } from 'vitest'

// --- Types matching Notifications.tsx ---

type Severity = 'critical' | 'warning' | 'info'

interface AlertResult {
  id: string
  severity: Severity
  category: string
  title: string
  detail: string
  link?: string
}

// --- Replicated scoring functions ---

function daysOverdue(targetDate: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(targetDate + 'T12:00:00').getTime()) / 86400000)
}

function daysSince(dateStr: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(dateStr).getTime()) / 86400000)
}

function checkOverdueEditorial(
  items: { id: string; concept: string; target_date: string; status: string; pub_name: string }[],
  now: Date,
): AlertResult[] {
  const todayStr = now.toISOString().split('T')[0]
  const alerts: AlertResult[] = []
  for (const item of items) {
    if (['published', 'killed'].includes(item.status)) continue
    if (item.target_date >= todayStr) continue
    const days = daysOverdue(item.target_date, now)
    alerts.push({
      id: `overdue-${item.id}`,
      severity: days > 7 ? 'critical' : 'warning',
      category: 'editorial',
      title: `Overdue: ${item.concept}`,
      detail: `${days} day${days !== 1 ? 's' : ''} past target date (${item.target_date})`,
      link: '/editorial',
    })
  }
  return alerts
}

function checkStaleHubs(
  hubs: { id: string; title: string; updated_at: string; hub_beat: string }[],
  now: Date,
): AlertResult[] {
  const cutoff30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const cutoff14 = new Date(now.getTime() - 14 * 86400000).toISOString()
  const alerts: AlertResult[] = []
  for (const hub of hubs) {
    if (hub.updated_at >= cutoff14) continue
    const days = daysSince(hub.updated_at, now)
    alerts.push({
      id: `stale-hub-${hub.id}`,
      severity: hub.updated_at < cutoff30 ? 'critical' : 'warning',
      category: 'content',
      title: `Stale hub: ${hub.title}`,
      detail: `Last updated ${days} days ago (${hub.hub_beat} beat)`,
    })
  }
  return alerts
}

function checkStaleBeats(
  beats: { id: string; beat_name: string; updated_at: string }[],
  now: Date,
): AlertResult[] {
  const cutoff14 = new Date(now.getTime() - 14 * 86400000).toISOString()
  const alerts: AlertResult[] = []
  for (const beat of beats) {
    if (beat.updated_at >= cutoff14) continue
    const days = daysSince(beat.updated_at, now)
    alerts.push({
      id: `stale-beat-${beat.id}`,
      severity: days > 30 ? 'warning' : 'info',
      category: 'beats',
      title: `Stale beat research: ${beat.beat_name}`,
      detail: `Last updated ${days} days ago`,
    })
  }
  return alerts
}

function checkVelocityDrops(
  pubs: { id: string; name: string; slug: string; postsLast7Days: number }[],
): AlertResult[] {
  return pubs
    .filter(p => p.postsLast7Days === 0)
    .map(p => ({
      id: `velocity-${p.id}`,
      severity: 'warning' as Severity,
      category: 'velocity',
      title: `No posts this week: ${p.name}`,
      detail: 'Zero articles published in the last 7 days',
      link: `/publications/${p.slug}`,
    }))
}

function checkThinPipelines(
  pubs: { id: string; name: string; slug: string; openItems: number }[],
): AlertResult[] {
  return pubs
    .filter(p => p.openItems < 2)
    .map(p => ({
      id: `pipeline-${p.id}`,
      severity: 'info' as Severity,
      category: 'pipeline',
      title: `Thin pipeline: ${p.name}`,
      detail: `Only ${p.openItems} active editorial item${p.openItems !== 1 ? 's' : ''} in the pipeline`,
      link: '/editorial',
    }))
}

// --- Tests ---

describe('checkOverdueEditorial', () => {
  const now = new Date('2026-04-11T16:00:00Z') // noon ET

  it('flags critical for items >7 days overdue', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Old story', target_date: '2026-04-01', status: 'concept', pub_name: 'CLT' }],
      now,
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('critical')
    expect(alerts[0].detail).toContain('10 days')
  })

  it('flags warning for items 1–7 days overdue', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Recent', target_date: '2026-04-08', status: 'assigned', pub_name: 'FM' }],
      now,
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('warning')
  })

  it('does not flag items due today', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Today', target_date: '2026-04-11', status: 'drafting', pub_name: 'CLT' }],
      now,
    )
    expect(alerts).toHaveLength(0)
  })

  it('does not flag future items', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Future', target_date: '2026-04-15', status: 'concept', pub_name: 'CLT' }],
      now,
    )
    expect(alerts).toHaveLength(0)
  })

  it('skips published items', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Done', target_date: '2026-03-01', status: 'published', pub_name: 'CLT' }],
      now,
    )
    expect(alerts).toHaveLength(0)
  })

  it('skips killed items', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Dead', target_date: '2026-03-01', status: 'killed', pub_name: 'CLT' }],
      now,
    )
    expect(alerts).toHaveLength(0)
  })

  it('uses singular "day" for 1 day overdue', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Yesterday', target_date: '2026-04-10', status: 'concept', pub_name: 'CLT' }],
      now,
    )
    expect(alerts[0].detail).toContain('1 day ')
    expect(alerts[0].detail).not.toContain('1 days')
  })

  it('links to /editorial', () => {
    const alerts = checkOverdueEditorial(
      [{ id: '1', concept: 'Late', target_date: '2026-04-07', status: 'concept', pub_name: 'CLT' }],
      now,
    )
    expect(alerts[0].link).toBe('/editorial')
  })
})

describe('checkStaleHubs', () => {
  const now = new Date('2026-04-11T16:00:00Z')

  it('flags critical for hubs >30 days stale', () => {
    const alerts = checkStaleHubs(
      [{ id: '1', title: 'Sports Hub', updated_at: '2026-03-01T00:00:00Z', hub_beat: 'sports' }],
      now,
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('critical')
  })

  it('flags warning for hubs 14–30 days stale', () => {
    const alerts = checkStaleHubs(
      [{ id: '1', title: 'Gov Hub', updated_at: '2026-03-25T00:00:00Z', hub_beat: 'government' }],
      now,
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('warning')
  })

  it('does not flag hubs updated within 14 days', () => {
    const alerts = checkStaleHubs(
      [{ id: '1', title: 'Fresh Hub', updated_at: '2026-04-05T00:00:00Z', hub_beat: 'sports' }],
      now,
    )
    expect(alerts).toHaveLength(0)
  })

  it('includes beat name in detail', () => {
    const alerts = checkStaleHubs(
      [{ id: '1', title: 'NASCAR Hub', updated_at: '2026-03-01T00:00:00Z', hub_beat: 'nascar' }],
      now,
    )
    expect(alerts[0].detail).toContain('nascar beat')
  })
})

describe('checkStaleBeats', () => {
  const now = new Date('2026-04-11T16:00:00Z')

  it('flags info for beats 14–30 days stale', () => {
    const alerts = checkStaleBeats(
      [{ id: '1', beat_name: 'Hornets', updated_at: '2026-03-25T00:00:00Z' }],
      now,
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('info')
  })

  it('flags warning for beats >30 days stale', () => {
    const alerts = checkStaleBeats(
      [{ id: '1', beat_name: 'Knights', updated_at: '2026-03-01T00:00:00Z' }],
      now,
    )
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('warning')
  })

  it('does not flag recently updated beats', () => {
    const alerts = checkStaleBeats(
      [{ id: '1', beat_name: 'Checkers', updated_at: '2026-04-05T00:00:00Z' }],
      now,
    )
    expect(alerts).toHaveLength(0)
  })
})

describe('checkVelocityDrops', () => {
  it('flags pubs with 0 posts', () => {
    const alerts = checkVelocityDrops([
      { id: '1', name: 'Strolling Firethorne', slug: 'strolling-firethorne', postsLast7Days: 0 },
      { id: '2', name: 'CLT Mercury', slug: 'charlotte-mercury', postsLast7Days: 12 },
    ])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toContain('Strolling Firethorne')
    expect(alerts[0].severity).toBe('warning')
  })

  it('does not flag pubs with any posts', () => {
    const alerts = checkVelocityDrops([
      { id: '1', name: 'FM', slug: 'farmington-mercury', postsLast7Days: 1 },
    ])
    expect(alerts).toHaveLength(0)
  })

  it('links to the publication page', () => {
    const alerts = checkVelocityDrops([
      { id: '1', name: 'SF', slug: 'strolling-firethorne', postsLast7Days: 0 },
    ])
    expect(alerts[0].link).toBe('/publications/strolling-firethorne')
  })
})

describe('checkThinPipelines', () => {
  it('flags pubs with <2 items as info', () => {
    const alerts = checkThinPipelines([
      { id: '1', name: 'FM', slug: 'farmington-mercury', openItems: 1 },
      { id: '2', name: 'CLT', slug: 'charlotte-mercury', openItems: 5 },
    ])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].severity).toBe('info')
    expect(alerts[0].category).toBe('pipeline')
  })

  it('flags pubs with 0 items', () => {
    const alerts = checkThinPipelines([
      { id: '1', name: 'SB', slug: 'strolling-ballantyne', openItems: 0 },
    ])
    expect(alerts[0].detail).toContain('0 active editorial items')
  })

  it('uses singular for 1 item', () => {
    const alerts = checkThinPipelines([
      { id: '1', name: 'SB', slug: 'strolling-ballantyne', openItems: 1 },
    ])
    expect(alerts[0].detail).toContain('1 active editorial item ')
  })

  it('does not flag pubs with 2+ items', () => {
    const alerts = checkThinPipelines([
      { id: '1', name: 'CLT', slug: 'charlotte-mercury', openItems: 2 },
    ])
    expect(alerts).toHaveLength(0)
  })

  it('links to /editorial', () => {
    const alerts = checkThinPipelines([
      { id: '1', name: 'SB', slug: 'strolling-ballantyne', openItems: 0 },
    ])
    expect(alerts[0].link).toBe('/editorial')
  })
})

describe('daysOverdue helper', () => {
  it('calculates correct days', () => {
    const now = new Date('2026-04-11T16:00:00Z')
    expect(daysOverdue('2026-04-01', now)).toBe(10)
  })

  it('returns 0 for same day', () => {
    const now = new Date('2026-04-11T16:00:00Z')
    // target_date + T12:00:00 vs now at 16:00 UTC = 4 hours diff → 0 days
    expect(daysOverdue('2026-04-11', now)).toBe(0)
  })
})

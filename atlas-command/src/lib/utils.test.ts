/**
 * Tests for utility functions in utils.ts.
 * Covers todayET (timezone), formatDate, formatRelative, statusColor, and PUB_* mappings.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  todayET, formatDate, formatRelative, statusColor,
  PUB_COLORS, PUB_SHORT, PUB_DOMAINS, cn,
} from './utils'

// ---------- todayET ----------

describe('todayET', () => {
  afterEach(() => { vi.useRealTimers() })

  it('returns YYYY-MM-DD format', () => {
    expect(todayET()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns ET date at 11 PM ET (3 AM UTC next day during EDT)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-12T03:00:00Z'))
    expect(todayET()).toBe('2026-04-11')
  })

  it('rolls over at midnight ET (4 AM UTC during EDT)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-12T04:00:00Z'))
    expect(todayET()).toBe('2026-04-12')
  })

  it('handles EST (UTC-5) correctly', () => {
    vi.useFakeTimers()
    // Jan 15, 04:30 UTC = Jan 14, 11:30 PM EST
    vi.setSystemTime(new Date('2026-01-15T04:30:00Z'))
    expect(todayET()).toBe('2026-01-14')
  })

  it('handles year boundary', () => {
    vi.useFakeTimers()
    // Jan 1 04:59 UTC = Dec 31 11:59 PM EST
    vi.setSystemTime(new Date('2027-01-01T04:59:00Z'))
    expect(todayET()).toBe('2026-12-31')
  })
})

// ---------- formatDate ----------

describe('formatDate', () => {
  it('returns em dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('formats date in en-US locale', () => {
    const result = formatDate('2026-04-03T12:00:00Z')
    // "Apr 3, 2026" — exact format depends on locale but should contain these parts
    expect(result).toContain('2026')
    expect(result).toContain('Apr')
    expect(result).toContain('3')
  })
})

// ---------- formatRelative ----------

describe('formatRelative', () => {
  it('returns em dash for null', () => {
    expect(formatRelative(null)).toBe('—')
  })

  it('returns "just now" for recent timestamps', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatRelative(fiveMinAgo)).toBe('just now')
  })

  it('returns "Xh ago" for same-day timestamps', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(threeHoursAgo)).toBe('3h ago')
  })

  it('returns "yesterday" for ~24h ago', () => {
    const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(yesterday)).toBe('yesterday')
  })

  it('returns "Xd ago" for 2-6 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(threeDaysAgo)).toBe('3d ago')
  })

  it('falls back to formatted date for 7+ days', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelative(twoWeeksAgo)
    // Should contain a year (formatted date), not "14d ago"
    expect(result).toContain('2026')
  })
})

// ---------- statusColor ----------

describe('statusColor', () => {
  it('returns green classes for published', () => {
    expect(statusColor('published')).toContain('green')
  })

  it('returns red classes for killed', () => {
    expect(statusColor('killed')).toContain('red')
  })

  it('returns slate classes for unknown status', () => {
    expect(statusColor('unknown-status')).toContain('slate')
  })

  it.each(['published', 'idea', 'in-progress', 'scheduled', 'draft', 'killed'] as const)(
    'returns non-empty string for "%s"',
    (status) => {
      expect(statusColor(status).length).toBeGreaterThan(0)
    },
  )
})

// ---------- PUB_ mappings ----------

describe('PUB_COLORS', () => {
  it('has entries for all core publications', () => {
    const expected = ['charlotte-mercury', 'farmington-mercury', 'strolling-ballantyne',
      'strolling-firethorne', 'grand-national-today', 'mercury-local', 'peter-cellino']
    for (const slug of expected) {
      expect(PUB_COLORS[slug], `missing color for ${slug}`).toBeDefined()
    }
  })

  it('all values are valid hex colors', () => {
    for (const [slug, color] of Object.entries(PUB_COLORS)) {
      expect(color, `${slug} should be hex`).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('PUB_SHORT', () => {
  it('maps charlotte-mercury to CLT', () => {
    expect(PUB_SHORT['charlotte-mercury']).toBe('CLT')
  })

  it('maps grand-national-today to GNT', () => {
    expect(PUB_SHORT['grand-national-today']).toBe('GNT')
  })

  it('all abbreviations are 2-3 chars', () => {
    for (const [slug, abbr] of Object.entries(PUB_SHORT)) {
      expect(abbr.length, `${slug} abbreviation length`).toBeGreaterThanOrEqual(2)
      expect(abbr.length, `${slug} abbreviation length`).toBeLessThanOrEqual(3)
    }
  })
})

describe('PUB_DOMAINS', () => {
  it('maps charlotte-mercury to cltmercury.com', () => {
    expect(PUB_DOMAINS['charlotte-mercury']).toBe('cltmercury.com')
  })

  it('all domains have TLD', () => {
    for (const [slug, domain] of Object.entries(PUB_DOMAINS)) {
      expect(domain, `${slug} domain should have .com`).toContain('.')
    }
  })
})

// ---------- cn (clsx + twMerge) ----------

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible')
    expect(result).toBe('base visible')
    expect(result).not.toContain('hidden')
  })

  it('deduplicates Tailwind conflicts', () => {
    // twMerge should keep the last conflicting utility
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })
})

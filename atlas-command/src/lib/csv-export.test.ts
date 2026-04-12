/**
 * Tests for the CSV export logic from Settings.tsx.
 *
 * toCSV and its inner `escape` function are defined inside Settings.tsx.
 * We replicate them here for isolated testing. When these functions are
 * extracted to a shared utility, update the imports.
 */
import { describe, it, expect } from 'vitest'

// --- Replicated from Settings.tsx ---

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

// --- Tests ---

describe('CSV escape', () => {
  // Test via toCSV since escape is a closure

  it('leaves plain strings unquoted', () => {
    const csv = toCSV([{ name: 'Hello' }])
    expect(csv).toBe('name\nHello')
  })

  it('quotes fields containing commas', () => {
    const csv = toCSV([{ place: 'Charlotte, NC' }])
    expect(csv).toBe('place\n"Charlotte, NC"')
  })

  it('escapes double quotes inside fields', () => {
    const csv = toCSV([{ quote: 'He said "hello"' }])
    expect(csv).toBe('quote\n"He said ""hello"""')
  })

  it('quotes fields containing newlines', () => {
    const csv = toCSV([{ text: 'Line 1\nLine 2' }])
    expect(csv).toBe('text\n"Line 1\nLine 2"')
  })

  it('converts null to empty string', () => {
    const csv = toCSV([{ val: null }])
    expect(csv).toBe('val\n')
  })

  it('converts undefined to empty string', () => {
    const csv = toCSV([{ val: undefined }])
    expect(csv).toBe('val\n')
  })

  it('converts numbers to strings', () => {
    const csv = toCSV([{ count: 42 }])
    expect(csv).toBe('count\n42')
  })

  it('converts booleans to strings', () => {
    const csv = toCSV([{ active: true }])
    expect(csv).toBe('active\ntrue')
  })
})

describe('toCSV', () => {
  it('returns empty string for empty array', () => {
    expect(toCSV([])).toBe('')
  })

  it('generates header row from first object keys', () => {
    const csv = toCSV([{ title: 'A', status: 'published' }])
    const firstLine = csv.split('\n')[0]
    expect(firstLine).toBe('title,status')
  })

  it('generates correct data rows', () => {
    const csv = toCSV([
      { title: 'Hornets Win', status: 'published', beat: 'sports' },
      { title: 'Council Meets', status: 'draft', beat: 'government' },
    ])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('title,status,beat')
    expect(lines[1]).toBe('Hornets Win,published,sports')
    expect(lines[2]).toBe('Council Meets,draft,government')
  })

  it('handles missing keys in subsequent rows', () => {
    const csv = toCSV([
      { title: 'First', status: 'published' },
      { title: 'Second' } as any, // no status key
    ])
    const lines = csv.split('\n')
    expect(lines[2]).toBe('Second,')
  })

  it('handles rows with all special characters', () => {
    const csv = toCSV([{
      title: 'Charlotte, NC "Big City"',
      notes: 'Line1\nLine2',
    }])
    const lines = csv.split('\n')
    // Header is clean
    expect(lines[0]).toBe('title,notes')
    // Data row has both fields quoted
    expect(lines[1]).toContain('"Charlotte, NC ""Big City"""')
  })

  it('single-row output is header + one data line', () => {
    const csv = toCSV([{ a: '1', b: '2' }])
    expect(csv.split('\n')).toHaveLength(2)
  })
})

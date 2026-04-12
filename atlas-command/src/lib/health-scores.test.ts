/**
 * Tests for the health score system in queries.ts.
 *
 * The real getPublicationHealthScores() calls Supabase, so we test the
 * scoring math directly using the exported constants + replicated logic.
 * This catches weight misconfiguration, division-by-zero, and rounding bugs.
 */
import { describe, it, expect } from 'vitest'
import { HEALTH_WEIGHTS, HEALTH_DEFAULTS } from './queries'

// --- Replicate the inline scoring from getPublicationHealthScores ---

function velocityScore(postsThisWeek: number, weeklyTarget: number): number {
  return weeklyTarget > 0 ? Math.min(100, Math.round((postsThisWeek / weeklyTarget) * 100)) : 100
}

function beatCoverageScore(activeBeats: number, totalBeats: number): number {
  return totalBeats > 0 ? Math.round((activeBeats / totalBeats) * 100) : 0
}

function hubFreshnessScore(freshHubs: number, totalHubs: number): number {
  return totalHubs > 0 ? Math.round((freshHubs / totalHubs) * 100) : 100
}

function pipelineDepthScore(pipelineItems: number, pipelineTarget: number): number {
  return Math.min(100, Math.round((pipelineItems / pipelineTarget) * 100))
}

function overallScore(v: number, b: number, h: number, p: number): number {
  return Math.round(
    v * HEALTH_WEIGHTS.velocity +
    b * HEALTH_WEIGHTS.beatCoverage +
    h * HEALTH_WEIGHTS.hubFreshness +
    p * HEALTH_WEIGHTS.pipelineDepth,
  )
}

// --- Tests ---

describe('HEALTH_WEIGHTS', () => {
  it('sum to 1.0', () => {
    const sum = HEALTH_WEIGHTS.velocity + HEALTH_WEIGHTS.beatCoverage +
      HEALTH_WEIGHTS.hubFreshness + HEALTH_WEIGHTS.pipelineDepth
    expect(sum).toBeCloseTo(1.0, 5)
  })

  it('velocity is the heaviest weight', () => {
    expect(HEALTH_WEIGHTS.velocity).toBeGreaterThanOrEqual(HEALTH_WEIGHTS.beatCoverage)
    expect(HEALTH_WEIGHTS.velocity).toBeGreaterThanOrEqual(HEALTH_WEIGHTS.hubFreshness)
    expect(HEALTH_WEIGHTS.velocity).toBeGreaterThanOrEqual(HEALTH_WEIGHTS.pipelineDepth)
  })

  it('all weights are positive', () => {
    expect(HEALTH_WEIGHTS.velocity).toBeGreaterThan(0)
    expect(HEALTH_WEIGHTS.beatCoverage).toBeGreaterThan(0)
    expect(HEALTH_WEIGHTS.hubFreshness).toBeGreaterThan(0)
    expect(HEALTH_WEIGHTS.pipelineDepth).toBeGreaterThan(0)
  })
})

describe('HEALTH_DEFAULTS', () => {
  it('weeklyTarget is 3', () => {
    expect(HEALTH_DEFAULTS.weeklyTarget).toBe(3)
  })

  it('pipelineTarget is 5', () => {
    expect(HEALTH_DEFAULTS.pipelineTarget).toBe(5)
  })
})

describe('velocityScore', () => {
  const target = HEALTH_DEFAULTS.weeklyTarget // 3

  it('returns 100 when at target', () => {
    expect(velocityScore(3, target)).toBe(100)
  })

  it('caps at 100 when exceeding target', () => {
    expect(velocityScore(10, target)).toBe(100)
  })

  it('returns 0 when no posts', () => {
    expect(velocityScore(0, target)).toBe(0)
  })

  it('returns proportional score', () => {
    // 1 / 3 = 33.33 → 33
    expect(velocityScore(1, target)).toBe(33)
  })

  it('returns 100 when target is 0 (division guard)', () => {
    expect(velocityScore(5, 0)).toBe(100)
  })
})

describe('beatCoverageScore', () => {
  it('returns 100 when all beats are active', () => {
    expect(beatCoverageScore(5, 5)).toBe(100)
  })

  it('returns 0 when no beats exist', () => {
    expect(beatCoverageScore(0, 0)).toBe(0)
  })

  it('returns proportional score', () => {
    expect(beatCoverageScore(3, 4)).toBe(75)
  })
})

describe('hubFreshnessScore', () => {
  it('returns 100 when all hubs fresh', () => {
    expect(hubFreshnessScore(10, 10)).toBe(100)
  })

  it('returns 100 when no hubs exist (vacuous truth)', () => {
    expect(hubFreshnessScore(0, 0)).toBe(100)
  })

  it('returns proportional score', () => {
    expect(hubFreshnessScore(7, 10)).toBe(70)
  })
})

describe('pipelineDepthScore', () => {
  const target = HEALTH_DEFAULTS.pipelineTarget // 5

  it('returns 100 at target', () => {
    expect(pipelineDepthScore(5, target)).toBe(100)
  })

  it('caps at 100 above target', () => {
    expect(pipelineDepthScore(20, target)).toBe(100)
  })

  it('returns 0 with empty pipeline', () => {
    expect(pipelineDepthScore(0, target)).toBe(0)
  })

  it('returns proportional score', () => {
    // 2 / 5 = 40
    expect(pipelineDepthScore(2, target)).toBe(40)
  })
})

describe('overallScore', () => {
  it('returns 100 when all dimensions are 100', () => {
    expect(overallScore(100, 100, 100, 100)).toBe(100)
  })

  it('returns 0 when all dimensions are 0', () => {
    expect(overallScore(0, 0, 0, 0)).toBe(0)
  })

  it('velocity loss hurts more than pipeline loss', () => {
    const noVelocity = overallScore(0, 100, 100, 100)
    const noPipeline = overallScore(100, 100, 100, 0)
    expect(noVelocity).toBeLessThan(noPipeline)
  })

  it('matches hand-calculated example', () => {
    // velocity=50, beat=75, hub=100, pipeline=40
    // 50*0.35 + 75*0.25 + 100*0.20 + 40*0.20
    // = 17.5 + 18.75 + 20 + 8 = 64.25 → 64
    expect(overallScore(50, 75, 100, 40)).toBe(64)
  })
})

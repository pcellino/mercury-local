// atlas-command/src/hooks/useMEStandup.ts
// v2 — adds todayEvents from cal_events, parse error passthrough

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface MEDecision {
  id: number
  tag: string
  body: string
  pub?: string
  note?: string
  actions: { label: string; outcome: string; danger?: boolean }[]
}

export interface MERadarItem {
  beat: string
  headline: string
  body: string
  sources?: string
}

export interface MEHealthItem {
  beat: string
  days: number
  threshold: number
}

export interface MEEventItem {
  beat: string
  category: string
  description: string
  status: string
  result?: string | null
}

export interface MEPitchItem {
  id: string
  entities?: { name: string }
  contacted_at: string
  contact_name?: string
  notes?: string
}

export interface MEStandup {
  date: string
  decisions: MEDecision[]
  radar: MERadarItem[]
  health: MEHealthItem[]
  todayEvents: MEEventItem[]
  slate: any[]
  overdue: any[]
  recentPublished: any[]
  pitches: MEPitchItem[]
  tomorrow_priority?: string
  _parse_error?: boolean
  _raw?: string
}

export type StandupStatus = 'idle' | 'loading' | 'ready' | 'error'

const LOADING_STEPS = [
  "Checking today's news across all beats",
  'Loading editorial calendar & today\'s events',
  'Checking open pitches & published content',
  'Synthesizing decisions for publisher',
]

export function useMEStandup() {
  const [standup, setStandup] = useState<MEStandup | null>(null)
  const [status, setStatus] = useState<StandupStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [resolved, setResolved] = useState<Record<number, string>>({})
  const [loadingStep, setLoadingStep] = useState(0)

  const load = useCallback(async () => {
    setStatus('loading')
    setError(null)
    setLoadingStep(0)

    try {
      // Animate steps while the edge function runs
      const stepTimer = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, LOADING_STEPS.length - 1))
      }, 600)

      const { data, error: fnError } = await supabase.functions.invoke('me-standup')

      clearInterval(stepTimer)
      setLoadingStep(LOADING_STEPS.length)

      if (fnError) throw new Error(fnError.message)
      if (!data) throw new Error('Empty response from ME standup function')

      // Parse error is non-fatal — surface it in the UI via _parse_error flag
      if (!data.decisions) data.decisions = []
      if (!data.radar) data.radar = []
      if (!data.health) data.health = []
      if (!data.todayEvents) data.todayEvents = []
      if (!data.slate) data.slate = []
      if (!data.overdue) data.overdue = []
      if (!data.recentPublished) data.recentPublished = []
      if (!data.pitches) data.pitches = []

      setStandup(data)
      setStatus('ready')
    } catch (err) {
      console.error('ME standup load error:', err)
      setError(String(err))
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const resolve = useCallback(async (
    decisionId: number,
    outcome: string,
    tag: string,
    body: string,
    pub?: string
  ) => {
    setResolved(prev => ({ ...prev, [decisionId]: outcome }))
    try {
      await supabase.from('me_decisions').insert({
        session_date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }),
        decision_num: decisionId,
        tag,
        body,
        pub: pub ?? null,
        outcome,
      })
    } catch (err) {
      // Non-fatal — decision is reflected in UI even if DB write fails
      console.warn('me_decisions insert failed:', err)
    }
  }, [])

  const resolvedCount = Object.keys(resolved).length
  const totalDecisions = standup?.decisions.length ?? 0
  const allResolved = totalDecisions > 0 && resolvedCount >= totalDecisions

  return {
    standup,
    status,
    error,
    resolved,
    loadingStep,
    load,
    resolve,
    resolvedCount,
    totalDecisions,
    allResolved,
  }
}

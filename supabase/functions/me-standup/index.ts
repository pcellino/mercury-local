// supabase/functions/me-standup/index.ts
// v3 — defensive version, simplified queries, better error handling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set')
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL not set')
    if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const { data: slate } = await supabase
      .from('editorial_calendar')
      .select('id, concept, beat, status, priority, notes, publication_id, author_id')
      .eq('target_date', today)
      .in('status', ['idea', 'in-progress'])
      .limit(10)

    const { data: overdue } = await supabase
      .from('editorial_calendar')
      .select('id, concept, beat, target_date, status, priority, publication_id')
      .lt('target_date', today)
      .in('status', ['idea', 'in-progress'])
      .limit(5)

    const { data: recentPublished } = await supabase
      .from('editorial_calendar')
      .select('concept, target_date, publication_id')
      .eq('status', 'published')
      .gte('updated_at', `${yesterday}T00:00:00Z`)
      .limit(6)

    const { data: todayEvents } = await supabase
      .from('cal_events')
      .select('title, beat_name, event_category, start_at, opponent, venue, home_away, status, result')
      .gte('start_at', `${today}T00:00:00Z`)
      .lte('start_at', `${today}T23:59:59Z`)
      .order('start_at')

    const eventsText = (todayEvents ?? []).map((e: any) => {
      const time = new Date(e.start_at).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
      })
      if (e.event_category === 'game') {
        return `[${e.beat_name}] ${e.title} — ${e.home_away?.toUpperCase() ?? ''} @ ${e.venue ?? ''} — ${time} ET`
      }
      return `[${e.beat_name}] ${e.title} — ${time} ET`
    }).join('\n') || 'No events today'

    const systemPrompt = `You are the Managing Editor of Mercury Local. Today is ${today}.

Publications: Charlotte Mercury (CLT), Farmington Mercury (FM), Strolling Ballantyne (SB), Grand National Today (GNT — launches May 1 2026, do not assign articles yet).

TODAY'S EVENTS (from cal_events master schedule):
${eventsText}

TODAY'S EDITORIAL SLATE (${(slate ?? []).length} items):
${JSON.stringify(slate ?? [], null, 2)}

OVERDUE (${(overdue ?? []).length} items past target):
${JSON.stringify(overdue ?? [], null, 2)}

Generate a morning standup. Respond ONLY with valid JSON — no markdown, no backticks, no preamble.

{
  "date": "${today}",
  "decisions": [
    {
      "id": 1,
      "tag": "assign|approve|kill|stale|concept|pitch",
      "body": "one actionable sentence",
      "pub": "CLT",
      "note": "context grounded in data above",
      "actions": [
        {"label": "Assign to Jack", "outcome": "Assigned — Jack Beckett drafting"},
        {"label": "Hold", "outcome": "Held for tomorrow"},
        {"label": "Kill", "outcome": "Killed", "danger": true}
      ]
    }
  ],
  "radar": [
    {
      "beat": "sports",
      "headline": "Story angle",
      "body": "2-3 sentences of context",
      "sources": "Source names"
    }
  ],
  "health": [
    {"beat": "NASCAR Cup", "days": 1, "threshold": 2},
    {"beat": "Hornets", "days": 2, "threshold": 2},
    {"beat": "Knights", "days": 0, "threshold": 2},
    {"beat": "Charlotte Govt", "days": 4, "threshold": 7},
    {"beat": "Farmington Govt", "days": 1, "threshold": 7},
    {"beat": "Police", "days": 1, "threshold": 3}
  ],
  "tomorrow_priority": "One sentence about tomorrow's most important task."
}`

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Generate the morning standup for ${today}. JSON only.` }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText}`)
    }

    const anthropicData = await anthropicRes.json()
    const raw = anthropicData.content?.find((b: any) => b.type === 'text')?.text ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()

    let standup: any = {}
    try {
      standup = JSON.parse(clean)
    } catch {
      standup = { _parse_error: true, _raw: raw.slice(0, 300) }
    }

    standup.slate = slate ?? []
    standup.overdue = overdue ?? []
    standup.recentPublished = recentPublished ?? []
    standup.pitches = []
    standup.todayEvents = (todayEvents ?? []).map((e: any) => ({
      beat: e.beat_name,
      category: e.event_category,
      description: e.title + (e.opponent ? ` vs ${e.opponent}` : '') + (e.venue ? ` @ ${e.venue}` : ''),
      status: e.status,
      result: e.result ?? null,
    }))

    if (!standup.decisions) standup.decisions = []
    if (!standup.radar) standup.radar = []
    if (!standup.health) standup.health = []

    return new Response(JSON.stringify(standup), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('ME standup error:', err)
    return new Response(
      JSON.stringify({ error: String(err), decisions: [], radar: [], health: [], slate: [], overdue: [], recentPublished: [], pitches: [], todayEvents: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

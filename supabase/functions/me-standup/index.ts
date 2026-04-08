// supabase/functions/me-standup/index.ts
// v2 — adds cal_events (today's games/races/meetings) to Supabase pull
// Deploy: supabase functions deploy me-standup

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Today's date in ET (Supabase stores timestamps as UTC)
    const now = new Date()
    const etOffset = -4 * 60 // EDT; use -5 for EST
    const etNow = new Date(now.getTime() + etOffset * 60000)
    const today = etNow.toISOString().split('T')[0]
    const yesterday = new Date(etNow.getTime() - 86400000).toISOString().split('T')[0]

    // All five queries run in parallel
    const [slateRes, overdueRes, recentRes, stalePitchRes, calEventsRes] = await Promise.all([

      // Today's editorial slate (planned stories)
      supabase
        .from('editorial_calendar')
        .select(`
          id, concept, beat, status, priority, notes,
          publications ( name, slug ),
          authors ( name )
        `)
        .eq('target_date', today)
        .in('status', ['idea', 'in-progress'])
        .order('priority', { ascending: false }),

      // Overdue items (past target date, still open)
      supabase
        .from('editorial_calendar')
        .select(`
          id, concept, beat, target_date, status, priority,
          publications ( name ),
          authors ( name )
        `)
        .lt('target_date', today)
        .in('status', ['idea', 'in-progress'])
        .order('target_date'),

      // What we published in the last 48h
      supabase
        .from('editorial_calendar')
        .select(`concept, target_date, publications ( name )`)
        .eq('status', 'published')
        .gte('updated_at', `${yesterday}T00:00:00Z`)
        .order('updated_at', { ascending: false })
        .limit(8),

      // Open pitches with no response after 24h
      supabase
        .from('pitches')
        .select(`
          id,
          entities ( name ),
          contacted_at, contact_name, questions_sent, notes
        `)
        .eq('response_received', false)
        .lt('contacted_at', new Date(now.getTime() - 86400000).toISOString()),

      // TODAY'S events from cal_events — the master event schedule
      // This is what drives editorial decisions: games tonight, meetings this afternoon
      supabase
        .from('cal_events')
        .select(`
          title, beat_name, event_category, status, result,
          opponent, venue, home_away,
          start_at
        `)
        .gte('start_at', `${today}T04:00:00Z`)  // 4am UTC = midnight ET
        .lt('start_at',  `${today}T28:00:00Z`)  // next-day 4am UTC
        .order('start_at'),
    ])

    // Format cal_events into a scannable array for the ME prompt
    const todayEvents = (calEventsRes.data ?? []).map(e => {
      const startET = new Date(e.start_at)
        .toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
        })
      const desc = e.event_category === 'game'
        ? `${e.title} — ${e.home_away === 'home' ? 'HOME' : 'AWAY'} @ ${e.venue} — ${startET}`
        : `${e.title} — ${startET}`
      return {
        beat: e.beat_name,
        category: e.event_category,
        description: desc,
        status: e.status,
        result: e.result ?? null,
      }
    })

    const context = {
      today,
      todayEvents,
      slate: slateRes.data ?? [],
      overdue: overdueRes.data ?? [],
      recentPublished: recentRes.data ?? [],
      stalePitches: stalePitchRes.data ?? [],
    }

    // ── SYSTEM PROMPT ─────────────────────────────────────────────────────────
    const systemPrompt = `You are the Managing Editor of Mercury Local, a multi-publication
civic journalism network in Charlotte NC and Farmington CT. The publisher is PC (Peter Cellino).

Publications:
- The Charlotte Mercury (CLT) — Charlotte & Mecklenburg County civic journalism.
  Beats: government, elections, business, community, education, culture, sports, opinion.
  House byline: Jack Beckett. Sports/NASCAR: John Speedway.
- The Farmington Mercury (FM) — Farmington CT hyperlocal.
  Beats: police, government, development, education, elections, community. Byline: Henry Whitfield.
- Strolling Ballantyne (SB) — South Charlotte neighborhood. Byline: Nell Thomas.
- Grand National Today (GNT) — NASCAR & short-track motorsports. Launch: May 1, 2026.
  Byline: John Speedway. Do NOT assign GNT articles until May 1.

TODAY IS ${today}.

TODAY'S EVENTS from cal_events (master schedule — these drive editorial decisions):
${todayEvents.length > 0
  ? todayEvents.map(e => `  [${e.beat}] ${e.description}${e.result ? ` → RESULT: ${e.result}` : ''}`).join('\n')
  : '  (No events in cal_events for today)'}

EDITORIAL CALENDAR — Today's slate:
${JSON.stringify(context.slate.slice(0, 8), null, 2)}

OVERDUE (past target date, still open):
${JSON.stringify(context.overdue.slice(0, 5), null, 2)}

PUBLISHED in last 48h:
${JSON.stringify(context.recentPublished, null, 2)}

OPEN PITCHES (no response 24h+):
${JSON.stringify(context.stalePitches, null, 2)}

RULES:
1. Decisions must be grounded in TODAY'S EVENTS and EDITORIAL CALENDAR data above.
   If a game is tonight, a decision about coverage assignment is appropriate.
   If a government meeting is today, a decision about transcript collection is appropriate.
2. Do not assign GNT articles until May 1, 2026.
3. If there are overdue items, the first decision must address them.
4. Decisions should be actionable — assign, approve, kill, flag, or concept.
5. Use real beat_names and publication names from the data above — not invented ones.

ALWAYS respond with valid JSON only. No markdown, no preamble, no backticks.

{
  "date": "Wednesday, April 8, 2026",
  "decisions": [
    {
      "id": 1,
      "tag": "assign|approve|kill|stale|concept|pitch|gate",
      "body": "one actionable sentence",
      "pub": "CLT · govt",
      "note": "why this decision, grounded in the data above",
      "actions": [
        { "label": "Assign to Jack", "outcome": "Assigned — Jack Beckett drafting" },
        { "label": "Hold", "outcome": "Held — revisit tomorrow" },
        { "label": "Kill", "outcome": "Killed — not worth chasing", "danger": true }
      ]
    }
  ],
  "radar": [
    {
      "beat": "govt",
      "headline": "Story angle headline",
      "body": "2-3 sentences of context and why it matters",
      "sources": "Source names"
    }
  ],
  "health": [
    { "beat": "NASCAR Cup", "days": 1, "threshold": 2 },
    { "beat": "Hornets", "days": 0, "threshold": 2 },
    { "beat": "Charlotte FC", "days": 3, "threshold": 2 },
    { "beat": "BOCC", "days": 4, "threshold": 7 },
    { "beat": "Farmington Govt", "days": 1, "threshold": 7 },
    { "beat": "Knights", "days": 0, "threshold": 2 },
    { "beat": "Police", "days": 1, "threshold": 3 }
  ],
  "tomorrow_priority": "One sentence about the single most important editorial task tomorrow."
}`

    // ── ANTHROPIC CALL ────────────────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2800,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Generate the morning standup for ${today}. Start with any overdue items,
then address tonight's games/meetings from cal_events, then fill remaining decisions from
the editorial calendar. Radar should cover 3-4 beats that have real news movement today.`,
        }],
      }),
    })

    const anthropicData = await anthropicRes.json()
    const raw = anthropicData.content?.find((b: any) => b.type === 'text')?.text ?? '{}'
    const clean = raw.replace(/```json|```/g, '').trim()

    let standup: any
    try {
      standup = JSON.parse(clean)
    } catch {
      // If Claude returned garbage, return a fallback rather than a 500
      standup = {
        date: today,
        decisions: [],
        radar: [],
        health: [],
        tomorrow_priority: 'Check Anthropic response — parse error.',
        _parse_error: true,
        _raw: raw.slice(0, 500),
      }
    }

    // Attach raw Supabase data so the UI can render the slate/pitches panels
    standup.slate = context.slate
    standup.overdue = context.overdue
    standup.recentPublished = context.recentPublished
    standup.pitches = context.stalePitches
    standup.todayEvents = context.todayEvents

    return new Response(JSON.stringify(standup), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('ME standup error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

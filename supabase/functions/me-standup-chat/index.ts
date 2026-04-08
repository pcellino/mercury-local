// supabase/functions/me-standup-chat/index.ts
const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { message, resolvedSummary, standupDate } = await req.json()

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: `You are the Managing Editor of Mercury Local. PC (the publisher) has reviewed the ${standupDate} morning standup. Resolved decisions: ${resolvedSummary}. Be brief and direct. One to two sentences max. No sycophancy. Confirm what you are doing or ask a clarifying question. No markdown.`,
      messages: [{ role: 'user', content: message }],
    }),
  })

  const data = await res.json()
  const reply = data.content?.find((b: any) => b.type === 'text')?.text ?? 'Error.'

  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

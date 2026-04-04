// Vercel Serverless Function — proxies Fathom Analytics API requests
// Keeps FATHOM_API_KEY server-side (never exposed to browser)

const ALLOWED_ORIGINS = [
  'https://atlas.cltmercury.com',
  'http://localhost:5173',   // Vite dev server
  'http://localhost:4173',   // Vite preview
]

export default async function handler(req, res) {
  // CORS headers — locked to known origins
  const origin = req.headers.origin ?? ''
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', corsOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const apiKey = process.env.FATHOM_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'FATHOM_API_KEY not configured' })
  }

  // Forward query params to Fathom API
  const { endpoint, ...params } = req.query

  // Allowed endpoints
  const allowedEndpoints = ['aggregations', 'current_visitors']
  if (!endpoint || !allowedEndpoints.includes(endpoint)) {
    return res.status(400).json({ error: `Invalid endpoint. Allowed: ${allowedEndpoints.join(', ')}` })
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, String(value))
  }

  const url = `https://api.usefathom.com/v1/${endpoint}?${searchParams.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch from Fathom API' })
  }
}

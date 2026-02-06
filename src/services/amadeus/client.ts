// Amadeus API client with authentication and rate limiting

interface AmadeusToken {
  access_token: string
  token_type: string
  expires_in: number
}

// In-memory token cache (for serverless, consider Redis for production)
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const apiKey = process.env.AMADEUS_API_KEY
  const apiSecret = process.env.AMADEUS_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured')
  }

  // Use test environment by default, production requires approval
  const baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com'

  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Amadeus auth failed:', error)
    throw new AmadeusError({
      errors: [{ code: 'AUTH_FAILED', detail: 'Failed to authenticate with Amadeus', status: response.status }],
    })
  }

  const data: AmadeusToken = await response.json()

  // Cache token (expire 5 minutes before actual expiry for safety)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}

export async function amadeusRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()
  const baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com'

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Amadeus API error:', errorData)
    throw new AmadeusError(errorData)
  }

  return response.json()
}

export class AmadeusError extends Error {
  code: string
  status: number
  details: unknown

  constructor(error: { errors?: Array<{ code?: string; detail?: string; status?: number }> }) {
    const firstError = error.errors?.[0]
    super(firstError?.detail || 'Amadeus API error')
    this.name = 'AmadeusError'
    this.code = firstError?.code || 'UNKNOWN'
    this.status = firstError?.status || 500
    this.details = error
  }
}

// Simple in-memory rate limiting for development
// In production, use Redis-based rate limiting
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests

export async function amadeusRequestWithRateLimit<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()
  return amadeusRequest<T>(endpoint, options)
}

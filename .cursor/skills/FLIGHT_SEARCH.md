# Flight Search Skill

> How to integrate flight search APIs, parse results, and monitor for deals in Vandra.

## Overview

Vandra uses flight search APIs to find deals matching user preferences. This skill covers:
- API integration with Amadeus (primary) and Skyscanner (backup)
- Parsing and normalizing flight data
- Implementing deal detection logic
- Handling rate limits and caching

## API Setup

### Amadeus API

Amadeus is the primary flight data provider.

**Environment Variables:**
```env
AMADEUS_API_KEY=your_api_key
AMADEUS_API_SECRET=your_api_secret
AMADEUS_BASE_URL=https://api.amadeus.com  # Production
# AMADEUS_BASE_URL=https://test.api.amadeus.com  # Sandbox
```

**Authentication Flow:**
```typescript
// src/services/amadeus/client.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

interface AmadeusToken {
  access_token: string
  expires_in: number
}

async function getAccessToken(): Promise<string> {
  // Check cache first
  const cached = await redis.get<string>('amadeus:token')
  if (cached) return cached
  
  // Fetch new token
  const response = await fetch(`${process.env.AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY!,
      client_secret: process.env.AMADEUS_API_SECRET!,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to authenticate with Amadeus')
  }
  
  const data: AmadeusToken = await response.json()
  
  // Cache token (expire 5 minutes before actual expiry)
  await redis.set('amadeus:token', data.access_token, {
    ex: data.expires_in - 300,
  })
  
  return data.access_token
}

export async function amadeusRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()
  
  const response = await fetch(`${process.env.AMADEUS_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new AmadeusError(error)
  }
  
  return response.json()
}
```

## Flight Search Implementation

### Search Endpoint

```typescript
// src/services/flights/search.ts
import { amadeusRequest } from '../amadeus/client'
import type { Flight, FlightSearchParams } from '@/types'

interface AmadeusFlightOffer {
  id: string
  source: string
  instantTicketingRequired: boolean
  price: {
    currency: string
    total: string
    base: string
  }
  itineraries: Array<{
    duration: string
    segments: Array<{
      departure: { iataCode: string; at: string }
      arrival: { iataCode: string; at: string }
      carrierCode: string
      number: string
      aircraft: { code: string }
      duration: string
    }>
  }>
}

export async function searchFlights(params: FlightSearchParams): Promise<Flight[]> {
  const searchParams = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: '1',
    currencyCode: 'USD',
    max: '50',
  })
  
  if (params.returnDate) {
    searchParams.set('returnDate', params.returnDate)
  }
  
  if (params.maxPrice) {
    searchParams.set('maxPrice', params.maxPrice.toString())
  }
  
  const response = await amadeusRequest<{ data: AmadeusFlightOffer[] }>(
    `/v2/shopping/flight-offers?${searchParams}`
  )
  
  return response.data.map(normalizeFlightOffer)
}

function normalizeFlightOffer(offer: AmadeusFlightOffer): Flight {
  const outbound = offer.itineraries[0]
  const inbound = offer.itineraries[1]
  
  return {
    id: offer.id,
    price: parseFloat(offer.price.total),
    currency: offer.price.currency,
    origin: outbound.segments[0].departure.iataCode,
    destination: outbound.segments[outbound.segments.length - 1].arrival.iataCode,
    departureDate: new Date(outbound.segments[0].departure.at),
    returnDate: inbound 
      ? new Date(inbound.segments[0].departure.at) 
      : undefined,
    airline: outbound.segments[0].carrierCode,
    stops: outbound.segments.length - 1,
    duration: parseDuration(outbound.duration),
    bookingUrl: generateBookingUrl(offer),
  }
}

function parseDuration(isoDuration: string): number {
  // Parse ISO 8601 duration (PT2H30M) to minutes
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  
  return hours * 60 + minutes
}

function generateBookingUrl(offer: AmadeusFlightOffer): string {
  // Generate affiliate booking link
  const params = new URLSearchParams({
    origin: offer.itineraries[0].segments[0].departure.iataCode,
    destination: offer.itineraries[0].segments.slice(-1)[0].arrival.iataCode,
    date: offer.itineraries[0].segments[0].departure.at.split('T')[0],
  })
  
  return `https://www.google.com/flights?${params}`
}
```

## Deal Detection

### Price History and Discounts

```typescript
// src/services/flights/deals.ts
import { prisma } from '@/lib/db/client'
import type { Flight, FlightAlert } from '@/types'

interface DealResult {
  flight: Flight
  alert: FlightAlert
  discountPercent: number
  isGoodDeal: boolean
}

export async function detectDeals(
  flights: Flight[],
  alert: FlightAlert
): Promise<DealResult[]> {
  const deals: DealResult[] = []
  
  for (const flight of flights) {
    // Get historical prices for this route
    const avgPrice = await getAveragePrice(
      flight.origin,
      flight.destination,
      flight.departureDate
    )
    
    if (!avgPrice) continue
    
    const discountPercent = Math.round(
      ((avgPrice - flight.price) / avgPrice) * 100
    )
    
    // Check if it matches alert criteria
    const matchesCriteria = checkAlertCriteria(flight, alert)
    
    if (matchesCriteria) {
      const isGoodDeal = 
        (alert.minDiscount && discountPercent >= alert.minDiscount) ||
        (!alert.minDiscount && discountPercent >= 20) // Default 20% threshold
      
      deals.push({
        flight,
        alert,
        discountPercent,
        isGoodDeal,
      })
    }
  }
  
  return deals.filter(d => d.isGoodDeal)
}

async function getAveragePrice(
  origin: string,
  destination: string,
  travelDate: Date
): Promise<number | null> {
  // Get historical prices from the last 30 days
  const result = await prisma.priceHistory.aggregate({
    where: {
      origin,
      destination,
      travelDate: {
        gte: new Date(travelDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        lte: new Date(travelDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      recordedAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    _avg: {
      price: true,
    },
  })
  
  return result._avg.price
}

function checkAlertCriteria(flight: Flight, alert: FlightAlert): boolean {
  // Check destination
  if (alert.destinationCode && flight.destination !== alert.destinationCode) {
    return false
  }
  
  // Check max price
  if (alert.maxPrice && flight.price > Number(alert.maxPrice)) {
    return false
  }
  
  // Check departure date range
  if (alert.departureAfter && flight.departureDate < alert.departureAfter) {
    return false
  }
  
  if (alert.departureBefore && flight.departureDate > alert.departureBefore) {
    return false
  }
  
  return true
}
```

## Background Job Processing

### Alert Monitoring Job

```typescript
// src/jobs/monitorAlerts.ts
import { Client } from '@upstash/qstash'
import { prisma } from '@/lib/db/client'
import { searchFlights } from '@/services/flights/search'
import { detectDeals } from '@/services/flights/deals'
import { sendFlightNotification } from '@/services/notifications/sms'

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
})

export async function processAlertBatch(alertIds: string[]) {
  const alerts = await prisma.flightAlert.findMany({
    where: {
      id: { in: alertIds },
      status: 'active',
    },
    include: {
      user: {
        select: { phone: true, phoneVerified: true },
      },
    },
  })
  
  for (const alert of alerts) {
    try {
      // Search for flights matching alert criteria
      const flights = await searchFlights({
        origin: alert.originCode,
        destination: alert.destinationCode || undefined,
        departureDate: alert.departureAfter?.toISOString().split('T')[0] 
          || getDefaultDepartureDate(),
      })
      
      // Detect deals
      const deals = await detectDeals(flights, alert)
      
      // Send notifications for good deals
      for (const deal of deals) {
        if (alert.user.phone && alert.user.phoneVerified) {
          await sendFlightNotification(alert.user.phone, deal)
          
          // Record notification
          await prisma.flightNotification.create({
            data: {
              alertId: alert.id,
              flightData: deal.flight as any,
              channel: 'sms',
            },
          })
        }
      }
    } catch (error) {
      console.error(`Error processing alert ${alert.id}:`, error)
    }
  }
}

// Schedule regular monitoring
export async function scheduleAlertMonitoring() {
  const activeAlerts = await prisma.flightAlert.findMany({
    where: { status: 'active' },
    select: { id: true },
  })
  
  // Batch alerts for processing
  const batchSize = 10
  for (let i = 0; i < activeAlerts.length; i += batchSize) {
    const batch = activeAlerts.slice(i, i + batchSize)
    
    await qstash.publishJSON({
      url: `${process.env.NEXTAUTH_URL}/api/jobs/process-alerts`,
      body: { alertIds: batch.map(a => a.id) },
      delay: i * 5, // Stagger batches by 5 seconds
    })
  }
}

function getDefaultDepartureDate(): string {
  // Search 2-4 weeks out by default
  const date = new Date()
  date.setDate(date.getDate() + 14)
  return date.toISOString().split('T')[0]
}
```

## Rate Limiting

### Implementing Rate Limits

```typescript
// src/services/amadeus/rateLimiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Amadeus free tier: 2000 requests/month, ~2.7/hour
// We'll be conservative: 1 request per 30 seconds
const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, '1 m'),
  prefix: 'amadeus:ratelimit',
})

export async function withRateLimit<T>(
  identifier: string,
  fn: () => Promise<T>
): Promise<T> {
  const { success, remaining, reset } = await rateLimiter.limit(identifier)
  
  if (!success) {
    const waitTime = reset - Date.now()
    throw new RateLimitError(`Rate limited. Try again in ${waitTime}ms`)
  }
  
  return fn()
}

// Usage in search
export async function searchFlightsWithRateLimit(params: FlightSearchParams) {
  return withRateLimit('flight-search', () => searchFlights(params))
}
```

## Caching Strategy

```typescript
// src/services/flights/cache.ts
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

interface CacheOptions {
  ttl?: number // seconds
}

export async function getCachedFlights(
  key: string
): Promise<Flight[] | null> {
  return redis.get<Flight[]>(key)
}

export async function cacheFlights(
  key: string,
  flights: Flight[],
  options: CacheOptions = {}
): Promise<void> {
  const ttl = options.ttl || 3600 // Default 1 hour
  await redis.set(key, flights, { ex: ttl })
}

export function generateCacheKey(params: FlightSearchParams): string {
  return `flights:${params.origin}:${params.destination || 'any'}:${params.departureDate}`
}

// Cached search wrapper
export async function searchFlightsCached(
  params: FlightSearchParams
): Promise<Flight[]> {
  const cacheKey = generateCacheKey(params)
  
  // Try cache first
  const cached = await getCachedFlights(cacheKey)
  if (cached) {
    console.log('Cache hit:', cacheKey)
    return cached
  }
  
  // Fetch fresh data
  const flights = await searchFlightsWithRateLimit(params)
  
  // Cache results
  await cacheFlights(cacheKey, flights)
  
  return flights
}
```

## Error Handling

```typescript
// src/services/amadeus/errors.ts
export class AmadeusError extends Error {
  code: string
  status: number
  
  constructor(error: any) {
    super(error.errors?.[0]?.detail || 'Amadeus API error')
    this.name = 'AmadeusError'
    this.code = error.errors?.[0]?.code || 'UNKNOWN'
    this.status = error.errors?.[0]?.status || 500
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

// Handle errors in API routes
export function handleFlightSearchError(error: unknown) {
  if (error instanceof RateLimitError) {
    return { code: 'RATE_LIMITED', message: error.message, status: 429 }
  }
  
  if (error instanceof AmadeusError) {
    return { code: error.code, message: error.message, status: error.status }
  }
  
  console.error('Unexpected flight search error:', error)
  return { code: 'INTERNAL_ERROR', message: 'Search failed', status: 500 }
}
```

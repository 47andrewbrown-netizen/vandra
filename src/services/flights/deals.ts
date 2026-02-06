// Deal detection service - identifies flights priced below average

import { prisma } from '@/lib/prisma'

import type { Flight, DealResult } from './types'
import type { FlightAlert } from '@prisma/client'

// Deal thresholds
const GREAT_DEAL_THRESHOLD = 30 // 30%+ off = great deal
const GOOD_DEAL_THRESHOLD = 20 // 20%+ off = good deal
const MIN_DEAL_THRESHOLD = 15 // Minimum discount to consider a deal

/**
 * Detect deals by comparing current prices to historical averages
 */
export async function detectDeals(
  flights: Flight[],
  alert: FlightAlert
): Promise<DealResult[]> {
  const deals: DealResult[] = []

  for (const flight of flights) {
    // Check if flight matches alert criteria first
    if (!matchesAlertCriteria(flight, alert)) {
      continue
    }

    // Get average price for this route
    const averagePrice = await getAveragePrice(
      flight.origin,
      flight.destination,
      flight.departureDate
    )

    // Calculate discount percentage
    let discountPercent = 0
    let priceRating: DealResult['priceRating'] = 'average'

    if (averagePrice && averagePrice > 0) {
      discountPercent = Math.round(((averagePrice - flight.price) / averagePrice) * 100)

      if (discountPercent >= GREAT_DEAL_THRESHOLD) {
        priceRating = 'great'
      } else if (discountPercent >= GOOD_DEAL_THRESHOLD) {
        priceRating = 'good'
      } else if (discountPercent < 0) {
        priceRating = 'high'
      }
    } else {
      // No historical data - check against maxPrice if set
      if (alert.maxPrice && flight.price <= Number(alert.maxPrice) * 0.8) {
        priceRating = 'good'
        discountPercent = 20 // Estimate
      }
    }

    const isGoodDeal =
      discountPercent >= MIN_DEAL_THRESHOLD ||
      (alert.maxPrice && flight.price <= Number(alert.maxPrice) * 0.85)

    deals.push({
      flight,
      averagePrice: averagePrice || flight.price,
      discountPercent,
      isGoodDeal: Boolean(isGoodDeal),
      priceRating,
    })
  }

  // Sort by discount (best deals first)
  return deals.sort((a, b) => b.discountPercent - a.discountPercent)
}

/**
 * Filter deals to only return good ones
 */
export function filterGoodDeals(deals: DealResult[]): DealResult[] {
  return deals.filter((d) => d.isGoodDeal)
}

/**
 * Get the average historical price for a route
 */
async function getAveragePrice(
  origin: string,
  destination: string,
  travelDate: Date
): Promise<number | null> {
  // Look for prices within a week of the travel date
  // and recorded in the last 30 days
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const monthMs = 30 * 24 * 60 * 60 * 1000

  const result = await prisma.priceHistory.aggregate({
    where: {
      origin,
      destination,
      travelDate: {
        gte: new Date(travelDate.getTime() - weekMs),
        lte: new Date(travelDate.getTime() + weekMs),
      },
      recordedAt: {
        gte: new Date(Date.now() - monthMs),
      },
    },
    _avg: {
      price: true,
    },
    _count: true,
  })

  // Need at least 3 data points for a reliable average
  if (result._count < 3) {
    return null
  }

  return result._avg.price ? Number(result._avg.price) : null
}

/**
 * Check if a flight matches the alert criteria
 */
function matchesAlertCriteria(flight: Flight, alert: FlightAlert): boolean {
  // Check destination (if specific destination is set)
  if (alert.destinationCode && flight.destination !== alert.destinationCode) {
    return false
  }

  // Check destination text (fuzzy match for regions like "Europe")
  if (alert.destinationText && !matchesDestinationText(flight.destination, alert.destinationText)) {
    // If specific destination code is not set but text is, we need looser matching
    // This will be handled by the search itself
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

  // Check minimum discount if specified
  // This is handled in detectDeals after we calculate the discount

  return true
}

/**
 * Check if destination matches a region/description
 */
function matchesDestinationText(destinationCode: string, text: string): boolean {
  const normalizedText = text.toLowerCase()

  // Region mappings
  const regions: Record<string, string[]> = {
    europe: [
      'LHR', 'CDG', 'FCO', 'BCN', 'AMS', 'FRA', 'MAD', 'MUC', 'ZRH', 'VIE',
      'DUB', 'LIS', 'ATH', 'PRG', 'BUD', 'WAW', 'CPH', 'OSL', 'ARN', 'HEL',
      'BRU', 'MXP', 'VCE', 'NAP', 'EDI', 'MAN', 'KEF',
    ],
    asia: [
      'NRT', 'HND', 'ICN', 'HKG', 'SIN', 'BKK', 'TPE', 'PVG', 'PEK', 'KIX',
      'MNL', 'SGN', 'HAN', 'KUL', 'DPS', 'DEL', 'BOM', 'CGK',
    ],
    japan: ['NRT', 'HND', 'KIX', 'FUK', 'CTS', 'NGO', 'OKA'],
    mexico: ['MEX', 'CUN', 'GDL', 'PVR', 'SJD', 'MZT', 'ACA'],
    caribbean: ['SJU', 'MBJ', 'NAS', 'PUJ', 'STT', 'AUA', 'CUR', 'BGI', 'GCM'],
    hawaii: ['HNL', 'OGG', 'KOA', 'LIH'],
    'south america': ['GRU', 'EZE', 'SCL', 'BOG', 'LIM', 'GIG', 'MVD', 'UIO'],
    canada: ['YYZ', 'YVR', 'YUL', 'YYC', 'YOW'],
    australia: ['SYD', 'MEL', 'BNE', 'PER', 'ADL'],
    'central america': ['PTY', 'SJO', 'GUA', 'SAL', 'MGA'],
  }

  // Check for region matches
  for (const [region, codes] of Object.entries(regions)) {
    if (normalizedText.includes(region) && codes.includes(destinationCode)) {
      return true
    }
  }

  // "Anywhere" or "flexible" matches everything
  if (
    normalizedText.includes('anywhere') ||
    normalizedText.includes('flexible') ||
    normalizedText.includes('open')
  ) {
    return true
  }

  // "Beach" or "tropical" matches beach destinations
  if (normalizedText.includes('beach') || normalizedText.includes('tropical') || normalizedText.includes('warm')) {
    const beachCodes = [...regions.caribbean, ...regions.mexico, ...regions.hawaii, 'MIA', 'TPA']
    return beachCodes.includes(destinationCode)
  }

  return false
}

/**
 * Record a flight price to build historical data
 */
export async function recordPrice(flight: Flight): Promise<void> {
  await prisma.priceHistory.create({
    data: {
      origin: flight.origin,
      destination: flight.destination,
      travelDate: flight.departureDate,
      price: flight.price,
      airline: flight.airline,
    },
  })
}

/**
 * Record multiple flight prices in batch
 */
export async function recordPrices(flights: Flight[]): Promise<void> {
  if (flights.length === 0) return

  await prisma.priceHistory.createMany({
    data: flights.map((flight) => ({
      origin: flight.origin,
      destination: flight.destination,
      travelDate: flight.departureDate,
      price: flight.price,
      airline: flight.airline,
    })),
    skipDuplicates: true,
  })
}

/**
 * Get destinations to search for a given alert
 * Returns specific codes based on the user's preferences
 */
export function getDestinationsForAlert(alert: FlightAlert): string[] {
  // If specific destination is set, just return that
  if (alert.destinationCode) {
    return [alert.destinationCode]
  }

  const text = (alert.destinationText || '').toLowerCase()

  // Region mappings (subset of most popular)
  const regionDestinations: Record<string, string[]> = {
    europe: ['LHR', 'CDG', 'FCO', 'BCN', 'AMS', 'DUB', 'LIS'],
    asia: ['NRT', 'ICN', 'HKG', 'SIN', 'BKK', 'TPE'],
    japan: ['NRT', 'HND', 'KIX'],
    mexico: ['CUN', 'MEX', 'PVR', 'SJD'],
    caribbean: ['SJU', 'MBJ', 'NAS', 'PUJ'],
    hawaii: ['HNL', 'OGG', 'KOA'],
    beach: ['CUN', 'SJU', 'MBJ', 'HNL', 'PVR'],
    tropical: ['CUN', 'SJU', 'MBJ', 'HNL', 'BKK', 'DPS'],
  }

  // Check for matches
  for (const [region, codes] of Object.entries(regionDestinations)) {
    if (text.includes(region)) {
      return codes
    }
  }

  // "Anywhere" - return a diverse mix
  if (text.includes('anywhere') || text.includes('flexible') || text.includes('open') || !text) {
    return ['LHR', 'CDG', 'CUN', 'NRT', 'FCO', 'MEX', 'HNL']
  }

  // Default to some popular destinations
  return ['LHR', 'CDG', 'CUN', 'NRT', 'FCO']
}

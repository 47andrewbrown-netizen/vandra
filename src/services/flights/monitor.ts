// Flight monitoring service - processes alerts and finds deals

import { prisma } from '@/lib/prisma'

import { searchFlights, searchMultipleDestinations } from './search'
import { detectDeals, filterGoodDeals, recordPrices, getDestinationsForAlert } from './deals'

import type { Flight, DealResult } from './types'
import type { FlightAlert } from '@prisma/client'

interface AlertWithUser extends FlightAlert {
  user: {
    id: string
    phone: string | null
    phoneVerified: boolean
    email: string
  }
  origin: {
    code: string
    city: string
    name: string
  }
}

interface MonitoringResult {
  alertId: string
  searchedRoutes: number
  flightsFound: number
  dealsFound: number
  goodDeals: DealResult[]
  error?: string
}

/**
 * Process a single alert - search for flights and detect deals
 */
export async function processAlert(alertId: string): Promise<MonitoringResult> {
  const result: MonitoringResult = {
    alertId,
    searchedRoutes: 0,
    flightsFound: 0,
    dealsFound: 0,
    goodDeals: [],
  }

  try {
    // Get the alert with user info
    const alert = await prisma.flightAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            phoneVerified: true,
            email: true,
          },
        },
        origin: true,
      },
    })

    if (!alert || alert.status !== 'active') {
      result.error = 'Alert not found or not active'
      return result
    }

    // Determine destinations to search
    const destinations = getDestinationsForAlert(alert)
    result.searchedRoutes = destinations.length

    // Get search dates (default: 2-8 weeks out if not specified)
    const searchDates = getSearchDates(alert)

    // Search for flights
    const allFlights: Flight[] = []

    for (const departureDate of searchDates) {
      const flights = await searchMultipleDestinations(
        alert.originCode,
        destinations,
        departureDate,
        alert.maxPrice ? Number(alert.maxPrice) : undefined
      )
      allFlights.push(...flights)
    }

    result.flightsFound = allFlights.length

    if (allFlights.length === 0) {
      return result
    }

    // Record prices for historical data
    await recordPrices(allFlights)

    // Detect deals
    const deals = await detectDeals(allFlights, alert)
    result.dealsFound = deals.length

    // Filter to good deals only
    const goodDeals = filterGoodDeals(deals)
    result.goodDeals = goodDeals

    console.log(`Alert ${alertId}: Found ${goodDeals.length} good deals out of ${allFlights.length} flights`)

    return result
  } catch (error) {
    console.error(`Error processing alert ${alertId}:`, error)
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

/**
 * Process multiple alerts in batch
 */
export async function processAlertBatch(alertIds: string[]): Promise<MonitoringResult[]> {
  const results: MonitoringResult[] = []

  for (const alertId of alertIds) {
    const result = await processAlert(alertId)
    results.push(result)

    // Small delay between alerts to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  return results
}

/**
 * Get all active alerts and process them
 */
export async function processAllActiveAlerts(): Promise<{
  processed: number
  totalDeals: number
  errors: number
}> {
  const activeAlerts = await prisma.flightAlert.findMany({
    where: { status: 'active' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  })

  let totalDeals = 0
  let errors = 0

  for (const alert of activeAlerts) {
    const result = await processAlert(alert.id)
    
    if (result.error) {
      errors++
    } else {
      totalDeals += result.goodDeals.length
    }

    // Respect rate limits - wait between processing each alert
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return {
    processed: activeAlerts.length,
    totalDeals,
    errors,
  }
}

/**
 * Get dates to search based on alert timing preferences
 */
function getSearchDates(alert: FlightAlert): string[] {
  const dates: string[] = []
  const now = new Date()

  // Parse timing text to determine search range
  const timingText = (alert.timingText || '').toLowerCase()

  let startWeeksOut = 2
  let endWeeksOut = 8

  // Adjust based on timing preferences
  if (timingText.includes('soon') || timingText.includes('next month')) {
    startWeeksOut = 1
    endWeeksOut = 6
  } else if (timingText.includes('summer')) {
    // Summer months (Jun-Aug)
    const currentMonth = now.getMonth()
    if (currentMonth < 5) {
      // Before June, search June-August
      startWeeksOut = Math.max(2, Math.ceil((new Date(now.getFullYear(), 5, 1).getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      endWeeksOut = startWeeksOut + 12
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      // During summer
      startWeeksOut = 2
      endWeeksOut = 10
    }
  } else if (timingText.includes('spring')) {
    const currentMonth = now.getMonth()
    if (currentMonth < 2) {
      startWeeksOut = Math.max(2, Math.ceil((new Date(now.getFullYear(), 2, 1).getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      endWeeksOut = startWeeksOut + 12
    }
  } else if (timingText.includes('fall') || timingText.includes('autumn')) {
    const currentMonth = now.getMonth()
    if (currentMonth < 8) {
      startWeeksOut = Math.max(2, Math.ceil((new Date(now.getFullYear(), 8, 1).getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      endWeeksOut = startWeeksOut + 12
    }
  } else if (timingText.includes('winter') || timingText.includes('holiday')) {
    const currentMonth = now.getMonth()
    if (currentMonth < 11) {
      startWeeksOut = Math.max(2, Math.ceil((new Date(now.getFullYear(), 11, 1).getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)))
      endWeeksOut = startWeeksOut + 8
    }
  } else if (timingText.includes('flexible') || timingText.includes('anytime')) {
    startWeeksOut = 2
    endWeeksOut = 12
  }

  // Use specific dates if set
  if (alert.departureAfter) {
    const weeksUntilStart = Math.ceil((alert.departureAfter.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000))
    startWeeksOut = Math.max(1, weeksUntilStart)
  }

  if (alert.departureBefore) {
    const weeksUntilEnd = Math.ceil((alert.departureBefore.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000))
    endWeeksOut = Math.min(endWeeksOut, weeksUntilEnd)
  }

  // Generate dates (one per week to limit API calls)
  for (let week = startWeeksOut; week <= endWeeksOut; week += 2) {
    const date = new Date(now)
    date.setDate(date.getDate() + week * 7)
    dates.push(date.toISOString().split('T')[0])
  }

  // Limit to 5 dates max to conserve API calls
  return dates.slice(0, 5)
}

/**
 * Store a deal notification in the database
 */
export async function recordDealNotification(
  alertId: string,
  deal: DealResult,
  channel: 'sms' | 'email' | 'push'
): Promise<void> {
  await prisma.flightNotification.create({
    data: {
      alertId,
      flightData: {
        id: deal.flight.id,
        price: deal.flight.price,
        currency: deal.flight.currency,
        origin: deal.flight.origin,
        destination: deal.flight.destination,
        departureDate: deal.flight.departureDate.toISOString(),
        airline: deal.flight.airline,
        airlineName: deal.flight.airlineName,
        stops: deal.flight.stops,
        duration: deal.flight.duration,
        bookingUrl: deal.flight.bookingUrl,
        discountPercent: deal.discountPercent,
        averagePrice: deal.averagePrice,
      },
      channel,
      status: 'sent',
    },
  })
}

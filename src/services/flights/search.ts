// Flight search service using Amadeus API

import { amadeusRequestWithRateLimit } from '../amadeus/client'

import type {
  Flight,
  FlightSearchParams,
  AmadeusSearchResponse,
  AmadeusFlightOffer,
  AIRLINE_NAMES,
} from './types'
import { AIRLINE_NAMES as airlineNames } from './types'

/**
 * Search for flights using Amadeus Flight Offers Search API
 */
export async function searchFlights(params: FlightSearchParams): Promise<Flight[]> {
  const searchParams = new URLSearchParams({
    originLocationCode: params.origin,
    departureDate: params.departureDate,
    adults: String(params.adults || 1),
    currencyCode: 'USD',
    max: '50', // Limit results
  })

  // Destination is optional - if not provided, we'll need to search popular routes
  if (params.destination) {
    searchParams.set('destinationLocationCode', params.destination)
  }

  if (params.returnDate) {
    searchParams.set('returnDate', params.returnDate)
  }

  if (params.maxPrice) {
    searchParams.set('maxPrice', String(params.maxPrice))
  }

  // Only search with destination for now (Amadeus requires it)
  if (!params.destination) {
    console.log('No destination specified, skipping search')
    return []
  }

  const response = await amadeusRequestWithRateLimit<AmadeusSearchResponse>(
    `/v2/shopping/flight-offers?${searchParams}`
  )

  return response.data.map((offer) => normalizeFlightOffer(offer, response.dictionaries?.carriers))
}

/**
 * Search multiple destinations from an origin
 */
export async function searchMultipleDestinations(
  origin: string,
  destinations: string[],
  departureDate: string,
  maxPrice?: number
): Promise<Flight[]> {
  const allFlights: Flight[] = []

  for (const destination of destinations) {
    try {
      const flights = await searchFlights({
        origin,
        destination,
        departureDate,
        maxPrice,
      })
      allFlights.push(...flights)
    } catch (error) {
      console.error(`Failed to search ${origin} -> ${destination}:`, error)
      // Continue with other destinations
    }
  }

  // Sort by price
  return allFlights.sort((a, b) => a.price - b.price)
}

/**
 * Get popular destinations from an origin for inspiration searches
 */
export function getPopularDestinations(origin: string): string[] {
  // Popular international destinations by US region
  const popularRoutes: Record<string, string[]> = {
    // West Coast
    LAX: ['NRT', 'HND', 'CDG', 'LHR', 'CUN', 'FCO', 'BCN', 'HNL', 'SYD', 'AKL'],
    SFO: ['NRT', 'HND', 'CDG', 'LHR', 'CUN', 'FCO', 'BCN', 'HNL', 'TPE', 'ICN'],
    SEA: ['NRT', 'HND', 'CDG', 'LHR', 'CUN', 'ANC', 'HNL', 'ICN', 'YVR', 'MEX'],
    // Mountain
    SLC: ['CUN', 'MEX', 'LHR', 'CDG', 'AMS', 'FCO', 'HNL', 'NRT', 'PVR', 'SJD'],
    DEN: ['CUN', 'MEX', 'LHR', 'CDG', 'AMS', 'FCO', 'HNL', 'NRT', 'PVR', 'SJD'],
    PHX: ['CUN', 'MEX', 'LHR', 'CDG', 'SJD', 'PVR', 'GDL', 'HNL', 'NRT', 'FCO'],
    // Central
    ORD: ['LHR', 'CDG', 'FRA', 'DUB', 'CUN', 'FCO', 'BCN', 'AMS', 'NRT', 'ICN'],
    DFW: ['LHR', 'CDG', 'CUN', 'MEX', 'FCO', 'NRT', 'HKG', 'GRU', 'EZE', 'SCL'],
    // East Coast
    JFK: ['LHR', 'CDG', 'FCO', 'BCN', 'AMS', 'DUB', 'NRT', 'HKG', 'TLV', 'ATH'],
    BOS: ['LHR', 'CDG', 'DUB', 'FCO', 'BCN', 'AMS', 'LIS', 'KEF', 'NRT', 'CUN'],
    MIA: ['LHR', 'CDG', 'MAD', 'BCN', 'GRU', 'EZE', 'BOG', 'SCL', 'CUN', 'SJU'],
    ATL: ['LHR', 'CDG', 'CUN', 'MEX', 'FCO', 'AMS', 'DUB', 'NRT', 'SJU', 'GRU'],
  }

  // Default popular international destinations
  const defaultDestinations = ['LHR', 'CDG', 'CUN', 'FCO', 'NRT', 'BCN', 'AMS', 'MEX', 'HNL', 'DUB']

  return popularRoutes[origin] || defaultDestinations
}

/**
 * Normalize Amadeus flight offer to our Flight type
 */
function normalizeFlightOffer(
  offer: AmadeusFlightOffer,
  carriers?: Record<string, string>
): Flight {
  const outbound = offer.itineraries[0]
  const inbound = offer.itineraries[1]
  const firstSegment = outbound.segments[0]
  const lastSegment = outbound.segments[outbound.segments.length - 1]

  const airlineCode = offer.validatingAirlineCodes?.[0] || firstSegment.carrierCode
  const airlineName = carriers?.[airlineCode] || airlineNames[airlineCode] || airlineCode

  return {
    id: offer.id,
    price: parseFloat(offer.price.grandTotal || offer.price.total),
    currency: offer.price.currency,
    origin: firstSegment.departure.iataCode,
    destination: lastSegment.arrival.iataCode,
    departureDate: new Date(firstSegment.departure.at),
    returnDate: inbound ? new Date(inbound.segments[0].departure.at) : undefined,
    airline: airlineCode,
    airlineName,
    stops: outbound.segments.length - 1,
    duration: parseDuration(outbound.duration),
    bookingUrl: generateBookingUrl(offer),
    rawOffer: offer,
  }
}

/**
 * Parse ISO 8601 duration (PT2H30M) to minutes
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)

  return hours * 60 + minutes
}

/**
 * Generate a booking URL (Google Flights for now)
 */
function generateBookingUrl(offer: AmadeusFlightOffer): string {
  const outbound = offer.itineraries[0]
  const firstSegment = outbound.segments[0]
  const lastSegment = outbound.segments[outbound.segments.length - 1]
  const inbound = offer.itineraries[1]

  const params = new URLSearchParams({
    hl: 'en',
    gl: 'us',
    curr: 'USD',
  })

  // Build the flight path
  const origin = firstSegment.departure.iataCode
  const destination = lastSegment.arrival.iataCode
  const departDate = firstSegment.departure.at.split('T')[0]

  let flightPath = `/${origin}.${destination}.${departDate}`

  if (inbound) {
    const returnDate = inbound.segments[0].departure.at.split('T')[0]
    flightPath += `*${destination}.${origin}.${returnDate}`
  }

  return `https://www.google.com/travel/flights${flightPath}?${params}`
}

/**
 * Format flight duration for display
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

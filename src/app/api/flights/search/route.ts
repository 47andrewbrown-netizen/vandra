// API route for searching flights

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { searchFlights, formatPrice, formatDuration } from '@/services/flights'

const SearchSchema = z.object({
  origin: z.string().length(3).toUpperCase(),
  destination: z.string().length(3).toUpperCase().optional(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  maxPrice: z.number().positive().optional(),
})

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = SearchSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: result.error.flatten() } },
        { status: 400 }
      )
    }

    const params = result.data

    // Destination is required for now
    if (!params.destination) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Destination is required' } },
        { status: 400 }
      )
    }

    console.log('Searching flights:', params)

    const flights = await searchFlights({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      maxPrice: params.maxPrice,
    })

    // Format flights for response
    const formattedFlights = flights.map((flight) => ({
      id: flight.id,
      price: flight.price,
      priceFormatted: formatPrice(flight.price, flight.currency),
      origin: flight.origin,
      destination: flight.destination,
      departureDate: flight.departureDate.toISOString(),
      returnDate: flight.returnDate?.toISOString(),
      airline: flight.airline,
      airlineName: flight.airlineName,
      stops: flight.stops,
      duration: flight.duration,
      durationFormatted: formatDuration(flight.duration),
      bookingUrl: flight.bookingUrl,
    }))

    return NextResponse.json({
      data: formattedFlights,
      count: formattedFlights.length,
    })
  } catch (error) {
    console.error('Flight search error:', error)

    // Check for Amadeus API errors
    if (error instanceof Error && error.name === 'AmadeusError') {
      return NextResponse.json(
        { error: { code: 'API_ERROR', message: 'Flight search failed. Please try again.' } },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 }
    )
  }
}

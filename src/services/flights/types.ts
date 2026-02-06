// Flight search and deal detection types

export interface Flight {
  id: string
  price: number
  currency: string
  origin: string
  destination: string
  departureDate: Date
  returnDate?: Date
  airline: string
  airlineName?: string
  stops: number
  duration: number // in minutes
  bookingUrl: string
  // Raw offer data for booking
  rawOffer?: unknown
}

export interface FlightSearchParams {
  origin: string
  destination?: string
  departureDate: string // YYYY-MM-DD
  returnDate?: string
  maxPrice?: number
  adults?: number
}

export interface DealResult {
  flight: Flight
  averagePrice: number
  discountPercent: number
  isGoodDeal: boolean
  priceRating: 'great' | 'good' | 'average' | 'high'
}

export interface AmadeusFlightOffer {
  id: string
  source: string
  instantTicketingRequired: boolean
  price: {
    currency: string
    total: string
    base: string
    grandTotal: string
  }
  itineraries: Array<{
    duration: string
    segments: Array<{
      departure: { iataCode: string; at: string; terminal?: string }
      arrival: { iataCode: string; at: string; terminal?: string }
      carrierCode: string
      number: string
      aircraft: { code: string }
      duration: string
      numberOfStops: number
    }>
  }>
  validatingAirlineCodes: string[]
  travelerPricings: Array<{
    travelerId: string
    fareOption: string
    travelerType: string
    price: { currency: string; total: string }
  }>
}

export interface AmadeusSearchResponse {
  data: AmadeusFlightOffer[]
  dictionaries?: {
    carriers?: Record<string, string>
    aircraft?: Record<string, string>
    currencies?: Record<string, string>
    locations?: Record<string, { cityCode: string; countryCode: string }>
  }
}

// Airline codes to names (common ones)
export const AIRLINE_NAMES: Record<string, string> = {
  AA: 'American Airlines',
  UA: 'United Airlines',
  DL: 'Delta Air Lines',
  WN: 'Southwest Airlines',
  B6: 'JetBlue Airways',
  AS: 'Alaska Airlines',
  NK: 'Spirit Airlines',
  F9: 'Frontier Airlines',
  G4: 'Allegiant Air',
  BA: 'British Airways',
  LH: 'Lufthansa',
  AF: 'Air France',
  KL: 'KLM',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
  CX: 'Cathay Pacific',
  JL: 'Japan Airlines',
  NH: 'ANA',
  AC: 'Air Canada',
  QF: 'Qantas',
  VS: 'Virgin Atlantic',
  IB: 'Iberia',
  AZ: 'ITA Airways',
  TK: 'Turkish Airlines',
  EY: 'Etihad Airways',
  LX: 'Swiss',
  OS: 'Austrian',
  SK: 'SAS',
  AY: 'Finnair',
  TP: 'TAP Portugal',
}

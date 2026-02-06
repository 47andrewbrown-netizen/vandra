import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const EXTRACTION_PROMPT = `Analyze this conversation and extract the user's flight preferences. Return ONLY valid JSON with this structure:

{
  "homeAirport": "3-letter airport code or city name they fly from",
  "destinations": "where they want to go - keep it natural (e.g., 'Europe', 'Japan', 'anywhere warm', 'beach destinations')",
  "timing": "when they want to travel - keep it natural (e.g., 'spring', 'next 3 months', 'flexible', 'summer 2026')",
  "priceText": "their price preference as stated (e.g., 'under $500', 'cheap', 'good deals', 'around $800')",
  "maxPrice": number or null (extract numeric value if they gave a specific budget, e.g., 'under $650' -> 650),
  "summary": "A fun, friendly summary like 'Your Europe scout, hunting deals under $650' or 'Finding you beach escapes this spring'"
}

If any field wasn't discussed, use null. Keep destinations and timing in natural language - don't try to convert to codes.`

// Map common city names to airport codes
const AIRPORT_CODES: Record<string, string> = {
  "salt lake": "SLC",
  "salt lake city": "SLC",
  "slc": "SLC",
  "denver": "DEN",
  "new york": "JFK",
  "nyc": "JFK",
  "los angeles": "LAX",
  "la": "LAX",
  "san francisco": "SFO",
  "sf": "SFO",
  "chicago": "ORD",
  "seattle": "SEA",
  "portland": "PDX",
  "austin": "AUS",
  "miami": "MIA",
  "boston": "BOS",
  "phoenix": "PHX",
  "atlanta": "ATL",
  "dallas": "DFW",
  "houston": "IAH",
  "las vegas": "LAS",
  "vegas": "LAS",
  "washington": "DCA",
  "dc": "DCA",
  "philadelphia": "PHL",
  "philly": "PHL",
  "san diego": "SAN",
  "minneapolis": "MSP",
  "detroit": "DTW",
  "orlando": "MCO",
  "tampa": "TPA",
  "nashville": "BNA",
  "new orleans": "MSY",
  "honolulu": "HNL",
  "hawaii": "HNL",
  "anchorage": "ANC",
  "alaska": "ANC",
}

function normalizeAirportCode(input: string | null): string {
  if (!input) return "SLC"
  
  const normalized = input.toLowerCase().trim()
  
  // If it's already a 3-letter code
  if (normalized.length === 3 && /^[a-z]+$/i.test(normalized)) {
    return normalized.toUpperCase()
  }
  
  // Try to match city name
  if (AIRPORT_CODES[normalized]) {
    return AIRPORT_CODES[normalized]
  }
  
  // Try partial match
  for (const [city, code] of Object.entries(AIRPORT_CODES)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return code
    }
  }
  
  return "SLC" // Default
}

function parseMaxPrice(priceText: string | null, maxPrice: number | null): number | null {
  // If Claude already extracted a number, use it
  if (maxPrice && typeof maxPrice === "number" && maxPrice > 0) {
    return maxPrice
  }
  
  if (!priceText) return null
  
  // Try to extract number from text like "under $650", "$500", "around 800"
  const match = priceText.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    return parseFloat(match[1].replace(",", ""))
  }
  
  return null
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const { messages } = await request.json()

    // Ask Claude to extract structured data from the conversation
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here's the conversation:\n\n${messages
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join("\n\n")}`,
        },
      ],
    })

    const content = response.content[0]
    const text = content.type === "text" ? content.text : "{}"
    
    // Parse the JSON response
    let preferences
    try {
      preferences = JSON.parse(text)
    } catch {
      console.error("Failed to parse preferences:", text)
      preferences = {
        homeAirport: null,
        destinations: null,
        timing: null,
        priceText: null,
        maxPrice: null,
        summary: "Your flight deal finder",
      }
    }

    // Normalize the origin airport code
    const originCode = normalizeAirportCode(preferences.homeAirport)

    // Check if origin airport exists in our database
    const airport = await prisma.airport.findUnique({
      where: { code: originCode },
    })

    // Use SLC as fallback if airport not in database
    const finalOriginCode = airport ? originCode : "SLC"

    // Parse the max price from text if needed
    const maxPrice = parseMaxPrice(preferences.priceText, preferences.maxPrice)

    // Create the flight alert with ALL preferences
    const alert = await prisma.flightAlert.create({
      data: {
        userId: session.user.id,
        originCode: finalOriginCode,
        // Structured data (for querying)
        maxPrice: maxPrice,
        // Natural language preferences (for display and AI matching)
        destinationText: preferences.destinations,
        timingText: preferences.timing,
        priceText: preferences.priceText,
        summary: preferences.summary,
      },
      include: {
        origin: true,
      },
    })

    console.log("Created flight alert:", {
      id: alert.id,
      origin: finalOriginCode,
      destination: preferences.destinations,
      timing: preferences.timing,
      price: preferences.priceText,
      maxPrice: maxPrice,
    })

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        origin: alert.origin,
        destinationText: alert.destinationText,
        timingText: alert.timingText,
        priceText: alert.priceText,
        maxPrice: alert.maxPrice,
        summary: alert.summary,
      },
    })
  } catch (error) {
    console.error("Extract API error:", error)
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    )
  }
}

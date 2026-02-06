// Background job API route for monitoring flight alerts
// This can be triggered by a cron job (Vercel Cron) or manually

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

import { processAllActiveAlerts, processAlert } from '@/services/flights'

// Verify the request is authorized (cron secret or admin)
function isAuthorized(request: Request): boolean {
  const headersList = headers()
  
  // Check for Vercel Cron authorization
  const authHeader = headersList.get('authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true
  }

  // Check for internal API key
  const apiKey = headersList.get('x-api-key')
  if (apiKey === process.env.INTERNAL_API_KEY) {
    return true
  }

  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  return false
}

/**
 * POST /api/jobs/monitor-alerts
 * Process all active flight alerts
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid authorization' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))

    // If specific alert ID is provided, process just that one
    if (body.alertId) {
      console.log(`Processing single alert: ${body.alertId}`)
      const result = await processAlert(body.alertId)

      return NextResponse.json({
        success: !result.error,
        result,
      })
    }

    // Otherwise, process all active alerts
    console.log('Processing all active alerts...')
    const results = await processAllActiveAlerts()

    console.log(`Processed ${results.processed} alerts, found ${results.totalDeals} deals, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Monitor alerts job error:', error)

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Job failed' } },
      { status: 500 }
    )
  }
}

/**
 * GET /api/jobs/monitor-alerts
 * Vercel Cron will call this endpoint
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid authorization' } },
      { status: 401 }
    )
  }

  try {
    console.log('Cron job triggered: processing all active alerts...')
    const results = await processAllActiveAlerts()

    console.log(`Cron complete: ${results.processed} alerts, ${results.totalDeals} deals, ${results.errors} errors`)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Cron job error:', error)

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Cron job failed' } },
      { status: 500 }
    )
  }
}

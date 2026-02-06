# Twilio SMS Skill

> How to implement SMS notifications for flight deal alerts in Vandra.

## Overview

Vandra sends SMS notifications when flight deals match user alerts. This skill covers:
- Twilio setup and configuration
- Message formatting and templates
- Delivery tracking and error handling
- Phone number verification

## Setup

### Environment Variables

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Twilio Client

```typescript
// src/lib/twilio.ts
import twilio from 'twilio'

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('Twilio credentials are required')
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER!
export const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID!
```

## Phone Verification

### Send Verification Code

```typescript
// src/services/sms/verification.ts
import { twilioClient, VERIFY_SERVICE_SID } from '@/lib/twilio'
import { prisma } from '@/lib/db/client'

export async function sendVerificationCode(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone number format
    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    if (!normalizedPhone) {
      return { success: false, error: 'Invalid phone number format' }
    }
    
    // Send verification via Twilio Verify
    await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: normalizedPhone,
        channel: 'sms',
      })
    
    // Store phone number (unverified)
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: normalizedPhone,
        phoneVerified: false,
      },
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send verification:', error)
    
    if (error.code === 60200) {
      return { success: false, error: 'Invalid phone number' }
    }
    if (error.code === 60203) {
      return { success: false, error: 'Too many attempts. Try again later.' }
    }
    
    return { success: false, error: 'Failed to send verification code' }
  }
}

export async function verifyCode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true },
    })
    
    if (!user.phone) {
      return { success: false, error: 'No phone number to verify' }
    }
    
    const verification = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: user.phone,
        code,
      })
    
    if (verification.status === 'approved') {
      await prisma.user.update({
        where: { id: userId },
        data: { phoneVerified: true },
      })
      return { success: true }
    }
    
    return { success: false, error: 'Invalid verification code' }
  } catch (error: any) {
    console.error('Verification check failed:', error)
    
    if (error.code === 60202) {
      return { success: false, error: 'Verification code expired' }
    }
    
    return { success: false, error: 'Verification failed' }
  }
}

function normalizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Must start with + and country code
  if (!cleaned.startsWith('+')) {
    // Assume US number if no country code
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`
    }
    return null
  }
  
  // Validate length (E.164 format)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null
  }
  
  return cleaned
}
```

### Verification API Routes

```typescript
// src/app/api/user/phone/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { sendVerificationCode, verifyCode } from '@/services/sms/verification'
import { authOptions } from '@/lib/auth'

const SendCodeSchema = z.object({
  phone: z.string().min(10),
})

const VerifyCodeSchema = z.object({
  code: z.string().length(6),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const { phone } = SendCodeSchema.parse(body)
    
    const result = await sendVerificationCode(session.user.id, phone)
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VERIFICATION_FAILED', message: result.error } },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 400 }
      )
    }
    throw error
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }
  
  const body = await request.json()
  const { code } = VerifyCodeSchema.parse(body)
  
  const result = await verifyCode(session.user.id, code)
  
  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_CODE', message: result.error } },
      { status: 400 }
    )
  }
  
  return NextResponse.json({ success: true, verified: true })
}
```

## Flight Notification Messages

### Message Templates

```typescript
// src/services/sms/templates.ts
import type { Flight, FlightAlert } from '@/types'

interface DealNotification {
  flight: Flight
  alert: FlightAlert
  discountPercent: number
}

export function formatFlightDealMessage(deal: DealNotification): string {
  const { flight, discountPercent } = deal
  
  const departureDate = formatDate(flight.departureDate)
  const returnInfo = flight.returnDate 
    ? ` - ${formatDate(flight.returnDate)}` 
    : ' (one-way)'
  
  const lines = [
    `✈️ Flight Deal Alert!`,
    ``,
    `${flight.origin} → ${flight.destination}`,
    `$${flight.price} (${discountPercent}% off!)`,
    `${departureDate}${returnInfo}`,
    `${flight.airline} • ${formatDuration(flight.duration)}`,
    ``,
    `Book now: ${flight.bookingUrl}`,
  ]
  
  return lines.join('\n')
}

export function formatWelcomeMessage(userName: string): string {
  return [
    `Welcome to Vandra, ${userName}! 🎉`,
    ``,
    `Your phone is verified and ready to receive flight deal alerts.`,
    ``,
    `Set up your first alert at vandra.com/alerts`,
  ].join('\n')
}

export function formatAlertCreatedMessage(
  origin: string,
  destination: string | null,
  maxPrice: number | null
): string {
  const destText = destination || 'anywhere'
  const priceText = maxPrice ? ` under $${maxPrice}` : ''
  
  return [
    `✅ Alert created!`,
    ``,
    `We'll notify you of deals from ${origin} to ${destText}${priceText}.`,
  ].join('\n')
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
```

### Send Notification

```typescript
// src/services/sms/notifications.ts
import { twilioClient, TWILIO_PHONE } from '@/lib/twilio'
import { prisma } from '@/lib/db/client'
import { formatFlightDealMessage } from './templates'
import type { DealNotification } from '@/types'

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendFlightNotification(
  phoneNumber: string,
  deal: DealNotification
): Promise<SendResult> {
  try {
    const message = formatFlightDealMessage(deal)
    
    const result = await twilioClient.messages.create({
      to: phoneNumber,
      from: TWILIO_PHONE,
      body: message,
    })
    
    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error: any) {
    console.error('Failed to send SMS:', error)
    
    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}

export async function sendBulkNotifications(
  notifications: Array<{
    userId: string
    deal: DealNotification
  }>
): Promise<void> {
  for (const { userId, deal } of notifications) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerified: true },
    })
    
    if (!user?.phone || !user.phoneVerified) {
      console.log(`Skipping notification for user ${userId}: no verified phone`)
      continue
    }
    
    const result = await sendFlightNotification(user.phone, deal)
    
    // Record notification
    await prisma.flightNotification.create({
      data: {
        alertId: deal.alert.id,
        flightData: deal.flight as any,
        channel: 'sms',
        status: result.success ? 'sent' : 'failed',
      },
    })
    
    // Rate limit: max 1 message per second
    await sleep(1000)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

## Webhook for Delivery Status

### Status Webhook

```typescript
// src/app/api/webhooks/twilio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { prisma } from '@/lib/db/client'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const params = Object.fromEntries(new URLSearchParams(body))
  
  // Validate webhook signature
  const signature = request.headers.get('x-twilio-signature') || ''
  const url = request.url
  
  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  )
  
  if (!isValid) {
    console.error('Invalid Twilio webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const { MessageSid, MessageStatus, ErrorCode } = params
  
  // Update notification status
  // Note: You'd need to store MessageSid when sending to track this
  console.log(`Message ${MessageSid} status: ${MessageStatus}`)
  
  if (ErrorCode) {
    console.error(`Message ${MessageSid} error: ${ErrorCode}`)
  }
  
  return NextResponse.json({ received: true })
}
```

## Rate Limiting

### Prevent SMS Spam

```typescript
// src/services/sms/rateLimiter.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Limit SMS per user: 10 per hour, 50 per day
const hourlyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'sms:hourly',
})

const dailyLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '24 h'),
  prefix: 'sms:daily',
})

export async function canSendSMS(userId: string): Promise<{
  allowed: boolean
  reason?: string
}> {
  const [hourly, daily] = await Promise.all([
    hourlyLimit.limit(userId),
    dailyLimit.limit(userId),
  ])
  
  if (!hourly.success) {
    return {
      allowed: false,
      reason: 'Hourly SMS limit reached. Try again later.',
    }
  }
  
  if (!daily.success) {
    return {
      allowed: false,
      reason: 'Daily SMS limit reached. Try again tomorrow.',
    }
  }
  
  return { allowed: true }
}
```

## Testing

### Test Phone Numbers

Twilio provides magic test numbers:

```typescript
// Test numbers (don't actually send SMS)
const TEST_NUMBERS = {
  valid: '+15005550006',        // Valid number
  invalid: '+15005550001',      // Invalid number
  blocked: '+15005550004',      // Blocked number
}

// Verification test codes
// Use code "123456" with test Verify service
```

### Local Development

```typescript
// src/services/sms/notifications.ts
export async function sendFlightNotification(
  phoneNumber: string,
  deal: DealNotification
): Promise<SendResult> {
  // Skip actual SMS in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📱 [DEV] Would send SMS to:', phoneNumber)
    console.log('Message:', formatFlightDealMessage(deal))
    return { success: true, messageId: 'dev-' + Date.now() }
  }
  
  // Production SMS sending...
}
```

## Error Handling

### Common Twilio Errors

```typescript
// src/services/sms/errors.ts
export function handleTwilioError(error: any): string {
  const errorMessages: Record<number, string> = {
    21211: 'Invalid phone number',
    21214: 'Phone number not verified',
    21408: 'Permission denied for this region',
    21610: 'Message blocked (carrier filtering)',
    21612: 'Phone number not SMS capable',
    21614: 'Invalid mobile number',
    30003: 'Unreachable destination',
    30004: 'Message blocked',
    30005: 'Unknown destination number',
    30006: 'Landline or unreachable carrier',
  }
  
  return errorMessages[error.code] || 'Failed to send message'
}
```

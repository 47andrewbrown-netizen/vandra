# Stripe Billing Skill

> How to implement subscription billing with Stripe in Vandra.

## Overview

Vandra uses Stripe for subscription billing with the following tiers:
- **Free:** 1 flight alert, basic notifications
- **Starter ($9/mo):** 5 flight alerts, SMS notifications
- **Pro ($19/mo):** Unlimited alerts, priority notifications, advanced filters

## Setup

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Stripe Client

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Price IDs (set these in Stripe Dashboard)
export const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID!,
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
} as const

export const PLAN_LIMITS = {
  free: { alerts: 1, sms: false },
  starter: { alerts: 5, sms: true },
  pro: { alerts: Infinity, sms: true },
} as const
```

## Customer Management

### Create or Get Customer

```typescript
// src/services/stripe/customers.ts
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/client'

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // Check if user already has a Stripe customer
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })
  
  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId
  }
  
  // Get user details
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, name: true },
  })
  
  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId,
    },
  })
  
  // Store customer ID
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      plan: 'free',
      status: 'active',
    },
    update: {
      stripeCustomerId: customer.id,
    },
  })
  
  return customer.id
}
```

## Checkout Flow

### Create Checkout Session

```typescript
// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { getOrCreateStripeCustomer } from '@/services/stripe/customers'
import { authOptions } from '@/lib/auth'

const CheckoutSchema = z.object({
  plan: z.enum(['starter', 'pro']),
  interval: z.enum(['monthly', 'yearly']),
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    const { plan, interval } = CheckoutSchema.parse(body)
    
    const customerId = await getOrCreateStripeCustomer(session.user.id)
    const priceId = PRICE_IDS[plan][interval]
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan,
        },
      },
    })
    
    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 400 }
      )
    }
    
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: { code: 'CHECKOUT_FAILED' } },
      { status: 500 }
    )
  }
}
```

### Client-Side Checkout

```typescript
// src/components/billing/PlanSelector.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface PlanSelectorProps {
  currentPlan: string
}

export function PlanSelector({ currentPlan }: PlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null)
  
  const handleCheckout = async (plan: 'starter' | 'pro', interval: 'monthly' | 'yearly') => {
    setLoading(`${plan}-${interval}`)
    
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error?.message || 'Checkout failed')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      // Show error toast
    } finally {
      setLoading(null)
    }
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PlanCard
        name="Starter"
        price={9}
        features={['5 flight alerts', 'SMS notifications', 'Email support']}
        onSelect={(interval) => handleCheckout('starter', interval)}
        loading={loading?.startsWith('starter')}
        current={currentPlan === 'starter'}
      />
      <PlanCard
        name="Pro"
        price={19}
        features={['Unlimited alerts', 'Priority notifications', 'Advanced filters', 'Priority support']}
        onSelect={(interval) => handleCheckout('pro', interval)}
        loading={loading?.startsWith('pro')}
        current={currentPlan === 'pro'}
      />
    </div>
  )
}
```

## Webhook Handling

### Webhook Endpoint

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/client'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')
  
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }
  
  // Subscription will be created via subscription.created webhook
  console.log(`Checkout completed for user ${userId}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }
  
  const plan = subscription.metadata?.plan || 'starter'
  
  // Map Stripe status to our status
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'active',
    incomplete_expired: 'canceled',
    past_due: 'past_due',
    paused: 'active',
    trialing: 'active',
    unpaid: 'unpaid',
  }
  
  await prisma.subscription.update({
    where: { userId },
    data: {
      stripeSubscriptionId: subscription.id,
      plan: plan as any,
      status: statusMap[subscription.status] as any,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })
  
  console.log(`Subscription updated for user ${userId}: ${plan}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  if (!userId) return
  
  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: 'free',
      status: 'canceled',
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    },
  })
  
  console.log(`Subscription canceled for user ${userId}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: { select: { email: true } } },
  })
  
  if (subscription) {
    // TODO: Send payment failed email
    console.log(`Payment failed for ${subscription.user.email}`)
  }
}
```

## Customer Portal

### Portal Session

```typescript
// src/app/api/billing/portal/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db/client'
import { authOptions } from '@/lib/auth'

export async function POST() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }
  
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { stripeCustomerId: true },
  })
  
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json(
      { error: { code: 'NO_CUSTOMER' } },
      { status: 400 }
    )
  }
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/billing`,
  })
  
  return NextResponse.json({ url: portalSession.url })
}
```

## Usage Enforcement

### Check Plan Limits

```typescript
// src/services/billing/limits.ts
import { prisma } from '@/lib/db/client'
import { PLAN_LIMITS } from '@/lib/stripe'

export async function canCreateAlert(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  })
  
  const plan = subscription?.plan || 'free'
  const limit = PLAN_LIMITS[plan].alerts
  
  if (limit === Infinity) return true
  
  const alertCount = await prisma.flightAlert.count({
    where: { userId, status: 'active' },
  })
  
  return alertCount < limit
}

export async function canReceiveSMS(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  })
  
  const plan = subscription?.plan || 'free'
  return PLAN_LIMITS[plan].sms
}

export async function getPlanLimits(userId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  })
  
  const plan = subscription?.plan || 'free'
  
  const alertCount = await prisma.flightAlert.count({
    where: { userId, status: 'active' },
  })
  
  return {
    plan,
    alerts: {
      used: alertCount,
      limit: PLAN_LIMITS[plan].alerts,
    },
    sms: PLAN_LIMITS[plan].sms,
  }
}
```

### Enforce in API Routes

```typescript
// src/app/api/alerts/route.ts
import { canCreateAlert } from '@/services/billing/limits'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }
  
  // Check plan limits
  const canCreate = await canCreateAlert(session.user.id)
  if (!canCreate) {
    return NextResponse.json(
      { error: { code: 'LIMIT_REACHED', message: 'Upgrade your plan to create more alerts' } },
      { status: 403 }
    )
  }
  
  // Create alert...
}
```

## Testing

### Test Mode

Always use test mode keys during development:

```env
# Development
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Test card numbers
# Success: 4242 4242 4242 4242
# Declined: 4000 0000 0000 0002
# Requires auth: 4000 0025 0000 3155
```

### Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

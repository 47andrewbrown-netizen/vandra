# Deployment Skill

> How to deploy Vandra to Vercel with proper configuration.

## Overview

Vandra is deployed to Vercel with:
- Automatic deployments from Git
- Preview deployments for pull requests
- PostgreSQL via Vercel Postgres or Neon
- Environment variable management
- Custom domain configuration

## Initial Setup

### 1. Connect Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (from project root)
vercel link
```

### 2. Configure Project

```bash
# vercel.json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "crons": [
    {
      "path": "/api/cron/monitor-alerts",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

### 3. Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgres://...

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://vandra.com

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=

# AI
ANTHROPIC_API_KEY=

# Flight API
AMADEUS_API_KEY=
AMADEUS_API_SECRET=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Background Jobs (Upstash QStash)
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
```

## Database Setup

### Option A: Vercel Postgres

```bash
# Create database via Vercel Dashboard
# Or via CLI:
vercel env pull .env.local
```

The connection string is automatically added as `POSTGRES_URL`.

### Option B: Neon

1. Create project at neon.tech
2. Copy connection string
3. Add to Vercel as `DATABASE_URL`

### Run Migrations

```bash
# Local development
npx prisma migrate dev

# Production (via build command or script)
npx prisma migrate deploy
```

## Build Configuration

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcrypt'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

## Deployment Workflow

### Automatic Deployments

- **Production:** Pushes to `main` branch
- **Preview:** Pull requests get preview URLs

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Stripe webhooks configured for production URL
- [ ] Twilio phone number configured
- [ ] Custom domain added and verified
- [ ] SSL certificate active

## Preview Deployments

### Branch-Specific Environment

```bash
# Set env var for specific branch
vercel env add NEXTAUTH_URL preview feature-branch
```

### Preview URLs Pattern

```
https://vandra-git-{branch}-{team}.vercel.app
```

## Custom Domain

### Add Domain

```bash
# Via CLI
vercel domains add vandra.com

# Or in Dashboard → Settings → Domains
```

### DNS Configuration

```
Type    Name    Value
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### SSL

Vercel automatically provisions SSL certificates.

## Cron Jobs

### Configure Scheduled Tasks

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/monitor-alerts",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/cleanup-expired",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Cron Endpoint

```typescript
// src/app/api/cron/monitor-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret (set CRON_SECRET env var)
  const authHeader = request.headers.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Run alert monitoring
  await scheduleAlertMonitoring()
  
  return NextResponse.json({ success: true })
}
```

## Monitoring

### Vercel Analytics

Enable in Dashboard → Analytics

### Error Tracking

```typescript
// src/lib/error-tracking.ts
export function captureError(error: Error, context?: Record<string, any>) {
  console.error('Error:', error.message, context)
  
  // Optional: Send to error tracking service
  // Sentry.captureException(error, { extra: context })
}
```

### Logs

```bash
# View logs via CLI
vercel logs vandra.com

# Real-time logs
vercel logs vandra.com --follow
```

## Rollback

### Instant Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

### Or via Dashboard

Deployments → Click on previous deployment → Promote to Production

## Performance Optimization

### Edge Functions

For latency-sensitive routes:

```typescript
// src/app/api/health/route.ts
export const runtime = 'edge'

export async function GET() {
  return new Response('OK')
}
```

### Static Generation

Pre-render where possible:

```typescript
// Force static generation
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour
```

### Image Optimization

Images are automatically optimized via `next/image`.

## Troubleshooting

### Build Failures

```bash
# Check build logs
vercel logs --output=raw

# Test build locally
npm run build
```

### Common Issues

1. **Prisma not generating:** Ensure `prisma generate` in build command
2. **Env vars missing:** Check Vercel environment settings
3. **Database connection:** Verify `DATABASE_URL` includes `?sslmode=require`
4. **Memory limits:** Upgrade plan or optimize functions

### Debug Mode

```bash
# Enable verbose logging
VERCEL_DEBUG=1 vercel
```

## Production Checklist

- [ ] All secrets rotated from development values
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] Error pages customized (404, 500)
- [ ] Monitoring and alerts configured
- [ ] Database backups enabled
- [ ] Stripe live mode keys in production env
- [ ] Custom domain with SSL
- [ ] Performance baseline established

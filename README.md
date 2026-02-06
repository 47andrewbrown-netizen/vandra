# Vandra

> Your personal flight deal finder. Tell us what you're looking for, and we'll alert you when great deals appear.

Vandra is a SaaS platform that helps travelers find personalized flight deals through conversational AI and automated monitoring with SMS alerts.

## Features

- **Conversational Flight Preferences** - Chat naturally to describe what kind of flights you're looking for
- **Smart Deal Detection** - AI-powered monitoring finds deals that match your criteria
- **SMS Alerts** - Get notified instantly when great deals are found
- **Home Airport Based** - Set your home airport and we'll find deals departing from there
- **Flexible Criteria** - Filter by destination, price, dates, or just say "surprise me"

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth.js |
| Payments | Stripe |
| SMS | Twilio |
| AI | Anthropic Claude |
| Deployment | Vercel |
| Jobs | Upstash QStash |
| Styling | Tailwind CSS |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vandra.git
   cd vandra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file with the following variables:
   
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/vandra
   
   # Auth (generate with: openssl rand -base64 32)
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   
   # Twilio
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1234567890
   TWILIO_VERIFY_SERVICE_SID=VA...
   
   # AI
   ANTHROPIC_API_KEY=sk-ant-...
   
   # Flight API
   AMADEUS_API_KEY=...
   AMADEUS_API_SECRET=...
   AMADEUS_BASE_URL=https://test.api.amadeus.com
   
   # Redis (Upstash)
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed airport data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vandra/
├── .cursor/                    # Cursor AI configuration
│   ├── agents.md              # Agent definitions
│   ├── rules/                 # Coding rules and standards
│   │   ├── global.mdc        # Company-wide standards
│   │   ├── typescript.mdc    # TypeScript conventions
│   │   ├── nextjs.mdc        # Next.js patterns
│   │   ├── security.mdc      # Security requirements
│   │   ├── database.mdc      # Database standards
│   │   └── testing.mdc       # Testing rules
│   └── skills/                # Domain-specific skills
│       ├── FLIGHT_SEARCH.md  # Flight API integration
│       ├── STRIPE_BILLING.md # Payment processing
│       ├── TWILIO_SMS.md     # SMS notifications
│       ├── AUTH_FLOW.md      # Authentication
│       └── DEPLOY.md         # Deployment procedures
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Auth pages (login, signup)
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── api/              # API routes
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/               # Primitive UI components
│   │   └── features/         # Feature components
│   ├── lib/                   # Utilities and shared logic
│   ├── services/              # External service integrations
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript types
├── tests/
│   ├── e2e/                   # Playwright E2E tests
│   └── fixtures/              # Test data
└── public/                    # Static assets
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # E2E with UI
```

### Cursor AI Agents

This project is configured with specialized Cursor AI agents:

| Agent | Invoke | Purpose |
|-------|--------|---------|
| Admin | `@admin` | Manage agent infrastructure |
| Maintenance | `@maintenance` | Code cleanup and standards |
| Frontend | `@frontend` | UI/UX development |
| Backend | `@backend` | API and server logic |
| Database | `@database` | Schema and queries |
| Testing | `@testing` | Test creation |
| DevOps | `@devops` | Deployment and CI/CD |
| Security | `@security` | Security compliance |
| Docs | `@docs` | Documentation |
| Design | `@design` | Design system |

See `.cursor/agents.md` for full agent specifications.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Manual

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## Subscription Plans

| Plan | Price | Alerts | SMS |
|------|-------|--------|-----|
| Free | $0 | 1 | No |
| Starter | $9/mo | 5 | Yes |
| Pro | $19/mo | Unlimited | Yes |

## API Integrations

- **Amadeus** - Flight search and pricing data
- **Stripe** - Payment processing
- **Twilio** - SMS notifications and phone verification
- **Anthropic Claude** - Conversational AI for preference gathering

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

---

Built with ❤️ by Vandra

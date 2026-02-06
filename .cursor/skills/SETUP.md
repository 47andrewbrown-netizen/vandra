---
name: setup
description: Configure the Vandra development environment on a new machine. Use when setting up the project after cloning, on a new laptop, or when the user mentions setup, installation, environment configuration, or workspace initialization.
---

# Vandra Development Setup

Complete workspace configuration for macOS. Run these steps in order after cloning the repository.

## Prerequisites Checklist

```
Setup Progress:
- [ ] Step 1: Install Homebrew and CLI tools
- [ ] Step 2: Install Node.js
- [ ] Step 3: Install and configure PostgreSQL
- [ ] Step 4: Install project dependencies
- [ ] Step 5: Configure environment variables
- [ ] Step 6: Initialize database
- [ ] Step 7: Verify setup
```

---

## Step 1: Install Homebrew and CLI Tools

### Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions to add Homebrew to your PATH.

### Install Required CLI Tools

```bash
brew install git node postgresql@16
```

### Verify Installations

```bash
git --version    # Should show git version
node --version   # Should show v20+ or v22+
psql --version   # Should show psql (PostgreSQL) 16.x
```

---

## Step 2: Node.js Configuration

Vandra requires Node.js 20 or higher. If you have multiple Node versions, use nvm:

```bash
# Install nvm (optional, for version management)
brew install nvm

# Add to ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"

# Install and use Node 22
nvm install 22
nvm use 22
nvm alias default 22
```

---

## Step 3: PostgreSQL Setup

### Start PostgreSQL Service

```bash
brew services start postgresql@16
```

### Create Database

```bash
# Create the vandra database
createdb vandra

# Verify connection
psql -d vandra -c "SELECT 1"
```

### Database URL Format

Your local database URL will be:

```
postgresql://<your-username>@localhost:5432/vandra
```

To find your username:

```bash
whoami
```

---

## Step 4: Install Project Dependencies

From the project root:

```bash
npm install
```

This automatically runs `prisma generate` via the postinstall script.

---

## Step 5: Configure Environment Variables

### Create Local Environment File

```bash
cp .env.example .env.local
```

If `.env.example` doesn't exist, create `.env.local` with:

```env
# Database - Update <your-username> with your macOS username
DATABASE_URL="postgresql://<your-username>@localhost:5432/vandra"

# Auth - Generate a secure secret for production
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional for local dev)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI - Required for chat functionality
# Get your key from https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=""

# Amadeus Flight API - Required for flight search
# Get your keys from https://developers.amadeus.com
# 1. Create a free account
# 2. Create a new app in "My Self-Service Workspace"
# 3. Copy the API Key and API Secret
AMADEUS_API_KEY=""
AMADEUS_API_SECRET=""
AMADEUS_BASE_URL="https://test.api.amadeus.com"

# Stripe - Required for payments (use test keys for dev)
# Get keys from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Twilio - Required for SMS notifications
# Get credentials from https://console.twilio.com
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Upstash Redis - Optional for rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Cron job secret
CRON_SECRET="dev-cron-secret"
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output to your `.env.local` file.

---

## Step 6: Initialize Database

### Run Migrations

```bash
npm run db:migrate
```

This creates all tables defined in `prisma/schema.prisma`.

### Seed Airport Data

```bash
npm run db:seed
```

This populates the airports table with major US and international airports.

### Verify Database

```bash
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555 where you can browse your data.

---

## Step 7: Verify Setup

### Start Development Server

```bash
npm run dev
```

### Test Endpoints

1. Open http://localhost:3000 - Landing page
2. Open http://localhost:3000/signup - Should show signup form
3. Open http://localhost:3000/login - Should show login form

### Run Tests (Optional)

```bash
# Unit tests
npm run test

# E2E tests (requires Playwright browsers)
npx playwright install
npm run test:e2e
```

---

## Quick Reference

### Package Versions

| Package | Version | Purpose |
|---------|---------|---------|
| Node.js | 20+ | Runtime |
| PostgreSQL | 16.x | Database |
| Next.js | 16.x | Framework |
| Prisma | 6.x | ORM |
| TypeScript | 5.x | Type safety |

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed airport data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |

### Project Structure

```
vandra/
├── prisma/           # Database schema and migrations
├── src/
│   ├── app/          # Next.js App Router pages
│   │   ├── (auth)/   # Auth pages (login, signup)
│   │   ├── (dashboard)/ # Protected dashboard pages
│   │   └── api/      # API routes
│   ├── components/   # React components
│   ├── lib/          # Utilities (auth, prisma)
│   ├── services/     # External integrations (Amadeus, etc.)
│   └── types/        # TypeScript definitions
└── .cursor/          # Cursor AI rules and skills
```

---

## Troubleshooting

### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@16

# Check logs
tail -f /opt/homebrew/var/log/postgresql@16.log
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Port 3000 Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Node Version Mismatch

```bash
# Check required version in package.json engines field
# Switch version with nvm
nvm use 22
```

---

## External Services Setup

### Anthropic (Claude AI)

1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### Amadeus Flight API

1. Create account at https://developers.amadeus.com
2. Create a new app in "My Self-Service Workspace"
3. Copy API Key and Secret to `.env.local`
4. Use test environment (`AMADEUS_BASE_URL=https://test.api.amadeus.com`)

### Stripe (Payments)

1. Create account at https://stripe.com
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy test keys to `.env.local`
4. For webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Twilio (SMS)

1. Create account at https://www.twilio.com
2. Get Account SID and Auth Token from console
3. Buy a phone number for sending SMS
4. Add credentials to `.env.local`

---

## One-Line Quick Setup

For experienced developers, after cloning:

```bash
brew install postgresql@16 && brew services start postgresql@16 && createdb vandra && npm install && cp .env.example .env.local && npm run db:migrate && npm run db:seed && npm run dev
```

Then edit `.env.local` with your API keys.

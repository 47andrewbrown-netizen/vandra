# Authentication Flow Skill

> How to implement authentication with NextAuth.js v5 in Vandra.

## Overview

Vandra uses NextAuth.js (Auth.js) for authentication with:
- Email/password credentials
- OAuth providers (Google, optional)
- Session management with JWT
- Protected routes via middleware

## Setup

### Environment Variables

```env
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### Auth Configuration

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials)
        
        if (!parsed.success) {
          return null
        }
        
        const { email, password } = parsed.data
        
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
          },
        })
        
        if (!user || !user.passwordHash) {
          return null
        }
        
        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        
        if (!passwordMatch) {
          return null
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
    // Optional: Google OAuth
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
```

### Type Extensions

```typescript
// src/types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
    }
  }
  
  interface User {
    id: string
    email: string
    name?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
  }
}
```

## Route Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

## User Registration

### Signup API

```typescript
// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'

const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  name: z.string().min(1, 'Name is required').max(100),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = SignupSchema.parse(body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'USER_EXISTS', message: 'Email already registered' } },
        { status: 409 }
      )
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })
    
    // Create free subscription
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: '', // Will be set when they upgrade
        plan: 'free',
        status: 'active',
      },
    })
    
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: error.errors } },
        { status: 400 }
      )
    }
    
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } },
      { status: 500 }
    )
  }
}
```

## Middleware Protection

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/alerts', '/chat', '/billing', '/settings']

// Routes only for non-authenticated users
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  const isAuthenticated = !!token
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

## Client Components

### Login Form

```typescript
// src/components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const validated = LoginSchema.parse({ email, password })
      
      const result = await signIn('credentials', {
        email: validated.email,
        password: validated.password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Invalid email or password')
        return
      }
      
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError('Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      
      <Button type="submit" loading={loading} className="w-full">
        Sign In
      </Button>
    </form>
  )
}
```

### Auth Provider

```typescript
// src/components/providers/AuthProvider.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}

// In root layout:
// <AuthProvider>{children}</AuthProvider>
```

### useAuth Hook

```typescript
// src/hooks/useAuth.ts
'use client'

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }
  
  return {
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signOut,
  }
}
```

## Server-Side Auth

### Getting Session in Server Components

```typescript
// src/app/(dashboard)/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div>
      <h1>Welcome, {session.user.name || session.user.email}!</h1>
    </div>
  )
}
```

### Getting Session in API Routes

```typescript
// src/app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    )
  }
  
  // Use session.user.id to fetch user-specific data
  const alerts = await prisma.flightAlert.findMany({
    where: { userId: session.user.id },
  })
  
  return NextResponse.json({ data: alerts })
}
```

## Password Reset

### Request Reset

```typescript
// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db/client'
import { sendPasswordResetEmail } from '@/services/email'

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true },
  })
  
  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true })
  }
  
  // Generate reset token
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 3600000) // 1 hour
  
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expires,
    },
  })
  
  // Send email
  await sendPasswordResetEmail(user.email, token)
  
  return NextResponse.json({ success: true })
}
```

## Security Best Practices

1. **Always hash passwords** with bcrypt (cost factor 12+)
2. **Use HTTPS** in production (enforced by Vercel)
3. **Set secure cookie options** (httpOnly, sameSite, secure)
4. **Validate all inputs** with Zod schemas
5. **Never expose password hashes** in API responses
6. **Implement rate limiting** on auth endpoints
7. **Use CSRF protection** (NextAuth handles this)
8. **Log auth events** for security monitoring

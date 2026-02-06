"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { signIn, getProviders } from "next-auth/react"
import { Button, Input } from "@/components/ui"

type Providers = Awaited<ReturnType<typeof getProviders>>

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [providers, setProviders] = useState<Providers>(null)
  const [loadingProviders, setLoadingProviders] = useState(true)

  useEffect(() => {
    getProviders().then((p) => {
      setProviders(p)
      setLoadingProviders(false)
    })
  }, [])

  const hasGoogle = providers?.google
  const hasEmail = providers?.email

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch {
      setError("Something went wrong. Please try again.")
      setGoogleLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      })

      if (result?.error) {
        setError("Failed to send magic link. Please try again.")
      } else {
        setIsEmailSent(true)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-primary-100)] mb-6">
          <svg className="w-8 h-8 text-[var(--color-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[var(--color-stone-900)] mb-2">
          Check your email
        </h1>
        <p className="text-[var(--color-stone-600)] mb-6">
          We sent a sign-in link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-[var(--color-stone-500)] mb-8">
          Click the link in the email to sign in. The link expires in 24 hours.
        </p>
        <button
          onClick={() => setIsEmailSent(false)}
          className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
        >
          Use a different email
        </button>
      </div>
    )
  }

  // Show setup instructions if no providers are configured
  if (!loadingProviders && !hasGoogle && !hasEmail) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-[var(--color-stone-900)]">
            Setup Required
          </h1>
          <p className="mt-2 text-[var(--color-stone-600)]">
            Authentication providers need to be configured
          </p>
        </div>

        <div className="bg-[var(--color-amber-50)] border border-[var(--color-amber-200)] rounded-xl p-6 mb-6">
          <h3 className="font-medium text-[var(--color-amber-800)] mb-3">
            Missing Environment Variables
          </h3>
          <p className="text-sm text-[var(--color-amber-700)] mb-4">
            Add the following to your <code className="bg-[var(--color-amber-100)] px-1 rounded">.env.local</code> file:
          </p>
          <pre className="text-xs bg-[var(--color-stone-900)] text-[var(--color-stone-100)] p-4 rounded-lg overflow-x-auto">
{`# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-secret"

# Magic Links (Resend)
RESEND_API_KEY="re_your_key"`}
          </pre>
        </div>

        <Link href="/">
          <Button variant="secondary" fullWidth>
            Back to home
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-stone-900)]">
          Welcome back
        </h1>
        <p className="mt-2 text-[var(--color-stone-600)]">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loadingProviders ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary-600)]" />
        </div>
      ) : (
        <>
          {/* Google Sign In */}
          {hasGoogle && (
            <Button
              variant="secondary"
              fullWidth
              onClick={handleGoogleSignIn}
              loading={googleLoading}
              className="mb-4"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          )}

          {/* Divider - only show if both providers available */}
          {hasGoogle && hasEmail && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-stone-200)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#FDFBF7] text-[var(--color-stone-500)]">
                  or continue with email
                </span>
              </div>
            </div>
          )}

          {/* Magic Link Form */}
          {hasEmail && (
            <>
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button type="submit" fullWidth loading={loading}>
                  Send magic link
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-[var(--color-stone-500)]">
                We&apos;ll email you a link to sign in—no password needed.
              </p>
            </>
          )}
        </>
      )}

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-stone-200)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-[#FDFBF7] text-[var(--color-stone-500)]">
              New to Vandra?
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/signup">
            <Button variant="ghost" fullWidth>
              Create an account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

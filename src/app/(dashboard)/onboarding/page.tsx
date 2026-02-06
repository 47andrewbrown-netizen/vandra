"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-lg text-center px-6">
        {/* Decorative icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary-100)] to-[var(--color-teal-100)] mb-8">
          <svg 
            className="w-10 h-10 text-[var(--color-primary-700)]" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
            />
          </svg>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[var(--color-stone-900)] leading-tight mb-4">
          Let&apos;s create your<br />
          <span className="text-[var(--color-primary-600)]">flight agent</span>
        </h1>

        <p className="text-lg text-[var(--color-stone-600)] leading-relaxed mb-10 max-w-md mx-auto">
          Tell me about your travel dreams—where you want to go, when you&apos;re flexible, 
          what matters most to you. I&apos;ll handle the rest.
        </p>

        <Button 
          size="lg" 
          onClick={() => router.push("/onboarding/chat")}
          className="px-10"
        >
          Let&apos;s go
        </Button>

        <p className="mt-6 text-sm text-[var(--color-stone-500)]">
          Takes about 2 minutes
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"

type BillingPeriod = "monthly" | "yearly"

const PLANS = {
  monthly: {
    price: 5,
    period: "month",
    billing: "Billed monthly",
    savings: null,
  },
  yearly: {
    price: 50,
    period: "year",
    billing: "Billed annually",
    savings: "Save $10/year",
  },
}

const FEATURES = [
  "Unlimited flight alerts",
  "SMS notifications for matching deals",
  "Custom departure airports",
  "Flexible destination filters",
  "Price drop alerts",
  "AI-powered deal recommendations",
]

export default function SubscribePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>("yearly")
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)

    // TODO: Replace with actual Stripe checkout
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // After successful subscription, redirect to dashboard/onboarding
      router.push("/onboarding")
    } catch {
      console.error("Subscription failed")
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = PLANS[selectedPlan]

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-amber-100)] text-[var(--color-amber-700)] text-sm font-medium mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Account created!
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[var(--color-stone-900)]">
          Choose your plan
        </h1>
        <p className="mt-2 text-[var(--color-stone-600)]">
          Start receiving flight deal notifications today
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-[var(--color-stone-100)] rounded-full">
          <button
            onClick={() => setSelectedPlan("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedPlan === "monthly"
                ? "bg-white text-[var(--color-stone-900)] shadow-sm"
                : "text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPlan("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              selectedPlan === "yearly"
                ? "bg-white text-[var(--color-stone-900)] shadow-sm"
                : "text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)]"
            }`}
          >
            Yearly
            {selectedPlan !== "yearly" && (
              <span className="text-xs bg-[var(--color-primary-100)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Plan Card */}
      <div className="bg-white rounded-2xl border border-[var(--color-stone-200)] p-8 shadow-sm">
        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-serif font-semibold text-[var(--color-stone-900)]">
              ${currentPlan.price}
            </span>
            <span className="text-[var(--color-stone-500)]">
              /{currentPlan.period}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-stone-500)]">
            {currentPlan.billing}
          </p>
          {currentPlan.savings && (
            <span className="inline-block mt-2 text-sm text-[var(--color-primary-600)] font-medium">
              {currentPlan.savings}
            </span>
          )}
        </div>

        {/* Features */}
        <div className="border-t border-[var(--color-stone-100)] pt-6 mb-8">
          <p className="text-sm font-medium text-[var(--color-stone-700)] mb-4">
            Everything you need:
          </p>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[var(--color-primary-600)] flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-[var(--color-stone-700)]">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Subscribe Button */}
        <Button onClick={handleSubscribe} fullWidth loading={loading} size="lg">
          Start getting deals
        </Button>

        <p className="mt-4 text-center text-xs text-[var(--color-stone-500)]">
          Cancel anytime. No questions asked.
        </p>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex items-center justify-center gap-6 text-[var(--color-stone-400)]">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-sm">Secure checkout</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm">Money-back guarantee</span>
        </div>
      </div>

      {/* Skip for now */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push("/onboarding")}
          className="text-sm text-[var(--color-stone-500)] hover:text-[var(--color-stone-700)] underline"
        >
          Skip for now (limited features)
        </button>
      </div>
    </div>
  )
}

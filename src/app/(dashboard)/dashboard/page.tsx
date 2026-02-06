import Link from "next/link"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button, Card, Badge } from "@/components/ui"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Fetch user's flight alerts
  const alerts = await prisma.flightAlert.findMany({
    where: { userId: session?.user?.id },
    include: {
      origin: true,
      destination: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const activeAlerts = alerts.filter((a) => a.status === "active")

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[var(--color-stone-900)]">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-2 text-[var(--color-stone-600)]">
            {activeAlerts.length > 0
              ? `You have ${activeAlerts.length} active flight agent${activeAlerts.length > 1 ? "s" : ""} watching for deals`
              : "Let's set up your first flight agent"}
          </p>
        </div>
        <Link href="/onboarding">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New agent
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-stone-900)]">{activeAlerts.length}</p>
              <p className="text-sm text-[var(--color-stone-600)]">Active agents</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-teal-100)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-teal-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-stone-900)]">0</p>
              <p className="text-sm text-[var(--color-stone-600)]">Deals found</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--color-amber-100)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-amber-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--color-stone-900)]">$0</p>
              <p className="text-sm text-[var(--color-stone-600)]">Total saved</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Flight Agents */}
      {alerts.length > 0 ? (
        <div>
          <h2 className="font-serif text-xl font-semibold text-[var(--color-stone-900)] mb-4">
            Your Flight Agents
          </h2>
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <FlightAgentCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-[var(--color-stone-100)] flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-[var(--color-stone-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h3 className="font-serif text-xl font-semibold text-[var(--color-stone-900)] mb-2">
            No flight agents yet
          </h3>
          <p className="text-[var(--color-stone-600)] mb-6 max-w-md mx-auto">
            Tell us where you want to travel and we&apos;ll find the best deals for you. 
            Our AI assistant will help you set up personalized alerts.
          </p>
          <Link href="/onboarding">
            <Button size="lg">
              Set up your first agent
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

interface FlightAlertWithRelations {
  id: string
  originCode: string
  destinationCode: string | null
  maxPrice: unknown
  minDiscount: number | null
  status: string
  createdAt: Date
  // New natural language fields
  destinationText: string | null
  timingText: string | null
  priceText: string | null
  summary: string | null
  origin: {
    code: string
    name: string
    city: string
  }
  destination: {
    code: string
    name: string
    city: string
  } | null
}

function FlightAgentCard({ alert }: { alert: FlightAlertWithRelations }) {
  // Generate a friendly title based on destination
  const getAgentTitle = (): string => {
    if (alert.summary) {
      return alert.summary
    }
    
    const dest = alert.destinationText?.toLowerCase() || ""
    
    if (dest.includes("anywhere") || dest.includes("open") || !dest) {
      return `Your adventure finder from ${alert.origin.city}`
    }
    if (dest.includes("europe")) {
      return `Your Europe scout`
    }
    if (dest.includes("asia") || dest.includes("japan") || dest.includes("korea") || dest.includes("thailand")) {
      return `Your Asia explorer`
    }
    if (dest.includes("beach") || dest.includes("tropical") || dest.includes("caribbean") || dest.includes("mexico")) {
      return `Your beach escape finder`
    }
    
    return `Your ${alert.destinationText} scout`
  }

  // Build details array for display
  const details: string[] = []
  if (alert.destinationText) {
    details.push(alert.destinationText)
  } else if (alert.destination) {
    details.push(alert.destination.city)
  }
  if (alert.priceText) {
    details.push(alert.priceText)
  } else if (alert.maxPrice) {
    details.push(`under $${alert.maxPrice}`)
  }
  if (alert.timingText) {
    details.push(alert.timingText)
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-teal-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif text-lg font-semibold text-[var(--color-stone-900)]">
                {getAgentTitle()}
              </h3>
              <Badge 
                variant={alert.status === "active" ? "success" : "secondary"}
                size="sm"
              >
                {alert.status === "active" ? "Searching" : alert.status}
              </Badge>
            </div>
            
            {/* Origin badge */}
            <div className="flex items-center gap-2 text-sm text-[var(--color-stone-500)] mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Flying from {alert.origin.city} ({alert.originCode})
            </div>

            {/* Preference pills */}
            {details.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {alert.destinationText && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border border-[var(--color-primary-200)]">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                    {alert.destinationText}
                  </span>
                )}
                {(alert.priceText || alert.maxPrice) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-teal-50)] text-[var(--color-teal-700)] border border-[var(--color-teal-200)]">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {alert.priceText || `under $${alert.maxPrice}`}
                  </span>
                )}
                {alert.timingText && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-amber-50)] text-[var(--color-amber-700)] border border-[var(--color-amber-200)]">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {alert.timingText}
                  </span>
                )}
              </div>
            )}

            <p className="text-xs text-[var(--color-stone-400)] mt-3">
              Watching since {new Date(alert.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-2 text-[var(--color-stone-400)] hover:text-[var(--color-stone-600)] rounded-lg hover:bg-[var(--color-stone-100)] transition-colors"
            title="Edit agent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button 
            className="p-2 text-[var(--color-stone-400)] hover:text-[var(--color-terracotta-600)] rounded-lg hover:bg-[var(--color-terracotta-50)] transition-colors"
            title="Delete agent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  )
}

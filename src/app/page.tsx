"use client"

import { useState } from "react"
import { Button, Card, Badge } from "@/components/ui"

export default function LandingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly")

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-sm border-b border-[var(--color-stone-200)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary-700)] flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg">V</span>
            </div>
            <span className="font-serif font-semibold text-xl text-[var(--color-stone-800)]">Vandra</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)] transition-colors hidden sm:block">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)] transition-colors hidden sm:block">
              Pricing
            </a>
            <a href="/login" className="text-sm text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)] transition-colors">
              Sign in
            </a>
            <Button size="sm" onClick={() => window.location.href = "/signup"}>
              Get started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Editorial Style */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        {/* Soft organic background shapes */}
        <div className="absolute top-20 -right-32 w-[500px] h-[500px] rounded-full bg-[var(--color-primary-100)] opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-[var(--color-highlight-100)] opacity-50 blur-3xl" />
        
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Copy */}
            <div>
              <p className="text-[var(--color-primary-700)] font-medium tracking-wide uppercase text-sm mb-4">
                Your travel companion
              </p>
              
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-[var(--color-stone-900)]">
                The best flights
                <span className="block text-[var(--color-primary-600)]">find you.</span>
              </h1>
              
              <p className="mt-6 text-lg text-[var(--color-stone-600)] leading-relaxed max-w-lg">
                Tell us where you dream of going. We&apos;ll keep watch and send you a text 
                when the perfect deal appears—so you can finally book that trip.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => window.location.href = "/signup"}>
                  Start finding deals
                </Button>
                <Button size="lg" variant="secondary" onClick={() => window.location.href = "/login"}>
                  Sign in
                </Button>
              </div>

              <p className="mt-4 text-sm text-[var(--color-stone-500)]">
                $5/month or $50/year • Cancel anytime
              </p>
            </div>

            {/* Right - Visual Card Stack (Social Media Style) */}
            <div className="relative">
              {/* Decorative frame suggesting artwork */}
              <div className="absolute -inset-4 border-2 border-[var(--color-stone-200)] rounded-3xl opacity-50" />
              
              <div className="relative space-y-4">
                {/* Deal "Post" Cards - Social Media Style */}
                <DealPost
                  destination="Lisbon, Portugal"
                  image="🏛️"
                  price={389}
                  originalPrice={920}
                  dates="Sep 12 – 22"
                  note="Direct from SLC. This almost never happens."
                  timeAgo="2h ago"
                />
                <DealPost
                  destination="Kyoto, Japan"
                  image="⛩️"
                  price={512}
                  originalPrice={1340}
                  dates="Oct 5 – 19"
                  note="Cherry blossom season rates in fall colors."
                  timeAgo="5h ago"
                  className="ml-8"
                />
                <DealPost
                  destination="Reykjavik, Iceland"
                  image="🌋"
                  price={298}
                  originalPrice={680}
                  dates="Nov 1 – 8"
                  note="Northern lights window. Go."
                  timeAgo="Yesterday"
                  className="ml-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Soft Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-stone-300)] to-transparent" />
      </div>

      {/* Story Section - Why This Exists */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[var(--color-primary-700)] font-medium tracking-wide uppercase text-sm mb-4">
            The idea
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--color-stone-900)] leading-tight">
            We started Vandra because flight deals shouldn&apos;t require a second job to find.
          </h2>
          <p className="mt-6 text-lg text-[var(--color-stone-600)] leading-relaxed">
            The best prices appear randomly, last for hours, and vanish. Unless you&apos;re 
            refreshing Google Flights all day, you miss them. So we built something that 
            watches for you—like having a friend who&apos;s obsessed with finding cheap flights 
            and texts you when they spot one.
          </p>
        </div>
      </section>

      {/* How It Works - Conversational */}
      <section id="how-it-works" className="py-24 bg-[var(--color-stone-100)]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[var(--color-secondary-700)] font-medium tracking-wide uppercase text-sm mb-4">
              How it works
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--color-stone-900)]">
              Three steps to cheaper travel
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <StepCard
              number="01"
              title="Tell us where you want to go"
              description="Paris in spring? Anywhere warm for under $300? Just tell us. Be specific or keep it open—we understand either way."
            />
            <StepCard
              number="02"
              title="We watch the prices"
              description="Our system checks fares around the clock. When something drops significantly below the usual rate, we notice."
            />
            <StepCard
              number="03"
              title="You get a text"
              description="A message lands in your pocket with the deal and a link. Book it directly with the airline. Simple as that."
            />
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials as Posts */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[var(--color-highlight-700)] font-medium tracking-wide uppercase text-sm mb-4">
              Stories from travelers
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--color-stone-900)]">
              Real trips, real savings
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <StoryCard
              quote="Got the text about Rome at 7am. By lunch I had flights booked for me and my mom—her first trip to Italy. We paid $380 each instead of $1,100."
              author="Jamie L."
              location="Seattle"
              trip="Rome, Italy"
              saved={1440}
            />
            <StoryCard
              quote="I'd been wanting to go to New Zealand for years but the flights were always $2k+. Vandra found me roundtrip for $687. I literally cried."
              author="Marcus T."
              location="Denver"
              trip="Auckland, NZ"
              saved={1313}
            />
            <StoryCard
              quote="Set an alert for 'anywhere in Europe under $400' and now I've been to Barcelona, Amsterdam, and Prague this year. My friends think I'm rich. I'm not."
              author="Priya S."
              location="Chicago"
              trip="3 countries"
              saved={890}
            />
            <StoryCard
              quote="The text came in at 2am. Half asleep, I booked Hawaii for my anniversary. My wife was suspicious how I found such a good deal. Now she's on Vandra too."
              author="David K."
              location="Salt Lake City"
              trip="Honolulu, HI"
              saved={520}
            />
          </div>
        </div>
      </section>

      {/* Features - Soft Grid */}
      <section className="py-24 bg-[var(--color-primary-50)]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[var(--color-primary-700)] font-medium tracking-wide uppercase text-sm mb-4">
              What makes us different
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--color-stone-900)]">
              Built for how you actually travel
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="💬"
              title="Talk to us naturally"
              description="No complicated forms. Just tell us what you're looking for like you'd tell a friend."
            />
            <FeatureCard
              icon="📱"
              title="Texts, not emails"
              description="Deals move fast. You'll get a text so you see it immediately, not buried in your inbox."
            />
            <FeatureCard
              icon="🌍"
              title="Every airline, everywhere"
              description="We search them all—legacy carriers, budget airlines, everyone. You get the best price."
            />
            <FeatureCard
              icon="🎯"
              title="Your home airport"
              description="Deals are based on where you actually live. No more 'great fares from NYC' when you're in Denver."
            />
            <FeatureCard
              icon="✨"
              title="Flexible or specific"
              description="Know exactly where you want to go? Great. Open to anywhere? Even better. We handle both."
            />
            <FeatureCard
              icon="🔗"
              title="Book direct"
              description="We send you straight to the airline. No middleman fees, no sketchy booking sites."
            />
          </div>
        </div>
      </section>

      {/* Pricing - One Simple Plan */}
      <section id="pricing" className="py-24">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-[var(--color-secondary-700)] font-medium tracking-wide uppercase text-sm mb-4">
              Simple pricing
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--color-stone-900)]">
              One plan. Everything included.
            </h2>
            <p className="mt-4 text-[var(--color-stone-600)] max-w-md mx-auto">
              We don&apos;t believe in tiers or upsells. Everyone gets the full experience—because everyone deserves great travel deals.
            </p>
          </div>

          {/* Single Pricing Card */}
          <div className="bg-white rounded-3xl border border-[var(--color-stone-200)] p-8 sm:p-10 shadow-sm">
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex p-1.5 bg-[var(--color-stone-100)] rounded-full">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-white text-[var(--color-stone-900)] shadow-sm"
                      : "text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    billingPeriod === "yearly"
                      ? "bg-white text-[var(--color-stone-900)] shadow-sm"
                      : "text-[var(--color-stone-600)] hover:text-[var(--color-stone-900)]"
                  }`}
                >
                  Yearly
                  <span className="text-xs bg-[var(--color-primary-100)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full">
                    Save $10
                  </span>
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-serif text-6xl font-semibold text-[var(--color-stone-900)]">
                  ${billingPeriod === "monthly" ? "5" : "50"}
                </span>
                <span className="text-[var(--color-stone-500)] text-lg">
                  /{billingPeriod === "monthly" ? "month" : "year"}
                </span>
              </div>
              {billingPeriod === "yearly" && (
                <p className="mt-2 text-sm text-[var(--color-primary-600)] font-medium">
                  That&apos;s just $4.17/month
                </p>
              )}
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                "Unlimited flight alerts",
                "SMS deal notifications",
                "Any departure airport",
                "Flexible destinations",
                "Price drop alerts",
                "AI-powered recommendations",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-3 h-3 text-[var(--color-primary-700)]" />
                  </div>
                  <span className="text-[var(--color-stone-700)]">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button 
              fullWidth 
              size="lg"
              onClick={() => window.location.href = "/signup"}
            >
              Start finding deals
            </Button>

            <p className="mt-4 text-center text-sm text-[var(--color-stone-500)]">
              Cancel anytime. No questions asked.
            </p>
          </div>

          {/* Trust note */}
          <p className="mt-8 text-center text-[var(--color-stone-500)] text-sm">
            Join 12,000+ travelers already saving on flights
          </p>
        </div>
      </section>

      {/* FAQ - Minimal */}
      <section className="py-24 bg-[var(--color-stone-100)]/50">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-semibold text-[var(--color-stone-900)] mb-12 text-center">
            Questions
          </h2>

          <div className="space-y-8">
            <FAQItem
              question="How do you find these deals?"
              answer="We monitor prices across all major airlines continuously. When fares drop significantly below their historical average, we flag it as a deal and send it your way."
            />
            <FAQItem
              question="Why one simple plan?"
              answer="We believe everyone deserves the same great experience. No confusing tiers, no feature gates—just everything you need to find amazing flight deals at a price that makes sense."
            />
            <FAQItem
              question="Do you book the flights for me?"
              answer="No—we send you directly to the airline's website to book. This way you get the airline's price with no middleman markup, and your booking is directly with them."
            />
            <FAQItem
              question="What if I don't know where I want to go?"
              answer="Perfect. You can set alerts for 'anywhere' or categories like 'Europe' or 'beaches.' We'll surprise you with deals from your home airport."
            />
            <FAQItem
              question="Can I cancel anytime?"
              answer="Of course. No contracts, no cancellation fees, no hassle. Cancel whenever you want from your account—we make it easy."
            />
          </div>
        </div>
      </section>

      {/* Final CTA - Warm & Inviting */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full border border-white/20" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
        </div>
        
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white mb-6">
            Your next adventure is waiting.
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join Vandra and let the deals come to you.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = "/signup"}
            className="bg-white text-[var(--color-primary-700)] hover:bg-white/90"
          >
            Start for $5/month
          </Button>
          <p className="mt-6 text-sm text-white/60">
            Or save with $50/year • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer - Simple */}
      <footer className="py-12 bg-[var(--color-stone-900)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white font-serif font-semibold">V</span>
              </div>
              <span className="text-white/80 font-serif">Vandra</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/50">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-sm text-white/30">
              © 2026 Vandra
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

// Components
function DealPost({ 
  destination, 
  image,
  price, 
  originalPrice, 
  dates,
  note,
  timeAgo,
  className = ""
}: { 
  destination: string
  image: string
  price: number
  originalPrice: number
  dates: string
  note: string
  timeAgo: string
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-[var(--color-stone-200)] ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-xl">
            {image}
          </div>
          <div>
            <p className="font-medium text-[var(--color-stone-900)]">{destination}</p>
            <p className="text-xs text-[var(--color-stone-500)]">{dates}</p>
          </div>
        </div>
        <span className="text-xs text-[var(--color-stone-400)]">{timeAgo}</span>
      </div>
      <p className="text-sm text-[var(--color-stone-600)] mb-3">{note}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-[var(--color-primary-700)]">${price}</span>
          <span className="text-sm text-[var(--color-stone-400)] line-through">${originalPrice}</span>
        </div>
        <Badge variant="primary" size="sm">
          {Math.round((1 - price / originalPrice) * 100)}% off
        </Badge>
      </div>
    </div>
  )
}

function StepCard({ 
  number, 
  title, 
  description 
}: { 
  number: string
  title: string
  description: string
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-serif font-semibold text-lg mb-4">
        {number}
      </div>
      <h3 className="font-serif text-xl font-semibold text-[var(--color-stone-900)] mb-3">{title}</h3>
      <p className="text-[var(--color-stone-600)] leading-relaxed">{description}</p>
    </div>
  )
}

function StoryCard({ 
  quote, 
  author, 
  location,
  trip,
  saved
}: { 
  quote: string
  author: string
  location: string
  trip: string
  saved: number
}) {
  return (
    <Card className="p-6 bg-white">
      <p className="text-[var(--color-stone-700)] leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-[var(--color-stone-900)]">{author}</p>
          <p className="text-sm text-[var(--color-stone-500)]">{location} → {trip}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-[var(--color-stone-500)]">Saved</p>
          <p className="font-semibold text-[var(--color-primary-700)]">${saved}</p>
        </div>
      </div>
    </Card>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--color-stone-200)]">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-medium text-[var(--color-stone-900)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-stone-600)] leading-relaxed">{description}</p>
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-[var(--color-stone-200)] pb-8">
      <h3 className="font-medium text-[var(--color-stone-900)] mb-2">{question}</h3>
      <p className="text-[var(--color-stone-600)] leading-relaxed">{answer}</p>
    </div>
  )
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  )
}

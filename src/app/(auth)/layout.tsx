import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-800)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5" />
        
        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xl">V</span>
            </div>
            <span className="font-serif font-semibold text-xl text-white">Vandra</span>
          </Link>
        </div>

        <div className="relative">
          <blockquote className="text-white/90 text-2xl font-serif leading-relaxed">
            &ldquo;Got the text about cheap flights to Portugal at 7am. By lunch, 
            I had booked my dream trip for half the price.&rdquo;
          </blockquote>
          <div className="mt-6">
            <p className="text-white font-medium">Sarah M.</p>
            <p className="text-white/60 text-sm">Saved $540 on her Lisbon trip</p>
          </div>
        </div>

        <div className="relative text-white/40 text-sm">
          © 2026 Vandra. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 border-b border-[var(--color-stone-200)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg">V</span>
            </div>
            <span className="font-serif font-semibold text-xl text-[var(--color-stone-800)]">Vandra</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

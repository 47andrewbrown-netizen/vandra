import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Navigation */}
      <nav className="border-b border-[var(--color-stone-200)] bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center">
                <span className="text-white font-serif font-bold text-lg">V</span>
              </div>
              <span className="font-serif font-semibold text-xl text-[var(--color-stone-800)]">Vandra</span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--color-stone-600)]">
                {session.user?.email}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-[var(--color-stone-500)] hover:text-[var(--color-stone-700)]"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

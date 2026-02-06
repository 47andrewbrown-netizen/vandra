import Link from "next/link"
import { Button } from "@/components/ui"

export default function CheckEmailPage() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-primary-100)] mb-6">
        <svg className="w-10 h-10 text-[var(--color-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      
      <h1 className="font-serif text-3xl font-semibold text-[var(--color-stone-900)] mb-3">
        Check your email
      </h1>
      
      <p className="text-[var(--color-stone-600)] mb-8 max-w-sm mx-auto">
        We sent you a sign-in link. Click the link in the email to continue.
      </p>

      <div className="bg-[var(--color-stone-50)] rounded-xl p-6 mb-8 text-left">
        <h3 className="font-medium text-[var(--color-stone-900)] mb-3">
          Didn&apos;t get the email?
        </h3>
        <ul className="text-sm text-[var(--color-stone-600)] space-y-2">
          <li>• Check your spam or junk folder</li>
          <li>• Make sure you entered the correct email</li>
          <li>• Wait a few minutes—sometimes it takes a moment</li>
        </ul>
      </div>

      <Link href="/login">
        <Button variant="secondary" fullWidth>
          Try again
        </Button>
      </Link>
    </div>
  )
}

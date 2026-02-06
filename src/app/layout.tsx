import type { Metadata } from "next"
import { Plus_Jakarta_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Vandra | Flight Deals That Find You",
  description:
    "Tell us where you dream of going. We'll watch the prices and text you when the perfect deal appears.",
  keywords: ["flight deals", "cheap flights", "travel alerts", "flight monitoring"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${playfair.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}

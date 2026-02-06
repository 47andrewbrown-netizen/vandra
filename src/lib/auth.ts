import { type NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { Resend } from "resend"

import { prisma } from "@/lib/prisma"

// Only initialize Resend if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    verifyRequest: "/check-email",
    error: "/login",
  },
  providers: [
    // Google OAuth - only if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    // Email (Magic Links) - only if Resend is configured
    ...(resend
      ? [
          EmailProvider({
            from: process.env.EMAIL_FROM || "Vandra <hello@vandra.com>",
            sendVerificationRequest: async ({ identifier: email, url }) => {
              try {
                await resend.emails.send({
                  from: process.env.EMAIL_FROM || "Vandra <hello@vandra.com>",
                  to: email,
                  subject: "Sign in to Vandra",
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      </head>
                      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FDFBF7; padding: 40px 20px;">
                        <div style="max-width: 460px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #E7E5E4;">
                          <div style="text-align: center; margin-bottom: 32px;">
                            <div style="display: inline-block; width: 48px; height: 48px; background: #2D5A47; border-radius: 50%; line-height: 48px; color: white; font-weight: bold; font-size: 20px;">V</div>
                            <h1 style="margin: 16px 0 0; color: #1C1917; font-size: 24px; font-weight: 600;">Sign in to Vandra</h1>
                          </div>
                          <p style="color: #57534E; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                            Click the button below to sign in to your account. This link will expire in 24 hours.
                          </p>
                          <a href="${url}" style="display: block; background: #2D5A47; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-weight: 500; text-align: center; font-size: 16px;">
                            Sign in to Vandra
                          </a>
                          <p style="color: #A8A29E; font-size: 14px; margin: 24px 0 0; text-align: center;">
                            If you didn't request this email, you can safely ignore it.
                          </p>
                        </div>
                      </body>
                    </html>
                  `,
                  text: `Sign in to Vandra\n\nClick here to sign in: ${url}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`,
                })
              } catch (error) {
                console.error("Failed to send magic link email:", error)
                throw new Error("Failed to send verification email")
              }
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      // Store if this is a new user (for redirect to subscription)
      if (account) {
        token.isNewUser = !user.emailVerified && account.type === "oauth"
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account }) {
      // Allow OAuth and email sign-ins
      if (account?.type === "oauth" || account?.type === "email") {
        return true
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      // If it's a callback URL we set, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default: send to onboarding for new flow
      return `${baseUrl}/onboarding`
    },
  },
  events: {
    async createUser({ user }) {
      // Log new user creation
      console.log("New user created:", user.email)
    },
  },
}

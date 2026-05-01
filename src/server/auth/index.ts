/**
 * Better Auth Server Configuration
 *
 * This is the server-side Better Auth instance. It MUST only be imported
 * from server-side code (API routes, oRPC middleware, etc.).
 *
 * DO NOT import this from client-side code — it pulls in database
 * dependencies that cannot be bundled for the browser.
 *
 * @see docs/implementation-plan.md — Step 8
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/server/db'
import { user, session, account, verification } from '@/server/db/schema/auth'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    'https://*.vercel.app',
  ],
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
})

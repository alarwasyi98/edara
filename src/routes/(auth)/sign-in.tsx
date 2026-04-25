import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth.functions'
import { shouldRedirectAuthenticatedUser } from '@/lib/auth-routing'
import { SignIn } from '@/features/auth/sign-in'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  beforeLoad: async () => {
    const sessionData = await getSession()

    if (shouldRedirectAuthenticatedUser(sessionData)) {
      throw redirect({ to: '/' })
    }
  },
  component: SignIn,
  validateSearch: searchSchema,
})

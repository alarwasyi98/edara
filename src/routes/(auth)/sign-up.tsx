import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth.functions'
import { shouldRedirectAuthenticatedUser } from '@/lib/auth-routing'
import { SignUp } from '@/features/auth/sign-up'

export const Route = createFileRoute('/(auth)/sign-up')({
  beforeLoad: async () => {
    const sessionData = await getSession()

    if (shouldRedirectAuthenticatedUser(sessionData)) {
      throw redirect({ to: '/' })
    }
  },
  component: SignUp,
})

import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '@/lib/auth.functions'
import { getAuthRedirectTarget, shouldAllowProtectedRoute } from '@/lib/auth-routing'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const sessionData = await getSession()

    if (!shouldAllowProtectedRoute(sessionData)) {
      throw redirect(getAuthRedirectTarget(location.href))
    }
  },
  component: AuthenticatedLayout,
})

import { createFileRoute } from '@tanstack/react-router'
import { createFileRoute, redirect } from '@tanstack/react-start'

export const Route = createFileRoute('/auth/')({
  loader: () => {
    throw redirect({ to: '/auth/sign-in' })
  },
})
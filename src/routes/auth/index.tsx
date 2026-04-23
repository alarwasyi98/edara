import { redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  loader: () => {
    throw redirect({ to: '/auth/sign-in' })
  },
})
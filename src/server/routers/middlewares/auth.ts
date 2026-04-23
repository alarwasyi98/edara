import { auth } from '@/lib/auth'
import { base } from '../context'
import { ORPCError } from '@orpc/server'

export const authMiddleware = base.middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({
    headers: context.headers,
  })

  if (!sessionData?.session || !sessionData?.user) {
    throw new ORPCError('UNAUTHORIZED', 'No valid session')
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user
    },
  })
})
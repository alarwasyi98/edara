import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { AppRouter } from '@/server/routers'
import type { RouterClient } from '@orpc/server'

const rpcLink = new RPCLink({
  url: '/api/rpc',
  fetch: (input, init) =>
    globalThis.fetch(input, { ...init, credentials: 'include' }),
})

export const client: RouterClient<AppRouter> = createORPCClient(rpcLink)

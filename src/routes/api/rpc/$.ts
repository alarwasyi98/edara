import { createFileRoute } from '@tanstack/react-router'
import { RPCHandler } from '@orpc/server/fetch'
import { appRouter } from '@/server/routers'

const handler = new RPCHandler(appRouter)

async function handleRequest(request: Request): Promise<Response> {
  const { response } = await handler.handle(request, {
    prefix: '/api/rpc',
    context: { headers: request.headers },
  })

  return response ?? new Response('Not Found', { status: 404 })
}

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleRequest(request),
      POST: ({ request }) => handleRequest(request),
    },
  },
})

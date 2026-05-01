import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
} from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { routeTree } from './routeTree.gen'

function PendingComponent(): React.ReactElement {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
    </div>
  )
}

export function createRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 1000,
      },
    },
  })

  return createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingComponent,
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
    dehydrate: () => ({
      queryClientState: dehydrate(queryClient),
    }),
    hydrate: (dehydrated) => {
      hydrate(queryClient, dehydrated.queryClientState)
    },
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })
}

// TanStack Start requires a named getRouter export!
export const getRouter = createRouter

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}

import { ORPCError } from '@orpc/server'

export function notFound(resource = 'Resource'): never {
  throw new ORPCError('NOT_FOUND', `${resource} not found`)
}

export function unauthorized(message = 'Authentication required'): never {
  throw new ORPCError('UNAUTHORIZED', message)
}

export function forbidden(message = 'Access denied'): never {
  throw new ORPCError('FORBIDDEN', message)
}

export function badRequest(message: string): never {
  throw new ORPCError('BAD_REQUEST', message)
}

export function conflict(message: string): never {
  throw new ORPCError('CONFLICT', message)
}

export function internalError(message = 'Internal server error'): never {
  throw new ORPCError('INTERNAL_SERVER_ERROR', message)
}

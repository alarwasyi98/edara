import * as z from 'zod'

// ── Identifiers ──────────────────────────────────────────────

export const uuidSchema = z.string().uuid()

export const idParam = z.object({ id: uuidSchema })

// ── Pagination ───────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export function paginationToOffset(input: PaginationInput): {
  limit: number
  offset: number
} {
  return {
    limit: input.pageSize,
    offset: (input.page - 1) * input.pageSize,
  }
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function paginate<T>(
  data: T[],
  total: number,
  input: PaginationInput,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.ceil(total / input.pageSize),
    },
  }
}

// ── Date Ranges ──────────────────────────────────────────────

export const dateRangeSchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((d) => d.from <= d.to, {
    message: 'from must be before or equal to to',
    path: ['from'],
  })

// ── Search & Filter ──────────────────────────────────────────

export const searchSchema = z.object({
  search: z.string().trim().max(255).optional(),
})

export const sortDirectionSchema = z.enum(['asc', 'desc']).default('asc')

export function sortableSchema<T extends string>(columns: readonly T[]) {
  return z.object({
    sortBy: z.enum(columns as unknown as [T, ...T[]]).optional(),
    sortDirection: sortDirectionSchema,
  })
}

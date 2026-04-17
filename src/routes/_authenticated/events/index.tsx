import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { KalenderActivities } from '@/features/events'

const kalenderSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  category: z
    .array(
      z.union([
        z.literal('akademik'),
        z.literal('keagamaan'),
        z.literal('olahraga'),
        z.literal('umum'),
      ])
    )
    .optional()
    .catch([]),
  title: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/events/')({
  validateSearch: kalenderSearchSchema,
  component: KalenderActivities,
})
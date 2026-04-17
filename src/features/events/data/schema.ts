import { z } from 'zod'

const eventCategorySchema = z.union([
    z.literal('akademik'),
    z.literal('keagamaan'),
    z.literal('olahraga'),
    z.literal('umum'),
])
export type EventCategory = z.infer<typeof eventCategorySchema>

export const eventSchema = z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    timeInfo: z.string().optional(),
    category: eventCategorySchema,
    description: z.string(),
    location: z.string().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})
export type CalendarEvent = z.infer<typeof eventSchema>

export const eventListSchema = z.array(eventSchema)

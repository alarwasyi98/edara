import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DataTeacher } from '@/features/teachers'

const guruSearchSchema = z.object({
    page: z.number().optional().catch(1),
    pageSize: z.number().optional().catch(10),
    status: z
        .array(z.union([z.literal('active'), z.literal('inactive')]))
        .optional()
        .catch([]),
    nama: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/teachers/')({
    validateSearch: guruSearchSchema,
    component: DataTeacher,
})

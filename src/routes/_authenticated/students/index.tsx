import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DataStudent } from '@/features/students'

const siswaSearchSchema = z.object({
    page: z.number().optional().catch(1),
    pageSize: z.number().optional().catch(10),
    status: z
        .array(
            z.union([
                z.literal('active'),
                z.literal('graduated'),
                z.literal('transferred'),
                z.literal('inactive'),
            ])
        )
        .optional()
        .catch([]),
    kelas: z.array(z.string()).optional().catch([]),
    nama: z.string().optional().catch(''),
    tahunMasuk: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/students/')({
    validateSearch: siswaSearchSchema,
    component: DataStudent,
})

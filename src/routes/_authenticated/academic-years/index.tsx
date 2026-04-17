import { createFileRoute } from '@tanstack/react-router'
import { TahunAjaran } from '@/features/academic-years'

export const Route = createFileRoute('/_authenticated/academic-years/')({
    component: TahunAjaran,
})

import { createFileRoute } from '@tanstack/react-router'
import { DetailStudent } from '@/features/students/detail'

export const Route = createFileRoute('/_authenticated/students/$id')({
    component: DetailStudent,
})

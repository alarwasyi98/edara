import { createFileRoute } from '@tanstack/react-router'
import { DataKelas } from '@/features/classes'

export const Route = createFileRoute('/_authenticated/classes/')({
    component: DataKelas,
})

import { createFileRoute } from '@tanstack/react-router'
import { DetailTeacher } from '@/features/teachers/detail'

export const Route = createFileRoute('/_authenticated/teachers/$id')({
    component: DetailTeacher,
})

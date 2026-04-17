import { createFileRoute } from '@tanstack/react-router'
import { GuruPenugasan } from '@/features/teachers/penugasan'

export const Route = createFileRoute('/_authenticated/teachers/penugasan')({
  component: GuruPenugasan,
})

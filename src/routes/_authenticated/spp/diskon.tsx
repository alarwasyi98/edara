import { createFileRoute } from '@tanstack/react-router'
import { DiskonSPP } from '@/features/spp/diskon'

export const Route = createFileRoute('/_authenticated/spp/diskon')({
  component: DiskonSPP,
})

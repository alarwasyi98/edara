import { createFileRoute } from '@tanstack/react-router'
import { SettingsUnits } from '@/features/settings/units'

export const Route = createFileRoute('/_authenticated/settings/units')({
  component: SettingsUnits,
})

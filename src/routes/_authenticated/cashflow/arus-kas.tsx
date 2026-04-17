import { createFileRoute } from '@tanstack/react-router'
import { CashflowFlow } from '@/features/cashflow/cashflow-flow'

export const Route = createFileRoute('/_authenticated/cashflow/arus-kas')({
  component: CashflowFlow,
})
import { createFileRoute } from '@tanstack/react-router'
import { CashflowTransactions } from '@/features/cashflow'

export const Route = createFileRoute('/_authenticated/cashflow/')({
    component: CashflowTransactions,
})

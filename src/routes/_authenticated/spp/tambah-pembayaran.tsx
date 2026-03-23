import { createFileRoute } from '@tanstack/react-router'
import { TransactionFormPage } from '@/features/spp/components/transaction-form'

export const Route = createFileRoute('/_authenticated/spp/tambah-pembayaran')({
    component: TransactionFormPage,
})

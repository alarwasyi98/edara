import { createFileRoute } from '@tanstack/react-router'
import { KeuanganAkun } from '@/features/cashflow/akun'

export const Route = createFileRoute('/_authenticated/cashflow/akun')({
  component: KeuanganAkun,
})

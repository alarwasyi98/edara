import { createFileRoute } from '@tanstack/react-router'
import { KeuanganLaporan } from '@/features/cashflow/laporan'

export const Route = createFileRoute('/_authenticated/cashflow/laporan')({
    component: KeuanganLaporan,
})

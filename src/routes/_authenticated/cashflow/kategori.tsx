import { createFileRoute } from '@tanstack/react-router'
import { KeuanganKategori } from '@/features/cashflow/kategori'

export const Route = createFileRoute('/_authenticated/cashflow/kategori')({
  component: KeuanganKategori,
})

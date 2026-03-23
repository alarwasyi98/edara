import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatBulanTagihan } from '@/lib/format'
import { getInitials, getAvatarColor } from '../data/mock-data'
import type { Student, Invoice, AppliedDiscount, PaymentMethod } from '../types'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

interface PaymentSummaryProps {
    student: Student | null
    selectedInvoices: Invoice[]
    installmentMap: Record<string, number | null>
    isInstallmentMode: boolean
    appliedDiscounts: AppliedDiscount[]
    paymentMethod: PaymentMethod
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
    tunai: 'Tunai',
    transfer: 'Transfer Bank',
    qris: 'QRIS',
}

export function PaymentSummary({
    student,
    selectedInvoices,
    installmentMap,
    isInstallmentMode,
    appliedDiscounts,
    paymentMethod,
}: PaymentSummaryProps) {
    // ── Kalkulasi ──────────────────────────────────────────────────────────────

    const lineItems = selectedInvoices.map(inv => {
        const amount = isInstallmentMode
            ? (installmentMap[inv.id] ?? inv.remaining)
            : inv.remaining
        return { inv, amount }
    })

    const subtotal = lineItems.reduce((s, { amount }) => s + amount, 0)

    // Stacking: 1 persentase terbesar + semua nominal
    const pctDiscount = appliedDiscounts
        .filter(d => d.tipe === 'persentase')
        .reduce((max, d) => (d.nilai > max ? d.nilai : max), 0)
    const nominalDiscounts = appliedDiscounts.filter(d => d.tipe === 'nominal')

    const discFromPct = Math.round(subtotal * (pctDiscount / 100))
    const discFromNominal = nominalDiscounts.reduce((s, d) => s + d.nilai, 0)
    const totalDiscount = Math.min(subtotal, discFromPct + discFromNominal)
    const grandTotal = Math.max(0, subtotal - totalDiscount)

    // Overpayment: jika ada tagihan cicilan yang melebihi remaining
    const hasOverpayment = isInstallmentMode && selectedInvoices.some(inv => {
        const amt = installmentMap[inv.id]
        return amt !== null && amt !== undefined && amt > inv.remaining
    })

    // Empty state
    if (!student) {
        return (
            <div className='flex flex-col items-center justify-center rounded-xl border border-dashed h-48 text-center text-muted-foreground px-6'>
                <p className='text-sm'>Ringkasan pembayaran</p>
                <p className='text-xs mt-1'>Pilih siswa dan tagihan untuk melihat total</p>
            </div>
        )
    }

    return (
        <div className='rounded-xl border bg-card overflow-hidden'>
            {/* Header siswa */}
            <div className='flex items-center gap-3 p-4 border-b bg-muted/30'>
                <Avatar className='h-9 w-9 shrink-0'>
                    <AvatarFallback className={cn('text-xs font-bold text-white', getAvatarColor(student.nama))}>
                        {getInitials(student.nama)}
                    </AvatarFallback>
                </Avatar>
                <div className='min-w-0'>
                    <p className='font-semibold text-sm leading-tight truncate'>{student.nama}</p>
                    <p className='text-xs text-muted-foreground'>{student.kelas} · NIS {student.nis}</p>
                </div>
            </div>

            <div className='p-4 space-y-3'>
                {/* Line items */}
                {lineItems.length === 0 ? (
                    <p className='text-xs text-muted-foreground text-center py-2'>
                        Belum ada tagihan dipilih
                    </p>
                ) : (
                    <div className='space-y-1.5'>
                        {lineItems.map(({ inv, amount }) => (
                            <div key={inv.id} className='flex items-start justify-between gap-2 text-sm'>
                                <span className='text-muted-foreground leading-tight text-xs flex-1'>
                                    {inv.posTagihan}
                                    {inv.monthYear && ` — ${formatBulanTagihan(inv.monthYear)}`}
                                </span>
                                <span className='font-mono text-xs font-medium shrink-0'>
                                    {formatRupiah(amount)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Diskon applied */}
                {appliedDiscounts.length > 0 && subtotal > 0 && (
                    <>
                        <Separator />
                        <div className='space-y-1'>
                            <p className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>Diskon</p>
                            {pctDiscount > 0 && (
                                <div className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>Diskon {pctDiscount}%</span>
                                    <span className='font-mono text-emerald-600 dark:text-emerald-400'>
                                        −{formatRupiah(discFromPct)}
                                    </span>
                                </div>
                            )}
                            {nominalDiscounts.map(d => (
                                <div key={d.id} className='flex justify-between text-xs'>
                                    <span className='text-muted-foreground'>{d.nama}</span>
                                    <span className='font-mono text-emerald-600 dark:text-emerald-400'>
                                        −{formatRupiah(d.nilai)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <Separator />

                {/* Subtotal & total */}
                {totalDiscount > 0 && (
                    <div className='flex justify-between text-xs text-muted-foreground'>
                        <span>Subtotal</span>
                        <span className='font-mono'>{formatRupiah(subtotal)}</span>
                    </div>
                )}

                <div className='flex justify-between items-center'>
                    <span className='text-sm font-semibold'>Total Pembayaran</span>
                    <span className='font-mono text-lg font-bold text-primary'>
                        {formatRupiah(grandTotal)}
                    </span>
                </div>

                {totalDiscount > 0 && (
                    <div className='flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1.5'>
                        <CheckCircle2 className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0' />
                        <span className='text-xs text-emerald-700 dark:text-emerald-300'>
                            Hemat {formatRupiah(totalDiscount)} dari diskon
                        </span>
                    </div>
                )}

                {/* Metode bayar */}
                <div className='flex justify-between text-xs text-muted-foreground pt-0.5'>
                    <span>Metode</span>
                    <span className='font-medium text-foreground'>{METHOD_LABEL[paymentMethod]}</span>
                </div>

                {/* Overpayment warning */}
                {hasOverpayment && (
                    <div className='flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2.5 py-2'>
                        <AlertTriangle className='h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5' />
                        <div>
                            <p className='text-xs font-medium text-amber-700 dark:text-amber-400 leading-tight'>
                                Nominal melebihi tagihan
                            </p>
                            <p className='text-[11px] text-amber-600 dark:text-amber-500 mt-0.5'>
                                Sisa kelebihan akan dialokasikan ke tagihan berikutnya.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Export calculation helper ─────────────────────────────────────────────────

export function calculateGrandTotal(
    selectedInvoices: Invoice[],
    installmentMap: Record<string, number | null>,
    isInstallmentMode: boolean,
    appliedDiscounts: AppliedDiscount[]
): number {
    const subtotal = selectedInvoices.reduce((s, inv) => {
        const amount = isInstallmentMode ? (installmentMap[inv.id] ?? inv.remaining) : inv.remaining
        return s + amount
    }, 0)
    const pctDiscount = appliedDiscounts
        .filter(d => d.tipe === 'persentase')
        .reduce((max, d) => (d.nilai > max ? d.nilai : max), 0)
    const discFromPct = Math.round(subtotal * (pctDiscount / 100))
    const discFromNominal = appliedDiscounts.filter(d => d.tipe === 'nominal').reduce((s, d) => s + d.nilai, 0)
    const totalDiscount = Math.min(subtotal, discFromPct + discFromNominal)
    return Math.max(0, subtotal - totalDiscount)
}

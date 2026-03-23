
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatBulanTagihan } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Invoice } from '../types'

interface BillListProps {
    invoices: Invoice[]
    isLoading: boolean
    selectedIds: string[]
    installmentMap: Record<string, number | null> // invoiceId → nominal (null = full)
    isInstallmentMode: boolean
    onToggle: (id: string) => void
    onInstallmentChange: (invoiceId: string, amount: number | null) => void
}

const statusConfig = {
    unpaid: { label: 'Belum Bayar', className: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    partial: { label: 'Cicilan', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
    overdue: { label: 'Menunggak', className: 'border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
    paid: { label: 'Lunas', className: 'border-green-200 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
}

export function BillList({
    invoices,
    isLoading,
    selectedIds,
    installmentMap,
    isInstallmentMode,
    onToggle,
    onInstallmentChange,
}: BillListProps) {
    // Loading skeleton
    if (isLoading) {
        return (
            <div className='space-y-2'>
                {[1, 2, 3].map(i => (
                    <div key={i} className='flex items-center gap-3 rounded-lg border px-3 py-3'>
                        <Skeleton className='h-4 w-4 rounded' />
                        <div className='flex-1 space-y-1.5'>
                            <Skeleton className='h-3.5 w-40' />
                            <Skeleton className='h-3 w-24' />
                        </div>
                        <Skeleton className='h-5 w-20' />
                    </div>
                ))}
            </div>
        )
    }

    // Empty — siswa belum dipilih
    if (invoices.length === 0) {
        return (
            <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-muted-foreground'>
                <p className='text-sm'>Tidak ada tagihan aktif</p>
                <p className='text-xs mt-1'>Semua tagihan sudah lunas 🎉</p>
            </div>
        )
    }

    // Pisahkan tagihan SPP bulanan dan non-bulanan
    const sppBills = invoices.filter(inv => inv.posTagihan === 'SPP Bulanan')
    const otherBills = invoices.filter(inv => inv.posTagihan !== 'SPP Bulanan')

    const renderBillRow = (inv: Invoice) => {
        const isSelected = selectedIds.includes(inv.id)
        const Config = statusConfig[inv.status]
        const progressPct = Math.round((inv.paidAmount / inv.originalAmount) * 100)
        const installmentValue = installmentMap[inv.id]

        return (
            <div
                key={inv.id}
                className={cn(
                    'group rounded-lg border transition-colors duration-150',
                    isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-border/80 hover:bg-muted/30',
                )}
            >
                {/* Row utama */}
                <div
                    className='flex cursor-pointer items-start gap-3 px-3 py-2.5'
                    onClick={() => onToggle(inv.id)}
                >
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggle(inv.id)}
                        className='mt-0.5 shrink-0'
                        onClick={e => e.stopPropagation()}
                    />
                    <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium leading-tight'>
                            {inv.posTagihan}
                            {inv.monthYear && (
                                <span className='text-muted-foreground font-normal'>
                                    {' '}— {formatBulanTagihan(inv.monthYear)}
                                </span>
                            )}
                        </p>

                        {/* Progress bar cicilan */}
                        {inv.status === 'partial' && (
                            <div className='mt-1.5 flex items-center gap-2'>
                                <div className='flex-1 h-1.5 rounded-full bg-muted overflow-hidden'>
                                    <div
                                        className='h-full rounded-full bg-blue-500 transition-all'
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                                <span className='text-[11px] text-muted-foreground whitespace-nowrap'>
                                    {progressPct}% terbayar
                                </span>
                            </div>
                        )}
                    </div>

                    <div className='flex flex-col items-end gap-1 shrink-0'>
                        <span className='font-mono text-sm font-medium'>
                            {formatRupiah(inv.remaining)}
                        </span>
                        <Badge variant='outline' className={cn('text-[10px] py-0 h-4', Config.className)}>
                            {Config.label}
                        </Badge>
                    </div>
                </div>

                {/* Input cicilan (muncul jika mode cicilan + selected) */}
                {isInstallmentMode && isSelected && (
                    <div
                        className='border-t px-3 pb-2.5 pt-2'
                        onClick={e => e.stopPropagation()}
                    >
                        <Label className='text-xs text-muted-foreground mb-1.5 block'>
                            Nominal cicilan (maks. {formatRupiah(inv.remaining)})
                        </Label>
                        <div className='relative'>
                            <span className='absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground'>
                                Rp
                            </span>
                            <Input
                                type='number'
                                className='pl-8 h-8 text-sm'
                                placeholder={String(inv.remaining)}
                                min={1}
                                max={inv.remaining}
                                value={installmentValue ?? ''}
                                onChange={e => {
                                    const val = e.target.value === '' ? null : Number(e.target.value)
                                    onInstallmentChange(inv.id, val)
                                }}
                            />
                        </div>
                        {installmentValue !== null && installmentValue !== undefined && installmentValue > inv.remaining && (
                            <p className='text-xs text-amber-600 mt-1'>
                                ⚠ Melebihi sisa tagihan ({formatRupiah(inv.remaining)})
                            </p>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className='space-y-3'>
            {sppBills.length > 0 && (
                <div className='space-y-1.5'>
                    <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5'>
                        SPP Bulanan
                    </p>
                    {sppBills.map(renderBillRow)}
                </div>
            )}

            {otherBills.length > 0 && sppBills.length > 0 && <Separator />}

            {otherBills.length > 0 && (
                <div className='space-y-1.5'>
                    <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider px-0.5'>
                        Tagihan Lainnya
                    </p>
                    {otherBills.map(renderBillRow)}
                </div>
            )}
        </div>
    )
}

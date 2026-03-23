import * as React from 'react'
import { Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { formatRupiah } from '@/lib/format'
import { MOCK_DISCOUNTS } from '../data/mock-data'
import type { Discount, AppliedDiscount } from '../types'

const KATEGORI_COLOR: Record<string, string> = {
    yatim: 'border-purple-200 bg-purple-100/50 text-purple-800 dark:text-purple-300 dark:border-purple-800 dark:bg-purple-950/30',
    dhuafa: 'border-amber-200 bg-amber-100/50 text-amber-800 dark:text-amber-300 dark:border-amber-800 dark:bg-amber-950/30',
    prestasi: 'border-blue-200 bg-blue-100/50 text-blue-800 dark:text-blue-300 dark:border-blue-800 dark:bg-blue-950/30',
    pegawai: 'border-green-200 bg-green-100/50 text-green-800 dark:text-green-300 dark:border-green-800 dark:bg-green-950/30',
    'kakak-adik': 'border-cyan-200 bg-cyan-100/50 text-cyan-800 dark:text-cyan-300 dark:border-cyan-800 dark:bg-cyan-950/30',
    lainnya: 'border-neutral-200 bg-neutral-100/50 text-neutral-700 dark:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/30',
}

interface DiscountSelectorProps {
    subtotal: number
    applied: AppliedDiscount[]
    onChange: (discounts: AppliedDiscount[]) => void
}

/**
 * Stacking rules:
 * - Ambil 1 diskon persentase terbesar (tidak kumulatif)
 * - Diskon nominal boleh banyak
 * - Total diskon tidak melebihi subtotal
 */
function calculateAppliedAmount(discount: Discount, subtotal: number, appliedList: AppliedDiscount[]): number {
    if (discount.tipe === 'persentase') {
        // Ambil % terbesar saja yang berlaku
        const maxPct = Math.max(
            discount.nilai,
            ...appliedList.filter(d => d.tipe === 'persentase').map(d => d.nilai)
        )
        if (discount.nilai < maxPct) return 0
        return Math.round(subtotal * (discount.nilai / 100))
    }
    // Nominal: langsung dikurangi
    return discount.nilai
}

export function DiscountSelector({ subtotal, applied, onChange }: DiscountSelectorProps) {
    const [open, setOpen] = React.useState(false)

    const activeDiscounts = MOCK_DISCOUNTS.filter(d => d.aktif)

    const isApplied = (id: string) => applied.some(a => a.id === id)

    const handleToggle = (discount: Discount) => {
        if (isApplied(discount.id)) {
            onChange(applied.filter(a => a.id !== discount.id))
            return
        }
        // Cek konflik: sudah ada diskon persentase yg lebih besar
        if (discount.tipe === 'persentase') {
            const existingPct = applied.filter(a => a.tipe === 'persentase')
            // Jika sudah ada yang lebih besar, ganti
            const newList = applied.filter(a => a.tipe !== 'persentase')
            const appliedAmount = Math.round(subtotal * (discount.nilai / 100))
            onChange([...newList, { ...discount, appliedAmount }])
            return
        }
        // Nominal: langsung append
        onChange([...applied, { ...discount, appliedAmount: discount.nilai }])
    }

    const handleRemove = (id: string) => {
        onChange(applied.filter(a => a.id !== id))
    }

    return (
        <div className='space-y-2'>
            {/* Applied pills */}
            {applied.length > 0 && (
                <div className='flex flex-wrap gap-1.5'>
                    {applied.map(d => (
                        <Badge
                            key={d.id}
                            variant='outline'
                            className={cn('gap-1.5 pr-1 pl-2 py-0.5 text-xs font-normal', KATEGORI_COLOR[d.kategori])}
                        >
                            <span>
                                {d.nama}
                                <span className='ml-1 font-semibold'>
                                    {d.tipe === 'persentase'
                                        ? `${d.nilai}%`
                                        : `−${formatRupiah(d.nilai)}`}
                                </span>
                            </span>
                            <button
                                type='button'
                                onClick={() => handleRemove(d.id)}
                                className='ml-0.5 rounded-sm opacity-70 hover:opacity-100'
                            >
                                <X className='h-3 w-3' />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            {/* Add button */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant='outline' size='sm' className='gap-1.5 text-xs h-8'>
                        <Plus className='h-3.5 w-3.5' />
                        Tambah Diskon
                    </Button>
                </PopoverTrigger>
                <PopoverContent className='w-72 p-2' align='start'>
                    <p className='px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1'>
                        Diskon Tersedia
                    </p>
                    <div className='space-y-0.5 max-h-64 overflow-y-auto'>
                        {activeDiscounts.map(discount => {
                            const checked = isApplied(discount.id)
                            const isPct = discount.tipe === 'persentase'
                            // Disable diskon pct yang lebih kecil dari yang sudah dipilih
                            const appliedPct = applied.find(a => a.tipe === 'persentase')
                            const isDisabled = isPct && appliedPct && discount.nilai < appliedPct.nilai

                            return (
                                <button
                                    key={discount.id}
                                    type='button'
                                    disabled={!!isDisabled}
                                    onClick={() => handleToggle(discount)}
                                    className={cn(
                                        'flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
                                        'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                                        'disabled:cursor-not-allowed disabled:opacity-40',
                                        checked && 'bg-primary/5'
                                    )}
                                >
                                    <div className={cn(
                                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                                        checked ? 'border-primary bg-primary' : 'border-input'
                                    )}>
                                        {checked && <Check className='h-3 w-3 text-primary-foreground' />}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-medium leading-tight'>{discount.nama}</p>
                                        <p className='text-xs text-muted-foreground mt-0.5 leading-tight'>
                                            {isPct ? `${discount.nilai}% dari total tagihan` : `Potongan ${formatRupiah(discount.nilai)}`}
                                        </p>
                                    </div>
                                    <Badge
                                        variant='outline'
                                        className={cn('shrink-0 text-[10px] py-0 h-4', KATEGORI_COLOR[discount.kategori])}
                                    >
                                        {isPct ? `${discount.nilai}%` : formatRupiah(discount.nilai)}
                                    </Badge>
                                </button>
                            )
                        })}
                    </div>
                    {subtotal === 0 && (
                        <p className='text-xs text-muted-foreground text-center mt-2 px-2'>
                            Pilih tagihan terlebih dahulu untuk menerapkan diskon.
                        </p>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    )
}

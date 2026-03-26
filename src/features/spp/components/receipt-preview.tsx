import * as React from 'react'
import { Printer, MessageCircle, Building2, Banknote, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatRupiah, formatBulanTagihan, formatDate } from '@/lib/format'
import type { CompletedPayment } from '../types'

interface ReceiptPreviewProps {
    payment: CompletedPayment
    schoolName?: string
}

const METHOD_ICON: Record<string, React.ReactNode> = {
    tunai: <Banknote className='h-3.5 w-3.5' />,
    transfer: <Building2 className='h-3.5 w-3.5' />,
    qris: <QrCode className='h-3.5 w-3.5' />,
}

const METHOD_LABEL: Record<string, string> = {
    tunai: 'Tunai',
    transfer: 'Transfer Bank',
    qris: 'QRIS',
}

export function ReceiptPreview({
    payment,
    schoolName = 'Madrasah Tsanawiyah',
}: ReceiptPreviewProps) {

    const handlePrint = () => {
        window.print()
    }

    const handleWhatsApp = () => {
        if (!payment.student.nomorWa) return
        const lines = [
            `*KWITANSI PEMBAYARAN*`,
            `No: ${payment.transactionNumber}`,
            `Tanggal: ${formatDate(payment.paymentDate)}`,
            ``,
            `Nama  : ${payment.student.nama}`,
            `Kelas : ${payment.student.kelas}`,
            `NIS   : ${payment.student.nis}`,
            ``,
            `*Rincian Pembayaran:*`,
            ...payment.allocations.map(a =>
                `• ${a.posTagihan}${a.monthYear ? ` (${formatBulanTagihan(a.monthYear)})` : ''}: ${formatRupiah(a.amount)}`
            ),
            ``,
            payment.discountAmount > 0 ? `Diskon : −${formatRupiah(payment.discountAmount)}` : null,
            `━━━━━━━━━━━━━━━━━━━━`,
            `*TOTAL : ${formatRupiah(payment.netAmount)}*`,
            `Metode : ${METHOD_LABEL[payment.paymentMethod]}`,
            ``,
            `_Terima kasih atas kepercayaan Bapak/Ibu._`,
            `_${schoolName}_`,
        ]
            .filter(Boolean)
            .join('\n')

        const url = `https://wa.me/${payment.student.nomorWa}?text=${encodeURIComponent(lines)}`
        window.open(url, '_blank')
    }

    return (
        <div className='space-y-3'>
            {/* Receipt card */}
            <div className='rounded-xl border bg-card overflow-hidden receipt-preview'>
                {/* Header */}
                <div className='bg-primary px-4 py-3 text-primary-foreground text-center'>
                    <p className='text-xs font-medium uppercase tracking-widest opacity-80'>Kwitansi Pembayaran</p>
                    <p className='text-base font-bold mt-0.5'>{schoolName}</p>
                </div>

                <div className='p-4 space-y-3 font-mono text-xs'>
                    {/* Meta */}
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>No. Kwitansi</span>
                        <span className='font-semibold text-right'>{payment.transactionNumber}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Tanggal</span>
                        <span>{formatDate(payment.paymentDate)}</span>
                    </div>

                    <Separator />

                    {/* Siswa */}
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Nama Siswa</span>
                        <span className='text-right font-medium max-w-[180px] truncate'>{payment.student.nama}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Kelas / NIS</span>
                        <span>{payment.student.kelas} / {payment.student.nis}</span>
                    </div>

                    <Separator />

                    {/* Line items */}
                    <div className='space-y-1.5'>
                        {payment.allocations.map((a, i) => (
                            <div key={i} className='flex justify-between items-start gap-2'>
                                <span className='text-muted-foreground leading-tight flex-1'>
                                    {a.posTagihan}
                                    {a.monthYear && (
                                        <span className='block text-[10px]'>{formatBulanTagihan(a.monthYear)}</span>
                                    )}
                                </span>
                                <span className='shrink-0'>{formatRupiah(a.amount)}</span>
                            </div>
                        ))}
                    </div>

                    {payment.discountAmount > 0 && (
                        <>
                            <Separator className='border-dashed' />
                            <div className='flex justify-between text-emerald-700 dark:text-emerald-400'>
                                <span>Diskon</span>
                                <span>−{formatRupiah(payment.discountAmount)}</span>
                            </div>
                        </>
                    )}

                    <Separator className='border-double border-t-2' />

                    {/* Total */}
                    <div className='flex justify-between items-center font-bold text-sm'>
                        <span>TOTAL</span>
                        <span className='text-base'>{formatRupiah(payment.netAmount)}</span>
                    </div>

                    {/* Metode */}
                    <div className='flex justify-between text-muted-foreground'>
                        <span>Metode Bayar</span>
                        <span className='flex items-center gap-1'>
                            {METHOD_ICON[payment.paymentMethod]}
                            {METHOD_LABEL[payment.paymentMethod]}
                        </span>
                    </div>

                    {payment.notes && (
                        <>
                            <Separator className='border-dashed' />
                            <p className='text-muted-foreground italic'>{payment.notes}</p>
                        </>
                    )}

                    {/* Footer */}
                    <Separator />
                    <p className='text-center text-muted-foreground text-[10px]'>
                        Kwitansi ini sah sebagai bukti pembayaran resmi.
                    </p>
                </div>
            </div>

            {/* Action buttons */}
            <div className='grid grid-cols-2 gap-2'>
                <Button
                    variant='outline'
                    size='sm'
                    className='gap-1.5 text-xs'
                    onClick={handlePrint}
                >
                    <Printer className='h-3.5 w-3.5' />
                    Cetak
                </Button>
                <Button
                    size='sm'
                    className='gap-1.5 text-xs bg-[#25D366] hover:bg-[#22c35e] text-white dark:bg-[#25D366] dark:hover:bg-[#22c35e]'
                    onClick={handleWhatsApp}
                    disabled={!payment.student.nomorWa}
                >
                    <MessageCircle className='h-3.5 w-3.5' />
                    WhatsApp
                </Button>
            </div>
        </div>
    )
}

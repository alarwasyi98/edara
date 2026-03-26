import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
    ArrowLeft,
    CalendarDays,
    ChevronRight,
    FileText,
    Loader2,
    ReceiptText,
    StickyNote,
    ToggleLeft,
    User,
    Wallet,
    BadgePercent,
    CheckCircle2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

import { DateInputPicker } from '@/components/date-input-picker'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ConfigDrawer } from '@/components/config-drawer'

import { StudentSearch } from './student-search'
import { BillList } from './bill-list'
import { PaymentMethodSelector } from './payment-method-selector'
import { DiscountSelector } from './discount-selector'
import { PaymentSummary, calculateGrandTotal } from './payment-summary'
import { ReceiptPreview } from './receipt-preview'

import { getMockInvoices, generateTransactionNumber } from '../data/mock-data'
import type {
    Student,
    Invoice,
    AppliedDiscount,
    PaymentMethod,
    CompletedPayment,
} from '../types'
import { cn } from '@/lib/utils'

// ──────────────────────────────────────────────────────────────────────────────

function SectionHeading({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description?: string
}) {
    return (
        <div className='flex items-start gap-2.5 mb-3'>
            <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground'>
                {icon}
            </div>
            <div>
                <p className='text-sm font-semibold leading-tight'>{title}</p>
                {description && (
                    <p className='text-xs text-muted-foreground mt-0.5'>{description}</p>
                )}
            </div>
        </div>
    )
}

// ──────────────────────────────────────────────────────────────────────────────

export function TransactionFormPage() {
    const navigate = useNavigate()
    const today = new Date().toISOString().split('T')[0]

    // ── State ────────────────────────────────────────────────────────────────
    const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
    const [invoices, setInvoices] = React.useState<Invoice[]>([])
    const [isLoadingBills, setIsLoadingBills] = React.useState(false)

    const [selectedBillIds, setSelectedBillIds] = React.useState<string[]>([])
    const [isInstallmentMode, setIsInstallmentMode] = React.useState(false)
    const [installmentMap, setInstallmentMap] = React.useState<Record<string, number | null>>({})

    const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>('tunai')
    const [paymentDate, setPaymentDate] = React.useState<string | null>(today)
    const [notes, setNotes] = React.useState('')

    const [appliedDiscounts, setAppliedDiscounts] = React.useState<AppliedDiscount[]>([])

    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [completedPayment, setCompletedPayment] = React.useState<CompletedPayment | null>(null)

    // ── Derived ──────────────────────────────────────────────────────────────
    const selectedInvoices = React.useMemo(
        () => invoices.filter(inv => selectedBillIds.includes(inv.id)),
        [invoices, selectedBillIds]
    )

    const grandTotal = React.useMemo(
        () => calculateGrandTotal(selectedInvoices, installmentMap, isInstallmentMode, appliedDiscounts),
        [selectedInvoices, installmentMap, isInstallmentMode, appliedDiscounts]
    )

    const canSubmit =
        !!selectedStudent &&
        selectedBillIds.length > 0 &&
        grandTotal > 0 &&
        !isSubmitting

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleStudentChange = (student: Student | null) => {
        setSelectedStudent(student)
        setSelectedBillIds([])
        setInstallmentMap({})
        setAppliedDiscounts([])
        setInvoices([])
        setCompletedPayment(null)

        if (student) {
            setIsLoadingBills(true)
            // Simulasi async fetch 600ms
            setTimeout(() => {
                setInvoices(getMockInvoices(student.id))
                setIsLoadingBills(false)
            }, 600)
        }
    }

    const handleBillToggle = (id: string) => {
        setSelectedBillIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
        // Reset installment input saat untoggle
        if (selectedBillIds.includes(id)) {
            setInstallmentMap(prev => {
                const next = { ...prev }
                delete next[id]
                return next
            })
        }
    }

    const handleInstallmentChange = (invoiceId: string, amount: number | null) => {
        setInstallmentMap(prev => ({ ...prev, [invoiceId]: amount }))
    }

    const handleInstallmentModeToggle = (checked: boolean) => {
        setIsInstallmentMode(checked)
        if (!checked) {
            setInstallmentMap({})
        }
    }

    const handleSubmit = async () => {
        if (!selectedStudent || !canSubmit) return
        setIsSubmitting(true)

        // Simulasi API call 1.2 detik
        await new Promise(res => setTimeout(res, 1200))

        const subtotal = selectedInvoices.reduce((s, inv) => {
            const amount = isInstallmentMode ? (installmentMap[inv.id] ?? inv.remaining) : inv.remaining
            return s + amount
        }, 0)
        const discAmount = subtotal - grandTotal

        const payment: CompletedPayment = {
            transactionNumber: generateTransactionNumber(),
            student: selectedStudent,
            paymentDate: paymentDate ?? today,
            paymentMethod,
            allocations: selectedInvoices.map(inv => ({
                invoiceId: inv.id,
                posTagihan: inv.posTagihan,
                monthYear: inv.monthYear,
                amount: isInstallmentMode ? (installmentMap[inv.id] ?? inv.remaining) : inv.remaining,
            })),
            appliedDiscounts,
            subtotal,
            discountAmount: discAmount,
            netAmount: grandTotal,
            notes,
        }

        setCompletedPayment(payment)
        setIsSubmitting(false)
        toast.success('Pembayaran berhasil disimpan!', {
            description: `${payment.transactionNumber} — ${selectedStudent.nama}`,
        })
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className='flex flex-1 flex-col'>
                {/* Page header */}
                <div className='flex items-center gap-3 mb-6'>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 shrink-0'
                        onClick={() => navigate({ to: '/spp' })}
                    >
                        <ArrowLeft className='h-4 w-4' />
                    </Button>
                    <div>
                        <h1 className='text-lg font-bold leading-tight'>Tambah Pembayaran</h1>
                        <p className='text-xs text-muted-foreground'>
                            Catat pembayaran SPP siswa secara manual
                        </p>
                    </div>
                    {completedPayment && (
                        <div className='ml-auto flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-1.5'>
                            <CheckCircle2 className='h-4 w-4' />
                            <span className='text-xs font-medium'>Pembayaran tersimpan</span>
                        </div>
                    )}
                </div>

                {/* 2-panel layout */}
                <div className='grid gap-6 lg:grid-cols-5 lg:gap-8 flex-1'>

                    {/* ── Panel Kiri: Form ── */}
                    <div className='lg:col-span-3 space-y-6'>

                        {/* Section 1: Pilih Siswa */}
                        <div>
                            <SectionHeading
                                icon={<User className='h-3.5 w-3.5' />}
                                title='Pilih Siswa'
                                description='Cari berdasarkan nama, NIS, atau kelas'
                            />
                            <StudentSearch
                                value={selectedStudent}
                                onChange={handleStudentChange}
                            />
                        </div>

                        <Separator />

                        {/* Section 2: Tagihan Aktif */}
                        <div className={cn(!selectedStudent && 'opacity-50 pointer-events-none')}>
                            <div className='flex items-start justify-between mb-3'>
                                <SectionHeading
                                    icon={<FileText className='h-3.5 w-3.5' />}
                                    title='Tagihan Aktif'
                                    description={
                                        selectedStudent
                                            ? `${invoices.length} tagihan ditemukan`
                                            : 'Pilih siswa terlebih dahulu'
                                    }
                                />
                                {/* Cicilan toggle — hanya tampil setelah siswa dipilih */}
                                {selectedStudent && invoices.length > 0 && (
                                    <div className='flex items-center gap-2 shrink-0'>
                                        <Label htmlFor='cicilan-mode' className='text-xs text-muted-foreground cursor-pointer select-none'>
                                            Mode Cicilan
                                        </Label>
                                        <Switch
                                            id='cicilan-mode'
                                            checked={isInstallmentMode}
                                            onCheckedChange={handleInstallmentModeToggle}
                                        />
                                    </div>
                                )}
                            </div>

                            {isInstallmentMode && (
                                <div className='mb-3 flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2'>
                                    <ToggleLeft className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0' />
                                    <p className='text-xs text-blue-700 dark:text-blue-300'>
                                        Mode cicilan aktif. Isi nominal per tagihan yang ingin dibayarkan.
                                        Kosongkan untuk bayar penuh.
                                    </p>
                                </div>
                            )}

                            <BillList
                                invoices={invoices}
                                isLoading={isLoadingBills}
                                selectedIds={selectedBillIds}
                                installmentMap={installmentMap}
                                isInstallmentMode={isInstallmentMode}
                                onToggle={handleBillToggle}
                                onInstallmentChange={handleInstallmentChange}
                            />
                        </div>

                        <Separator />

                        {/* Section 3: Metode Bayar */}
                        <div>
                            <SectionHeading
                                icon={<Wallet className='h-3.5 w-3.5' />}
                                title='Metode Pembayaran'
                                description='Pilih metode pembayaran yang digunakan'
                            />
                            <PaymentMethodSelector
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                            />
                        </div>

                        <Separator />

                        {/* Section 4: Diskon */}
                        <div className={cn(selectedBillIds.length === 0 && 'opacity-50 pointer-events-none')}>
                            <SectionHeading
                                icon={<BadgePercent className='h-3.5 w-3.5' />}
                                title='Diskon & Subsidi'
                                description='Opsional — diskon akan diterapkan ke total tagihan'
                            />
                            <DiscountSelector
                                subtotal={selectedInvoices.reduce((s, inv) => s + inv.remaining, 0)}
                                applied={appliedDiscounts}
                                onChange={setAppliedDiscounts}
                            />
                        </div>

                        <Separator />

                        {/* Section 5: Tanggal + Catatan */}
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div>
                                <SectionHeading
                                    icon={<CalendarDays className='h-3.5 w-3.5' />}
                                    title='Tanggal Bayar'
                                    description='Pilih tanggal transaksi ini'
                                />
                                <DateInputPicker
                                    value={paymentDate}
                                    onChange={setPaymentDate}
                                    className='w-full'
                                />
                            </div>
                            <div>
                                <SectionHeading
                                    icon={<StickyNote className='h-3.5 w-3.5' />}
                                    title='Catatan'
                                    description='Opsional'
                                />
                                <Textarea
                                    placeholder='Tambahkan catatan pembayaran...'
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                    className='resize-none text-sm'
                                />
                            </div>
                        </div>

                        {/* Footer aksi */}
                        <div className='flex gap-3 pt-2 pb-6'>
                            <Button
                                variant='outline'
                                className='flex-1'
                                onClick={() => navigate({ to: '/spp' })}
                            >
                                Batal
                            </Button>
                            <Button
                                className='flex-1 gap-2'
                                disabled={!canSubmit}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        Proses Pembayaran
                                        <ChevronRight className='h-4 w-4' />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* ── Panel Kanan: Summary & Receipt ── */}
                    <div className='lg:col-span-2'>
                        <div className='lg:sticky lg:top-20 space-y-4'>
                            <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
                                <ReceiptText className='h-4 w-4' />
                                Ringkasan Pembayaran
                            </div>

                            <PaymentSummary
                                student={selectedStudent}
                                selectedInvoices={selectedInvoices}
                                installmentMap={installmentMap}
                                isInstallmentMode={isInstallmentMode}
                                appliedDiscounts={appliedDiscounts}
                                paymentMethod={paymentMethod}
                            />

                            {/* Receipt preview muncul setelah submit berhasil */}
                            {completedPayment && (
                                <>
                                    <Separator />
                                    <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground'>
                                        <ReceiptText className='h-4 w-4' />
                                        Kwitansi
                                    </div>
                                    <ReceiptPreview payment={completedPayment} />
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </Main>
        </>
    )
}

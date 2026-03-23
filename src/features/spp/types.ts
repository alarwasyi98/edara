// ─── SPP Payment Status ────────────────────────────────────────────────────────

export type SppStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'

// ─── Student ──────────────────────────────────────────────────────────────────

export type Student = {
    id: string
    nis: string
    nama: string
    kelas: string
    nomorWa?: string
}

// ─── Invoice (Tagihan per Siswa per Bulan/Jenis) ──────────────────────────────

export type Invoice = {
    id: string
    studentId: string
    posTagihan: string      // e.g. "SPP", "Ujian Akhir Semester", "Kegiatan"
    monthYear: string       // e.g. "2026-03" (null jika tagihan non-bulanan)  
    originalAmount: number
    paidAmount: number
    remaining: number
    status: SppStatus
    dueDate: string | null
}

// ─── Discount ─────────────────────────────────────────────────────────────────

export type TipeDiskon = 'persentase' | 'nominal'
export type KategoriDiskon = 'yatim' | 'dhuafa' | 'prestasi' | 'pegawai' | 'kakak-adik' | 'lainnya'

export type Discount = {
    id: string
    nama: string
    tipe: TipeDiskon
    nilai: number       // % (0–100) atau nominal rupiah
    kategori: KategoriDiskon
    keterangan: string
    aktif: boolean
}

export type AppliedDiscount = Discount & {
    appliedAmount: number  // nilai diskon yang benar-benar diaplikasikan (setelah clamp)
}

// ─── Installment (Cicilan per Tagihan) ───────────────────────────────────────

export type InstallmentEntry = {
    invoiceId: string
    manualAmount: number | null   // null = bayar penuh (remaining)
}

// ─── Payment Summary (real-time calculation) ─────────────────────────────────

export type PaymentSummary = {
    selectedInvoices: Invoice[]
    installmentMap: Record<string, number>   // invoiceId → amount to pay
    subtotal: number
    totalDiscountAmount: number
    grandTotal: number
    isOverpayment: boolean
    excessAmount: number
}

// ─── Payment Method ───────────────────────────────────────────────────────────

export type PaymentMethod = 'tunai' | 'transfer' | 'qris'

// ─── Completed Payment (setelah submit) ──────────────────────────────────────

export type CompletedPayment = {
    transactionNumber: string
    student: Student
    paymentDate: string
    paymentMethod: PaymentMethod
    allocations: Array<{
        invoiceId: string
        posTagihan: string
        monthYear: string | null
        amount: number
    }>
    appliedDiscounts: AppliedDiscount[]
    subtotal: number
    discountAmount: number
    netAmount: number
    notes: string
}

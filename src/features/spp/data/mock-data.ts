import { faker } from '@faker-js/faker'
import type { Student, Invoice, Discount, SppStatus } from '../types'

faker.seed(42424242)

// ─── Mock Students ────────────────────────────────────────────────────────────

export const MOCK_STUDENTS: Student[] = [
    { id: 's-001', nis: '2024001', nama: 'Ahmad Rizki Fadillah', kelas: 'VII-A', nomorWa: '6281234560001' },
    { id: 's-002', nis: '2024002', nama: 'Nisa Putri Ayunda', kelas: 'VII-A', nomorWa: '6281234560002' },
    { id: 's-003', nis: '2024003', nama: 'Muhammad Faqih Al-Ghifari', kelas: 'VII-B', nomorWa: '6281234560003' },
    { id: 's-004', nis: '2024004', nama: 'Siti Aminah Rahayu', kelas: 'VII-C', nomorWa: '6281234560004' },
    { id: 's-005', nis: '2024005', nama: 'Hasan Ridwan Maulana', kelas: 'VIII-A', nomorWa: '6281234560005' },
    { id: 's-006', nis: '2024006', nama: 'Zahra Khadijah Putri', kelas: 'VIII-A', nomorWa: '6281234560006' },
    { id: 's-007', nis: '2024007', nama: 'Bayu Pratama Setiawan', kelas: 'VIII-B', nomorWa: '6281234560007' },
    { id: 's-008', nis: '2024008', nama: 'Fatimah Azzahra Dewi', kelas: 'VIII-C', nomorWa: '6281234560008' },
    { id: 's-009', nis: '2024009', nama: 'Irfan Maulana Hakim', kelas: 'IX-A', nomorWa: '6281234560009' },
    { id: 's-010', nis: '2024010', nama: 'Layla Rahma Wulandari', kelas: 'IX-A', nomorWa: '6281234560010' },
    { id: 's-011', nis: '2024011', nama: 'Galih Nugroho Santoso', kelas: 'IX-B', nomorWa: '6281234560011' },
    { id: 's-012', nis: '2024012', nama: 'Annisa Dewi Pertiwi', kelas: 'IX-B', nomorWa: '6281234560012' },
    { id: 's-013', nis: '2024013', nama: 'Rafi Hidayatullah', kelas: 'VII-B', nomorWa: '6281234560013' },
    { id: 's-014', nis: '2024014', nama: 'Salma Utami Ningrum', kelas: 'VIII-A', nomorWa: '6281234560014' },
    { id: 's-015', nis: '2024015', nama: 'Dani Kurniawan Putra', kelas: 'IX-C', nomorWa: '6281234560015' },
    { id: 's-016', nis: '2024016', nama: 'Rizky Aditya Pratama', kelas: 'VII-C', nomorWa: '6281234560016' },
    { id: 's-017', nis: '2024017', nama: 'Nabila Sari Kusuma', kelas: 'VIII-B', nomorWa: '6281234560017' },
    { id: 's-018', nis: '2024018', nama: 'Farhan Dwi Anggara', kelas: 'IX-A', nomorWa: '6281234560018' },
    { id: 's-019', nis: '2024019', nama: 'Indah Permata Sari', kelas: 'VII-A', nomorWa: '6281234560019' },
    { id: 's-020', nis: '2024020', nama: 'Yusuf Habibi Rahman', kelas: 'IX-C', nomorWa: '6281234560020' },
]

// ─── Pos Tagihan (jenis tagihan) ──────────────────────────────────────────────

const SPP_MONTHS = [
    '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03',
]

const NON_MONTHLY_BILLS = [
    { pos: 'Ujian Tengah Semester', amount: 150000 },
    { pos: 'Ujian Akhir Semester', amount: 200000 },
    { pos: 'Kegiatan Pramuka', amount: 75000 },
    { pos: 'Biaya OSIS', amount: 50000 },
]

// ─── Mock Invoices Generator ──────────────────────────────────────────────────

export function getMockInvoices(studentId: string): Invoice[] {
    const invoices: Invoice[] = []

    // SPP Bulanan
    SPP_MONTHS.forEach((month, idx) => {
        const rng = faker.number.int({ min: 0, max: 9 })
        let status: SppStatus
        let paidAmount: number
        const originalAmount = 750000

        if (idx < 5) {
            // Bulan lama — bervariasi
            if (rng < 6) { status = 'paid'; paidAmount = originalAmount }
            else if (rng < 8) { status = 'partial'; paidAmount = 300000 }
            else { status = 'overdue'; paidAmount = 0 }
        } else {
            // Bulan baru — belum banyak yang bayar
            if (rng < 3) { status = 'paid'; paidAmount = originalAmount }
            else if (rng < 5) { status = 'partial'; paidAmount = 375000 }
            else { status = 'unpaid'; paidAmount = 0 }
        }

        invoices.push({
            id: `inv-${studentId}-spp-${month}`,
            studentId,
            posTagihan: 'SPP Bulanan',
            monthYear: month,
            originalAmount,
            paidAmount,
            remaining: originalAmount - paidAmount,
            status,
            dueDate: `${month}-10`,
        })
    })

    // Tagihan non-bulanan (acak 2-3 jenis)
    const picked = faker.helpers.arrayElements(NON_MONTHLY_BILLS, { min: 2, max: 3 })
    picked.forEach((bill, idx) => {
        const rng = faker.number.int({ min: 0, max: 5 })
        const status: SppStatus = rng < 3 ? 'paid' : rng < 4 ? 'partial' : 'unpaid'
        const paidAmount = status === 'paid' ? bill.amount : status === 'partial' ? Math.floor(bill.amount * 0.5) : 0

        invoices.push({
            id: `inv-${studentId}-extra-${idx}`,
            studentId,
            posTagihan: bill.pos,
            monthYear: null as unknown as string,
            originalAmount: bill.amount,
            paidAmount,
            remaining: bill.amount - paidAmount,
            status,
            dueDate: null,
        })
    })

    // Hanya kembalikan yang belum lunas (unpaid, partial, overdue)
    return invoices.filter(inv => inv.status !== 'paid')
}

// ─── Mock Discounts ───────────────────────────────────────────────────────────

export const MOCK_DISCOUNTS: Discount[] = [
    { id: 'd-1', nama: 'Beasiswa Yatim', tipe: 'persentase', nilai: 100, kategori: 'yatim', keterangan: 'Pembebasan penuh SPP untuk anak yatim', aktif: true },
    { id: 'd-2', nama: 'Subsidi Dhuafa', tipe: 'persentase', nilai: 75, kategori: 'dhuafa', keterangan: 'Siswa dari keluarga tidak mampu (SKTM)', aktif: true },
    { id: 'd-3', nama: 'Diskon Prestasi Akademik', tipe: 'persentase', nilai: 25, kategori: 'prestasi', keterangan: 'Nilai rata-rata semester ≥ 90', aktif: true },
    { id: 'd-4', nama: 'Potongan Putra/i Guru', tipe: 'persentase', nilai: 50, kategori: 'pegawai', keterangan: 'Putra/i guru dan karyawan tetap', aktif: true },
    { id: 'd-5', nama: 'Diskon Kakak & Adik', tipe: 'nominal', nilai: 100000, kategori: 'kakak-adik', keterangan: 'Ada saudara kandung di madrasah yang sama', aktif: true },
    { id: 'd-6', nama: 'Beasiswa Hafidz', tipe: 'persentase', nilai: 50, kategori: 'prestasi', keterangan: 'Penghafal Al-Quran minimal 5 juz', aktif: true },
    { id: 'd-7', nama: 'Bantuan Khusus Ramadhan', tipe: 'nominal', nilai: 200000, kategori: 'dhuafa', keterangan: 'Subsidi tambahan selama bulan Ramadhan', aktif: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate avatar initials dari nama (maks 2 huruf)
 * @example getInitials("Ahmad Rizki Fadillah") → "AR"
 */
export function getInitials(nama: string): string {
    return nama
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
}

/**
 * Generate warna deterministik dari nama (8 warna dari palet)
 */
const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-pink-500',
]

export function getAvatarColor(nama: string): string {
    const hash = nama.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/**
 * Generate nomor transaksi unik
 * @example TRX-20260323-0042
 */
export function generateTransactionNumber(): string {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    return `TRX-${dateStr}-${rand}`
}

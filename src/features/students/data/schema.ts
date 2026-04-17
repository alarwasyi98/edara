import { z } from 'zod'

const studentStatusSchema = z.union([
    z.literal('active'),
    z.literal('graduated'),
    z.literal('transferred'),
    z.literal('inactive'),
])
export type StudentStatus = z.infer<typeof studentStatusSchema>

const genderSchema = z.union([z.literal('L'), z.literal('P')])

const studentSchema = z.object({
    id: z.string(),
    nis: z.string(),
    nisn: z.string(),
    nikSiswa: z.string(),
    nomorKK: z.string(),
    namaLengkap: z.string(),
    jenisKelamin: genderSchema,
    tempatLahir: z.string(),
    tanggalLahir: z.coerce.date(),
    kelas: z.string(),
    tahunMasuk: z.string(),
    status: studentStatusSchema,

    // Orang tua — Ibu
    namaIbuKandung: z.string(),
    nikIbu: z.string(),
    pekerjaanIbu: z.string(),

    // Orang tua — Ayah
    namaAyahKandung: z.string(),
    nikAyah: z.string(),
    pekerjaanAyah: z.string(),

    // Wali
    namaWali: z.string(),
    nikWali: z.string(),
    pekerjaanWali: z.string(),
    teleponWali: z.string(),

    // Alamat
    alamat: z.string(),
    rt: z.string(),
    rw: z.string(),
    kelurahan: z.string(),
    kecamatan: z.string(),
    kabKota: z.string(),
    provinsi: z.string(),
    kodePos: z.string(),

    // Kontak
    nomorHp: z.string(),

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})
export type Student = z.infer<typeof studentSchema>

export const studentListSchema = z.array(studentSchema)

// ── Finance ─────────────────────────────────────

const sppStatusSchema = z.union([
    z.literal('paid'),
    z.literal('partial'),
    z.literal('unpaid'),
    z.literal('overdue'),
])
export type FinanceStatus = z.infer<typeof sppStatusSchema>

export const studentFinanceRecordSchema = z.object({
    id: z.string(),
    studentId: z.string(),
    bulan: z.string(), // "2025-07"
    jenis: z.string(), // "SPP", "Infaq", etc.
    jumlah: z.number(),
    dibayar: z.number(),
    status: sppStatusSchema,
    tanggalBayar: z.coerce.date().nullable(),
    metodePembayaran: z.string().nullable(),
})
export type StudentFinanceRecord = z.infer<typeof studentFinanceRecordSchema>

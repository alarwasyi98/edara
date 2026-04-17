import { faker } from '@faker-js/faker'
import { type StudentFinanceRecord } from './schema'

faker.seed(67890)

const jenisTagihan = ['SPP', 'Infaq', 'Kegiatan', 'Seragam', 'Buku']

const bulanList = [
    '2025-07',
    '2025-08',
    '2025-09',
    '2025-10',
    '2025-11',
    '2025-12',
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
]

const metodePembayaranList = ['Tunai', 'Transfer Bank', 'QRIS']

/**
 * Generate finance records for a given studentId.
 * Uses the studentId as a seed modifier so each student gets consistent data.
 */
export function getStudentFinance(studentId: string): StudentFinanceRecord[] {
    // Use a deterministic seed based on student ID
    const seed = studentId
        .split('')
        .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    faker.seed(seed)

    const records: StudentFinanceRecord[] = []

    // SPP for each month
    for (const bulan of bulanList) {
        const jumlah = faker.helpers.arrayElement([
            350_000, 400_000, 450_000, 500_000,
        ])

        const statusRoll = faker.number.float({ min: 0, max: 1 })
        let status: StudentFinanceRecord['status']
        let dibayar: number
        let tanggalBayar: Date | null = null
        let metodePembayaran: string | null = null

        if (statusRoll < 0.55) {
            status = 'paid'
            dibayar = jumlah
            const [y, m] = bulan.split('-')
            tanggalBayar = faker.date.between({
                from: new Date(Number(y), Number(m) - 1, 1),
                to: new Date(Number(y), Number(m) - 1, 28),
            })
            metodePembayaran = faker.helpers.arrayElement(metodePembayaranList)
        } else if (statusRoll < 0.7) {
            status = 'partial'
            dibayar = faker.helpers.arrayElement([
                Math.round(jumlah * 0.5),
                Math.round(jumlah * 0.25),
                Math.round(jumlah * 0.75),
            ])
            const [y, m] = bulan.split('-')
            tanggalBayar = faker.date.between({
                from: new Date(Number(y), Number(m) - 1, 1),
                to: new Date(Number(y), Number(m) - 1, 28),
            })
            metodePembayaran = faker.helpers.arrayElement(metodePembayaranList)
        } else if (statusRoll < 0.85) {
            status = 'unpaid'
            dibayar = 0
        } else {
            status = 'overdue'
            dibayar = 0
        }

        records.push({
            id: faker.string.uuid(),
            studentId,
            bulan,
            jenis: 'SPP',
            jumlah,
            dibayar,
            status,
            tanggalBayar,
            metodePembayaran,
        })
    }

    // A few extra charges (Infaq, Kegiatan, etc.)
    const extraCount = faker.number.int({ min: 1, max: 3 })
    for (let i = 0; i < extraCount; i++) {
        const jenis = faker.helpers.arrayElement(jenisTagihan.slice(1))
        const jumlah = faker.helpers.arrayElement([
            100_000, 150_000, 200_000, 250_000, 300_000, 500_000,
        ])
        const isPaid = faker.datatype.boolean()

        records.push({
            id: faker.string.uuid(),
            studentId,
            bulan: faker.helpers.arrayElement(bulanList),
            jenis,
            jumlah,
            dibayar: isPaid ? jumlah : 0,
            status: isPaid ? 'paid' : 'unpaid',
            tanggalBayar: isPaid ? faker.date.recent() : null,
            metodePembayaran: isPaid
                ? faker.helpers.arrayElement(metodePembayaranList)
                : null,
        })
    }

    // Reset seed so we don't affect other faker calls
    faker.seed(12345)

    return records
}

/** Compute financial summary for a set of finance records */
export function getFinanceSummary(records: StudentFinanceRecord[]) {
    const totalTagihan = records.reduce((sum, r) => sum + r.jumlah, 0)
    const sudahDibayar = records.reduce((sum, r) => sum + r.dibayar, 0)
    const sisaTunggakan = totalTagihan - sudahDibayar

    return { totalTagihan, sudahDibayar, sisaTunggakan }
}

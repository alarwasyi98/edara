import { faker } from '@faker-js/faker'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { formatRupiah, formatDateShort } from '@/lib/format'
import {
    transactionTypeLabels,
    type TransactionType,
    keuanganJenisColors,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    BarChart3,
} from 'lucide-react'

faker.seed(77777)

type Transaction = {
    id: string
    tanggal: Date
    keterangan: string
    jenis: TransactionType
    kategori: string
    nominal: number
}

const kategoriPemasukan = [
    'SPP',
    'Dana BOS',
    'Infaq',
    'Donasi',
    'Pendaftaran PPDB',
    'Seragam',
]
const kategoriPengeluaran = [
    'Gaji Guru',
    'Listrik & Air',
    'ATK & Perlengkapan',
    'Konsumsi',
    'Pemeliharaan',
    'Kegiatan Siswa',
    'Transportasi',
]

const transactions: Transaction[] = Array.from({ length: 40 }, () => {
    const jenis = faker.helpers.weightedArrayElement([
        { weight: 6, value: 'income' as const },
        { weight: 4, value: 'expense' as const },
    ])

    return {
        id: faker.string.uuid(),
        tanggal: faker.date.recent({ days: 60 }),
        keterangan:
            jenis === 'income'
                ? `${faker.helpers.arrayElement(kategoriPemasukan)} - ${faker.lorem.words(3)}`
                : `${faker.helpers.arrayElement(kategoriPengeluaran)} - ${faker.lorem.words(3)}`,
        jenis,
        kategori: faker.helpers.arrayElement(
            jenis === 'income' ? kategoriPemasukan : kategoriPengeluaran
        ),
        nominal:
            jenis === 'income'
                ? faker.number.int({ min: 100000, max: 15000000 })
                : faker.number.int({ min: 50000, max: 8000000 }),
    }
}).sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime())

const totalPemasukan = transactions
    .filter((t) => t.jenis === 'income')
    .reduce((sum, t) => sum + t.nominal, 0)
const totalPengeluaran = transactions
    .filter((t) => t.jenis === 'expense')
    .reduce((sum, t) => sum + t.nominal, 0)
const saldo = totalPemasukan - totalPengeluaran

export function CashflowTransactions() {
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

            <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
                <PageHeader
                    title='Pencatatan Keuangan'
                    description='Catat pemasukan dan pengeluaran lembaga.'
                />

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <StatCard
                        title='Saldo Saat Ini'
                        value={formatRupiah(saldo)}
                        description='pemasukan - pengeluaran'
                        icon={<Wallet className='h-4 w-4 text-muted-foreground' />}
                    />
                    <StatCard
                        title='Total Pemasukan'
                        value={formatRupiah(totalPemasukan)}
                        trend={{ value: `${transactions.filter((t) => t.jenis === 'income').length} transaksi`, positive: true }}
                        icon={<TrendingUp className='h-4 w-4 text-muted-foreground' />}
                    />
                    <StatCard
                        title='Total Pengeluaran'
                        value={formatRupiah(totalPengeluaran)}
                        trend={{ value: `${transactions.filter((t) => t.jenis === 'expense').length} transaksi`, positive: false }}
                        icon={<TrendingDown className='h-4 w-4 text-muted-foreground' />}
                    />
                    <StatCard
                        title='Jumlah Transaksi'
                        value={`${transactions.length}`}
                        description='60 hari terakhir'
                        icon={<BarChart3 className='h-4 w-4 text-muted-foreground' />}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Transaksi</CardTitle>
                        <CardDescription>
                            Transaksi terakhir 60 hari (terbaru di atas)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='overflow-auto rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Jenis</TableHead>
                                        <TableHead className='text-right'>Nominal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className='text-nowrap text-sm'>
                                                {formatDateShort(t.tanggal)}
                                            </TableCell>
                                            <TableCell className='max-w-[200px] truncate text-sm'>
                                                {t.keterangan}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant='outline' className={cn('text-xs', keuanganJenisColors[t.jenis])}>{t.kategori}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant='outline' className={cn('text-xs', keuanganJenisColors[t.jenis])}>
                                                    {transactionTypeLabels[t.jenis]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className={cn(
                                                    'text-right font-mono',
                                                    t.jenis === 'income'
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                )}
                                            >
                                                {t.jenis === 'income' ? '+' : '-'}
                                                {formatRupiah(t.nominal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Main>
        </>
    )
}

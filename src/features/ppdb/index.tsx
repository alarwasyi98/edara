import { useState } from 'react'
import { faker } from '@faker-js/faker'
import {
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    type ColumnFiltersState,
    type PaginationState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
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
import { DataTableToolbar, DataTablePagination, DataTableColumnHeader } from '@/components/data-table'
import { formatDateShort } from '@/lib/format'
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react'

faker.seed(22222)

type PpdbStatus = 'diterima' | 'ditolak' | 'pending' | 'verifikasi'

type Applicant = {
    id: string
    noPendaftaran: string
    nama: string
    jenisKelamin: 'L' | 'P'
    asalSekolah: string
    tanggalDaftar: Date
    nilaiRata: number
    status: PpdbStatus
}

const statusConfig: Record<PpdbStatus, { label: string; color: string }> = {
    diterima: { label: 'Diterima', color: 'bg-green-100/30 text-green-800 dark:text-green-200 border-green-200' },
    ditolak: { label: 'Ditolak', color: 'bg-red-100/30 text-red-800 dark:text-red-200 border-red-200' },
    pending: { label: 'Menunggu', color: 'bg-amber-100/30 text-amber-800 dark:text-amber-200 border-amber-200' },
    verifikasi: { label: 'Verifikasi', color: 'bg-blue-100/30 text-blue-800 dark:text-blue-200 border-blue-200' },
}

const statusOptions = Object.entries(statusConfig).map(([value, cfg]) => ({
    label: cfg.label,
    value,
}))

const firstNamesL = ['Ahmad', 'Muhammad', 'Rizki', 'Fauzan', 'Hasan', 'Zaki', 'Dani', 'Rafi', 'Bayu', 'Ilham']
const firstNamesP = ['Siti', 'Nisa', 'Aisyah', 'Fatimah', 'Zahra', 'Putri', 'Dewi', 'Rahma', 'Layla', 'Salma']
const lastNames = ['Hidayat', 'Pratama', 'Nugroho', 'Ramadhani', 'Permana', 'Santoso', 'Kurniawan', 'Maulana', 'Hakim']
const sdList = ['SDN 01 Jakarta', 'MI Al-Hikmah', 'SDN 03 Bandung', 'MIN 1 Bekasi', 'SD Muhammadiyah', 'SDN Cikaret', 'MI Darul Ulum']

const applicants: Applicant[] = Array.from({ length: 40 }, (_, i) => {
    const gender = faker.helpers.arrayElement(['L', 'P'] as const)
    const firstName = faker.helpers.arrayElement(gender === 'L' ? firstNamesL : firstNamesP)
    const lastName = faker.helpers.arrayElement(lastNames)
    return {
        id: faker.string.uuid(),
        noPendaftaran: `PPDB-2026-${String(i + 1).padStart(3, '0')}`,
        nama: `${firstName} ${lastName}`,
        jenisKelamin: gender,
        asalSekolah: faker.helpers.arrayElement(sdList),
        tanggalDaftar: faker.date.between({ from: '2026-01-01', to: '2026-03-01' }),
        nilaiRata: faker.number.float({ min: 75, max: 100, fractionDigits: 1 }),
        status: faker.helpers.weightedArrayElement([
            { weight: 4, value: 'diterima' as PpdbStatus },
            { weight: 1, value: 'ditolak' as PpdbStatus },
            { weight: 2, value: 'pending' as PpdbStatus },
            { weight: 1, value: 'verifikasi' as PpdbStatus },
        ]),
    }
})

const total = applicants.length
const diterima = applicants.filter((a) => a.status === 'diterima').length
const ditolak = applicants.filter((a) => a.status === 'ditolak').length
const pending = applicants.filter((a) => a.status === 'pending' || a.status === 'verifikasi').length

// ─── Column Definitions ───────────────────────────────────────────────────────
const columns: ColumnDef<Applicant>[] = [
    {
        accessorKey: 'noPendaftaran',
        header: ({ column }) => <DataTableColumnHeader column={column} title='No. Pendaftaran' />,
        cell: ({ row }) => <span className='font-mono text-sm'>{row.getValue('noPendaftaran')}</span>,
    },
    {
        accessorKey: 'nama',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Nama' />,
        cell: ({ row }) => <span className='font-medium'>{row.getValue('nama')}</span>,
    },
    {
        accessorKey: 'jenisKelamin',
        header: ({ column }) => <DataTableColumnHeader column={column} title='L/P' />,
        cell: ({ row }) => row.getValue('jenisKelamin'),
        enableSorting: false,
    },
    {
        accessorKey: 'asalSekolah',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Asal Sekolah' />,
        cell: ({ row }) => <span className='text-sm text-muted-foreground'>{row.getValue('asalSekolah')}</span>,
    },
    {
        accessorKey: 'nilaiRata',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Nilai Rata-rata' />,
        cell: ({ row }) => <span className='text-right font-mono'>{(row.getValue('nilaiRata') as number).toFixed(1)}</span>,
        meta: { className: 'text-right' },
    },
    {
        accessorKey: 'tanggalDaftar',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Tgl. Daftar' />,
        cell: ({ row }) => <span className='text-sm'>{formatDateShort(row.getValue('tanggalDaftar'))}</span>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
        cell: ({ row }) => {
            const status = row.getValue('status') as PpdbStatus
            const cfg = statusConfig[status]
            return (
                <Badge variant='outline' className={cn(cfg.color)}>
                    {cfg.label}
                </Badge>
            )
        },
        filterFn: (row, id, value) => value.includes(row.getValue(id)),
        enableSorting: false,
    },
]

export function DataPPDB() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: applicants,
        columns,
        state: { sorting, columnFilters, columnVisibility, pagination },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

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
                    title='PPDB 2026/2027'
                    description='Penerimaan Peserta Didik Baru — pantau status pendaftaran calon siswa.'
                />

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <StatCard title='Total Pendaftar' value={`${total}`} icon={<Users className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Diterima' value={`${diterima}`} trend={{ value: `${Math.round((diterima / total) * 100)}%`, positive: true }} icon={<CheckCircle className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Ditolak' value={`${ditolak}`} icon={<XCircle className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Menunggu / Verifikasi' value={`${pending}`} icon={<Clock className='h-4 w-4 text-muted-foreground' />} />
                </div>

                <Card>
                    <CardHeader className='space-y-4'>
                        <div>
                            <CardTitle>Daftar Pendaftar</CardTitle>
                            <CardDescription>{applicants.length} calon siswa baru TA 2026/2027</CardDescription>
                        </div>
                        <DataTableToolbar
                            table={table}
                            searchPlaceholder='Cari pendaftar...'
                            searchKey='nama'
                            filters={[
                                {
                                    columnId: 'status',
                                    title: 'Status',
                                    options: statusOptions,
                                },
                            ]}
                        />
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='overflow-auto rounded-md border'>
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id} className='group/row'>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className={cn(
                                                        'bg-background group-hover/row:bg-muted',
                                                        header.column.columnDef.meta?.className
                                                    )}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow key={row.id} className='group/row'>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            'bg-background group-hover/row:bg-muted',
                                                            cell.column.columnDef.meta?.className
                                                        )}
                                                    >
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className='h-24 text-center'>
                                                Tidak ada data pendaftar.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <DataTablePagination table={table} />
                    </CardContent>
                </Card>
            </Main>
        </>
    )
}

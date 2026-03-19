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
import { formatRupiah, formatBulanTagihan } from '@/lib/format'
import { sppStatusLabels, sppStatusColors, type SppStatus } from '@/lib/constants'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from '@/components/ui/chart'
import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { DateInputPicker } from '@/components/date-input-picker'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Receipt,
    TrendingUp,
    AlertTriangle,
    Clock,
    X,
    Send,
    CheckSquare,
    MoreHorizontal,
    Pencil,
    Trash2,
    Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTableToolbar, DataTablePagination, DataTableColumnHeader } from '@/components/data-table'

import { determineSppStatus } from './utils/calculations'
import { TransactionForm } from './components/transaction-form'

faker.seed(99999)

// ─── Types ────────────────────────────────────────────────────────────────────

type SppPayment = {
    id: string
    namaSiswa: string
    kelas: string
    bulan: string
    nominal: number
    dibayar: number
    status: SppStatus
    tanggalBayar: string | null
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const bulanList = [
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
]

const siswaNames = [
    'Ahmad Rizki F.',
    'Nisa Putri Ayu',
    'Muhammad Faqih',
    'Siti Aminah',
    'Hasan Ridwan',
    'Zahra Khadijah',
    'Bayu Pratama',
    'Fatimah Azzahra',
    'Irfan Maulana',
    'Layla Rahma',
    'Galih Nugroho',
    'Annisa Dewi',
    'Rafi Hidayat',
    'Salma Utami',
    'Dani Kurniawan',
]

const kelasList = [
    'VII-A', 'VII-B', 'VII-C',
    'VIII-A', 'VIII-B', 'VIII-C',
    'IX-A', 'IX-B', 'IX-C',
]

const initialPayments: SppPayment[] = Array.from({ length: 50 }, () => {
    const nominal = 750000
    const status = faker.helpers.weightedArrayElement([
        { weight: 5, value: 'paid' as const },
        { weight: 2, value: 'unpaid' as const },
        { weight: 1.5, value: 'partial' as const },
        { weight: 1.5, value: 'overdue' as const },
    ])

    return {
        id: faker.string.uuid(),
        namaSiswa: faker.helpers.arrayElement(siswaNames),
        kelas: faker.helpers.arrayElement(kelasList),
        bulan: faker.helpers.arrayElement(bulanList),
        nominal,
        dibayar:
            status === 'paid'
                ? nominal
                : status === 'partial'
                    ? Math.floor(nominal * 0.5)
                    : 0,
        status,
        tanggalBayar:
            status === 'paid' || status === 'partial'
                ? faker.date.recent({ days: 30 }).toISOString().split('T')[0]
                : null,
    }
})

const pieConfig: ChartConfig = {
    lunas: { label: 'Lunas', color: 'hsl(142 71% 45%)' },
    menunggak: { label: 'Menunggak', color: 'hsl(0 72% 51%)' },
    belumLunas: { label: 'Belum Lunas', color: 'hsl(38 92% 50%)' },
}

const lineConfig: ChartConfig = {
    terbayar: { label: 'Terbayar', color: 'hsl(142 71% 45%)' },
    tagihan: { label: 'Total Tagihan', color: 'hsl(215 20% 65%)' },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManajemenSPP() {
    const [payments, setPayments] = useState<SppPayment[]>(initialPayments)
    const [rowSelection, setRowSelection] = useState({})
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    // State form edit
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null)

    // State dialog tambah pembayaran
    const [isAddOpen, setIsAddOpen] = useState(false)
    const today = new Date().toISOString().split('T')[0]
    const [addForm, setAddForm] = useState({
        namaSiswa: '',
        kelas: '',
        bulan: bulanList[0],
        nominal: 750000,
        dibayar: 0,
        metodeBayar: 'tunai',
        tanggalBayar: today as string | null,
    })

    const handleAddPayment = () => {
        const newStatus = determineSppStatus(addForm.dibayar, addForm.nominal)
        const newPayment: SppPayment = {
            id: Date.now().toString(),
            namaSiswa: addForm.namaSiswa,
            kelas: addForm.kelas,
            bulan: addForm.bulan,
            nominal: addForm.nominal,
            dibayar: addForm.dibayar,
            status: newStatus,
            tanggalBayar: addForm.dibayar > 0 ? addForm.tanggalBayar : null,
        }
        setPayments((prev) => [newPayment, ...prev])
        setIsAddOpen(false)
        setAddForm({ namaSiswa: '', kelas: '', bulan: bulanList[0], nominal: 750000, dibayar: 0, metodeBayar: 'tunai', tanggalBayar: today })
    }

    const handleEditClick = (p: SppPayment) => {
        setSelectedTransaction({
            id: p.id,
            namaSiswa: p.namaSiswa,
            posTagihan: `SPP - ${formatBulanTagihan(p.bulan)}`,
            nominalTagihan: p.nominal,
            dibayar: p.dibayar,
            metodeBayar: 'tunai', // Default mockup
            tanggalBayar: p.tanggalBayar,
            keterangan: '',
        })
        setIsFormOpen(true)
    }

    const handleSaveTransaction = (
        id: string,
        newDibayar: number,
        _newMetode: string,
        newTanggal: string,
        _newKet?: string
    ) => {
        setPayments((prev) =>
            prev.map((p) => {
                if (p.id === id) {
                    const newStatus = determineSppStatus(newDibayar, p.nominal)
                    return {
                        ...p,
                        dibayar: newDibayar,
                        tanggalBayar: newDibayar > 0 ? newTanggal : null,
                        status: newStatus,
                    }
                }
                return p
            })
        )
    }

    // ─── Column Definitions ───────────────────────────────────────────────────
    const columns: ColumnDef<SppPayment>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label='Pilih semua'
                    className='translate-y-[2px]'
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label='Pilih baris'
                    className='translate-y-[2px]'
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'namaSiswa',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Nama Siswa' />,
            cell: ({ row }) => <span className='font-medium'>{row.getValue('namaSiswa')}</span>,
        },
        {
            accessorKey: 'kelas',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Kelas' />,
            cell: ({ row }) => row.getValue('kelas'),
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'bulan',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Bulan' />,
            cell: ({ row }) => formatBulanTagihan(row.getValue('bulan')),
        },
        {
            accessorKey: 'nominal',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tagihan' />,
            cell: ({ row }) => <span className='font-mono text-right block'>{formatRupiah(row.getValue('nominal'))}</span>,
            meta: { className: 'text-right' },
        },
        {
            accessorKey: 'dibayar',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Dibayar' />,
            cell: ({ row }) => <span className='font-mono text-right block'>{formatRupiah(row.getValue('dibayar'))}</span>,
            meta: { className: 'text-right' },
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
            cell: ({ row }) => {
                const status = row.getValue('status') as SppStatus
                return (
                    <Badge variant='outline' className={cn(sppStatusColors[status])}>
                        {sppStatusLabels[status]}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'tanggalBayar',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tgl Bayar' />,
            cell: ({ row }) => (
                <span className='text-sm text-muted-foreground'>
                    {row.getValue('tanggalBayar') ?? (
                        <span className='flex items-center gap-1'>
                            <Clock className='size-3' /> Belum
                        </span>
                    )}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 p-0 text-muted-foreground'
                        >
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>Buka menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleEditClick(row.original)}>
                            <Pencil className='mr-2 h-4 w-4' />
                            Edit Transaksi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive focus:text-destructive' onClick={() => { }}>
                            <Trash2 className='mr-2 h-4 w-4' />
                            Hapus Transaksi
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    const table = useReactTable({
        data: payments,
        columns,
        state: { sorting, columnFilters, columnVisibility, pagination, rowSelection },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const clearSelection = () => table.resetRowSelection()

    // Agregat ditarik ke dalam komponen agar otomatis re-render jika `payments` berubah
    const totalTagihan = payments.reduce((sum, p) => sum + p.nominal, 0)
    const totalDibayar = payments.reduce((sum, p) => sum + p.dibayar, 0)
    const sisaTunggakan = totalTagihan - totalDibayar

    // Chart data recalc
    const lunasCount = payments.filter((p) => p.status === 'paid').length
    const menunggakCount = payments.filter((p) => p.status === 'overdue').length
    const belumLunasCount = payments.filter((p) => p.status === 'unpaid' || p.status === 'partial').length

    const pieData = [
        { name: 'lunas', value: lunasCount, fill: 'var(--color-lunas)' },
        { name: 'menunggak', value: menunggakCount, fill: 'var(--color-menunggak)' },
        { name: 'belumLunas', value: belumLunasCount, fill: 'var(--color-belumLunas)' },
    ]

    const trendData = [
        { bulan: 'Jan', terbayar: 28500000, tagihan: 37500000 },
        { bulan: 'Feb', terbayar: 31200000, tagihan: 37500000 },
        { bulan: 'Mar', terbayar: 29750000, tagihan: 37500000 },
        { bulan: 'Apr', terbayar: 33100000, tagihan: 37500000 },
        { bulan: 'Mei', terbayar: 35400000, tagihan: 37500000 },
        { bulan: 'Jun', terbayar: totalDibayar, tagihan: totalTagihan },
    ]

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
                    title='Pembayaran Siswa'
                    description='Kelola tagihan dan pembayaran SPP siswa.'
                >
                    <Button size='sm' className='gap-1.5' onClick={() => setIsAddOpen(true)}>
                        <Plus className='h-4 w-4' />
                        Tambah
                    </Button>
                </PageHeader>

                <div className='grid gap-4 sm:grid-cols-3'>
                    <StatCard
                        title='Total Tagihan'
                        value={formatRupiah(totalTagihan)}
                        description='semester ini'
                        icon={<Receipt className='h-4 w-4 text-muted-foreground' />}
                    />
                    <StatCard
                        title='Total Terbayar'
                        value={formatRupiah(totalDibayar)}
                        trend={{
                            value: `${Math.round((totalDibayar / totalTagihan) * 100)}%`,
                            positive: true,
                        }}
                        description='dari total tagihan'
                        icon={<TrendingUp className='h-4 w-4 text-muted-foreground' />}
                    />
                    <StatCard
                        title='Sisa Tunggakan'
                        value={formatRupiah(sisaTunggakan)}
                        trend={{ value: 'perlu tindak lanjut', positive: false }}
                        description='belum terbayar'
                        icon={<AlertTriangle className='h-4 w-4 text-muted-foreground' />}
                    />
                </div>

                <div className='grid gap-4 lg:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Status Pembayaran Siswa</CardTitle>
                            <CardDescription>
                                {lunasCount} lunas · {menunggakCount} menunggak · {belumLunasCount} belum lunas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='flex items-center justify-center'>
                            <ChartContainer
                                config={pieConfig}
                                className='h-[260px] w-full max-w-[320px] sm:max-w-none'
                            >
                                <PieChart>
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                nameKey='name'
                                                formatter={(value, name) => (
                                                    <div className='flex items-center justify-between gap-4 w-full'>
                                                        <span className='text-muted-foreground'>
                                                            {pieConfig[name as keyof typeof pieConfig]?.label ?? name}
                                                        </span>
                                                        <span className='font-mono font-medium'>
                                                            {Number(value)} siswa
                                                        </span>
                                                    </div>
                                                )}
                                            />
                                        }
                                    />
                                    <Pie
                                        data={pieData}
                                        dataKey='value'
                                        nameKey='name'
                                        cx='50%'
                                        cy='50%'
                                        innerRadius='35%'
                                        outerRadius='60%'
                                        paddingAngle={3}
                                        strokeWidth={2}
                                    >
                                        {pieData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartLegend
                                        content={<ChartLegendContent nameKey='name' />}
                                    />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tren Pembayaran Bulanan</CardTitle>
                            <CardDescription>Perbandingan tagihan vs terbayar Jan–Jun 2026</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={lineConfig} className='h-[260px] w-full'>
                                <LineChart
                                    data={trendData}
                                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray='3 3'
                                        vertical={false}
                                        className='stroke-border'
                                    />
                                    <XAxis
                                        dataKey='bulan'
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) =>
                                            `${(v / 1_000_000).toFixed(0)}M`
                                        }
                                        width={40}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) => (
                                                    <div className='flex items-center justify-between gap-4 w-full'>
                                                        <span className='text-muted-foreground'>
                                                            {lineConfig[name as keyof typeof lineConfig]?.label ?? name}
                                                        </span>
                                                        <span className='font-mono font-medium'>
                                                            {formatRupiah(Number(value))}
                                                        </span>
                                                    </div>
                                                )}
                                            />
                                        }
                                    />
                                    <Line
                                        type='monotone'
                                        dataKey='tagihan'
                                        stroke='var(--color-tagihan)'
                                        strokeWidth={2}
                                        strokeDasharray='4 4'
                                        dot={false}
                                    />
                                    <Line
                                        type='monotone'
                                        dataKey='terbayar'
                                        stroke='var(--color-terbayar)'
                                        strokeWidth={2.5}
                                        dot={{ r: 3, strokeWidth: 2 }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <ChartLegend content={<ChartLegendContent />} />
                                </LineChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className='space-y-4'>
                        <div>
                            <CardTitle>Daftar Pembayaran SPP</CardTitle>
                            <CardDescription>
                                {table.getFilteredRowModel().rows.length} tagihan ditampilkan · semester genap 2025/2026
                            </CardDescription>
                        </div>
                        <DataTableToolbar
                            table={table}
                            searchPlaceholder='Cari pendaftar...'
                            searchKey='namaSiswa'
                            filters={[
                                {
                                    columnId: 'status',
                                    title: 'Status',
                                    options: Object.entries(sppStatusLabels).map(([value, label]) => ({
                                        label,
                                        value,
                                    })),
                                },
                                {
                                    columnId: 'kelas',
                                    title: 'Kelas',
                                    options: kelasList.map((k) => ({ label: k, value: k })),
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
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && 'selected'}
                                                className='group/row'
                                            >
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
                                                Tidak ada data pembayaran.
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

            <div
                className={cn(
                    'fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out',
                    selectedRows.length > 0
                        ? 'translate-y-0 opacity-100 pointer-events-auto'
                        : 'translate-y-8 opacity-0 pointer-events-none'
                )}
            >
                <div className='flex items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-2xl ring-1 ring-border/40'>
                    <span className='font-semibold text-foreground text-sm'>{selectedRows.length}</span>
                    <div className='h-4 w-px bg-border' />
                    <Button
                        size='sm'
                        variant='outline'
                        className='h-8 gap-1.5 text-xs'
                        onClick={() => {/* TODO: kirim notifikasi massal */ }}
                    >
                        <Send className='h-3.5 w-3.5' />
                        Kirim Notifikasi
                    </Button>
                    <Button
                        size='sm'
                        variant='outline'
                        className='h-8 gap-1.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950'
                        onClick={() => {/* TODO: tandai lunas */ }}
                    >
                        <CheckSquare className='h-3.5 w-3.5' />
                        Tandai Lunas
                    </Button>
                    <Button
                        size='icon'
                        variant='ghost'
                        className='h-8 w-8 text-muted-foreground hover:text-foreground'
                        onClick={clearSelection}
                        aria-label='Batalkan seleksi'
                    >
                        <X className='h-4 w-4' />
                    </Button>
                </div>
            </div>

            <TransactionForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                data={selectedTransaction}
                onSave={handleSaveTransaction}
            />

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className='sm:max-w-[440px]'>
                    <DialogHeader>
                        <DialogTitle>Tambah Pembayaran</DialogTitle>
                        <DialogDescription>Tambahkan tagihan SPP siswa baru.</DialogDescription>
                    </DialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='add-nama' className='text-right'>Nama Siswa</Label>
                            <Input id='add-nama' value={addForm.namaSiswa}
                                onChange={(e) => setAddForm((f) => ({ ...f, namaSiswa: e.target.value }))}
                                placeholder='Nama siswa' className='col-span-3' />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Kelas</Label>
                            <Select value={addForm.kelas} onValueChange={(v) => setAddForm((f) => ({ ...f, kelas: v }))}>
                                <SelectTrigger className='col-span-3'><SelectValue placeholder='Pilih kelas' /></SelectTrigger>
                                <SelectContent>
                                    {kelasList.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Bulan</Label>
                            <Select value={addForm.bulan} onValueChange={(v) => setAddForm((f) => ({ ...f, bulan: v }))}>
                                <SelectTrigger className='col-span-3'><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {bulanList.map((b) => <SelectItem key={b} value={b}>{formatBulanTagihan(b)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='add-nominal' className='text-right'>Nominal</Label>
                            <Input id='add-nominal' type='number' value={addForm.nominal || ''}
                                onChange={(e) => setAddForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                                className='col-span-3' />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='add-dibayar' className='text-right'>Dibayar</Label>
                            <Input id='add-dibayar' type='number' value={addForm.dibayar || ''}
                                onChange={(e) => setAddForm((f) => ({ ...f, dibayar: Number(e.target.value) }))}
                                className='col-span-3' />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Tgl Bayar</Label>
                            <div className='col-span-3'>
                                <DateInputPicker value={addForm.tanggalBayar} onChange={(v) => setAddForm((f) => ({ ...f, tanggalBayar: v }))} className='w-full' />
                            </div>
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Metode</Label>
                            <Select value={addForm.metodeBayar} onValueChange={(v) => setAddForm((f) => ({ ...f, metodeBayar: v }))}>
                                <SelectTrigger className='col-span-3'><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='tunai'>Tunai</SelectItem>
                                    <SelectItem value='transfer'>Transfer</SelectItem>
                                    <SelectItem value='qris'>QRIS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsAddOpen(false)}>Batal</Button>
                        <Button onClick={handleAddPayment} disabled={!addForm.namaSiswa || !addForm.kelas}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

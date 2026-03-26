import { useState } from 'react'
import { format } from 'date-fns'
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
import {
    type PeriodeBayar,
    periodeBayarColors,
    periodeBayarLabels,
} from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import { formatRupiah } from '@/lib/format'
import { Blocks, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { DataTableToolbar, DataTablePagination, DataTableColumnHeader } from '@/components/data-table'


type JenisBayarItem = {
    id: string
    kode: string
    nama: string
    nominal: number
    periode: PeriodeBayar
    keterangan: string
    aktif: boolean
    dateAdded: Date
}

const periodeConfig: Record<PeriodeBayar, { label: string; color: string }> = {
    bulanan: { label: periodeBayarLabels.bulanan, color: periodeBayarColors.bulanan },
    tahunan: { label: periodeBayarLabels.tahunan, color: periodeBayarColors.tahunan },
    sekali:  { label: periodeBayarLabels.sekali,  color: periodeBayarColors.sekali  },
}

const initialList: JenisBayarItem[] = [
    { id: '1', kode: 'SPP-MTS', nama: 'SPP MTs', nominal: 450000, periode: 'bulanan', keterangan: 'Sumbangan Pembinaan Pendidikan bulanan', aktif: true, dateAdded: new Date('2024-07-15') },
    { id: '2', kode: 'SPP-MA', nama: 'SPP MA', nominal: 500000, periode: 'bulanan', keterangan: 'Sumbangan Pembinaan Pendidikan MA', aktif: true, dateAdded: new Date('2024-07-15') },
    { id: '3', kode: 'PPDB-2026', nama: 'Biaya Pendaftaran PPDB', nominal: 150000, periode: 'sekali', keterangan: 'Biaya formulir dan seleksi PPDB', aktif: true, dateAdded: new Date('2025-01-10') },
    { id: '4', kode: 'DAFTAR-ULANG', nama: 'Daftar Ulang', nominal: 750000, periode: 'tahunan', keterangan: 'Biaya daftar ulang awal tahun ajaran', aktif: true, dateAdded: new Date('2024-07-15') },
    { id: '5', kode: 'SERAGAM', nama: 'Seragam Sekolah', nominal: 600000, periode: 'sekali', keterangan: 'Paket lengkap seragam (putih, batik, olahraga)', aktif: true, dateAdded: new Date('2024-08-01') },
    { id: '6', kode: 'BK-MATPEL', nama: 'Buku Mata Pelajaran', nominal: 350000, periode: 'tahunan', keterangan: 'Paket buku LKS dan referensi', aktif: true, dateAdded: new Date('2024-08-01') },
    { id: '7', kode: 'EKSKUL', nama: 'Kegiatan Ekstrakurikuler', nominal: 75000, periode: 'bulanan', keterangan: 'Biaya ekskul (futsal, pramuka, dll)', aktif: false, dateAdded: new Date('2024-09-05') },
    { id: '8', kode: 'WISATA', nama: 'Study Tour', nominal: 1200000, periode: 'sekali', keterangan: 'Biaya wisata tahunan kelas VIII', aktif: true, dateAdded: new Date('2024-10-20') },
    { id: '9', kode: 'UJIAN', nama: 'Biaya Ujian', nominal: 200000, periode: 'tahunan', keterangan: 'UN / UAS (termasuk kartu ujian)', aktif: true, dateAdded: new Date('2024-07-20') },
]

function emptyForm(): Omit<JenisBayarItem, 'id' | 'dateAdded'> {
    return { kode: '', nama: '', nominal: 0, periode: 'bulanan', keterangan: '', aktif: true }
}

export function JenisBayar() {
    const [list, setList] = useState<JenisBayarItem[]>(initialList)
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState(emptyForm())
    
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    const handleAdd = () => {
        if (!form.kode || !form.nama) return
        const newItem: JenisBayarItem = {
            ...form,
            id: Date.now().toString(),
            dateAdded: new Date(),
        }
        setList((prev) => [...prev, newItem])
        setOpen(false)
        setForm(emptyForm())
        toast.success(`Jenis bayar "${form.nama}" berhasil ditambahkan.`)
    }

    const columns: ColumnDef<JenisBayarItem>[] = [
        {
            accessorKey: 'kode',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Kode' />,
            cell: ({ row }) => <span className='font-mono text-sm font-medium'>{row.getValue('kode')}</span>,
        },
        {
            accessorKey: 'nama',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Nama Jenis Bayar' />,
            cell: ({ row }) => <span className='font-medium'>{row.getValue('nama')}</span>,
        },
        {
            accessorKey: 'nominal',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Nominal' />,
            cell: ({ row }) => <span className='font-mono text-right block'>{formatRupiah(row.getValue('nominal'))}</span>,
            meta: { className: 'text-right' },
        },
        {
            accessorKey: 'periode',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Periode' />,
            cell: ({ row }) => {
                const periode = row.getValue('periode') as PeriodeBayar
                const pCfg = periodeConfig[periode]
                return (
                    <Badge variant='outline' className={cn(pCfg.color)}>
                        {pCfg.label}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'keterangan',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Keterangan' />,
            cell: ({ row }) => <span className='max-w-[200px] truncate block text-sm text-muted-foreground'>{row.getValue('keterangan')}</span>,
        },
        {
            accessorKey: 'dateAdded',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tgl. Ditambahkan' />,
            cell: ({ row }) => <span className='text-sm text-muted-foreground'>{format(row.getValue('dateAdded'), 'dd/MM/yyyy')}</span>,
        },
        {
            accessorKey: 'aktif',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
            cell: ({ row }) => {
                const aktif = row.getValue('aktif') as boolean
                return (
                    <Badge variant='outline' className={aktif ? 'border-green-200 bg-green-100/30 text-green-800 dark:text-green-200' : 'border-neutral-300 bg-neutral-100/30 text-neutral-500'}>
                        {aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) ? 'aktif' : 'nonaktif'
                return value.includes(rowValue)
            },
        },
    ]

    const table = useReactTable({
        data: list,
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

    const aktifCount = list.filter((j) => j.aktif).length

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
                    title='Jenis Bayar'
                    description='Master data jenis pembayaran dan skema tarif madrasah.'
                >
                    <Button className='gap-1.5' onClick={() => setOpen(true)}>
                        <Blocks size={16} /> Tambah
                    </Button>
                </PageHeader>

                <Card>
                    <CardHeader className='space-y-4'>
                        <div>
                            <CardTitle className='flex items-center gap-2'>
                                <Receipt className='h-5 w-5' /> Daftar Jenis Pembayaran
                            </CardTitle>
                            <CardDescription>
                                {aktifCount} aktif dari {list.length} jenis pembayaran
                            </CardDescription>
                        </div>
                        <DataTableToolbar
                            table={table}
                            searchPlaceholder='Cari jenis bayar...'
                            searchKey='nama'
                            filters={[
                                {
                                    columnId: 'aktif',
                                    title: 'Status',
                                    options: [
                                        { label: 'Aktif', value: 'aktif' },
                                        { label: 'Nonaktif', value: 'nonaktif' },
                                    ],
                                },
                                {
                                    columnId: 'periode',
                                    title: 'Periode',
                                    options: Object.entries(periodeConfig).map(([value, cfg]) => ({
                                        label: cfg.label,
                                        value,
                                    })),
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
                                                        'group-hover/row:bg-muted',
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
                                                className={cn('group/row', !row.original.aktif && 'opacity-60')}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className={cn(
                                                            'group-hover/row:bg-muted',
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
                                                Tidak ada data jenis bayar.
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

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-[440px]'>
                    <DialogHeader>
                        <DialogTitle>Tambah Jenis Bayar</DialogTitle>
                        <DialogDescription>Isi informasi pos pembayaran baru.</DialogDescription>
                    </DialogHeader>

                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='kode' className='text-right'>Kode</Label>
                            <Input
                                id='kode'
                                value={form.kode}
                                onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
                                placeholder='Mis: SPP-MTS'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='nama' className='text-right'>Nama</Label>
                            <Input
                                id='nama'
                                value={form.nama}
                                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                                placeholder='Nama jenis bayar'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='nominal' className='text-right'>Nominal</Label>
                            <Input
                                id='nominal'
                                type='number'
                                value={form.nominal || ''}
                                onChange={(e) => setForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                                placeholder='0'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Periode</Label>
                            <Select
                                value={form.periode}
                                onValueChange={(v) => setForm((f) => ({ ...f, periode: v as PeriodeBayar }))}
                            >
                                <SelectTrigger className='col-span-3'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='bulanan'>Bulanan</SelectItem>
                                    <SelectItem value='tahunan'>Tahunan</SelectItem>
                                    <SelectItem value='sekali'>Sekali Bayar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='ket' className='text-right'>Keterangan</Label>
                            <Input
                                id='ket'
                                value={form.keterangan}
                                onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                                placeholder='Opsional'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Status</Label>
                            <Select
                                value={form.aktif ? 'aktif' : 'nonaktif'}
                                onValueChange={(v) => setForm((f) => ({ ...f, aktif: v === 'aktif' }))}
                            >
                                <SelectTrigger className='col-span-3'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='aktif'>Aktif</SelectItem>
                                    <SelectItem value='nonaktif'>Nonaktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant='outline' onClick={() => setOpen(false)}>Batal</Button>
                        <Button onClick={handleAdd} disabled={!form.kode || !form.nama}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

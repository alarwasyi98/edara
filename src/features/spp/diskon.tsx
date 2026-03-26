import React, { useState } from 'react'
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
import { toast } from 'sonner'
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Tag,
    Users,
    BadgePercent,
    CheckCircle,
} from 'lucide-react'
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { DataTableToolbar, DataTablePagination, DataTableColumnHeader } from '@/components/data-table'

// ─── Types ────────────────────────────────────────────────────────────────────
type TipeDiskon = 'persentase' | 'nominal'
type KategoriDiskon = 'yatim' | 'dhuafa' | 'prestasi' | 'pegawai' | 'kakak-adik' | 'lainnya'

type Diskon = {
    id: string
    nama: string
    tipe: TipeDiskon
    nilai: number           // persen (0–100) atau nominal rupiah
    kategori: KategoriDiskon
    keterangan: string
    jumlahPenerima: number
    aktif: boolean
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const kategoriLabel: Record<KategoriDiskon, string> = {
    yatim: 'Anak Yatim',
    dhuafa: 'Dhuafa',
    prestasi: 'Prestasi',
    pegawai: 'Putra/i Pegawai',
    'kakak-adik': 'Kakak & Adik',
    lainnya: 'Lainnya',
}

const kategoriColor: Record<KategoriDiskon, string> = {
    yatim: 'bg-purple-100/30 text-purple-800 dark:text-purple-200 border-purple-200',
    dhuafa: 'bg-amber-100/30 text-amber-800 dark:text-amber-200 border-amber-200',
    prestasi: 'bg-blue-100/30 text-blue-800 dark:text-blue-200 border-blue-200',
    pegawai: 'bg-green-100/30 text-green-800 dark:text-green-200 border-green-200',
    'kakak-adik': 'bg-cyan-100/30 text-cyan-800 dark:text-cyan-200 border-cyan-200',
    lainnya: 'bg-neutral-100/30 text-neutral-600 dark:text-neutral-400 border-neutral-300',
}

const initialDiskon: Diskon[] = [
    { id: '1', nama: 'Beasiswa Yatim', tipe: 'persentase', nilai: 100, kategori: 'yatim', keterangan: 'Pembebasan penuh SPP untuk anak yatim yang terdaftar', jumlahPenerima: 8, aktif: true },
    { id: '2', nama: 'Subsidi Dhuafa', tipe: 'persentase', nilai: 75, kategori: 'dhuafa', keterangan: 'Diberikan kepada siswa dari keluarga tidak mampu dengan surat keterangan SKTM', jumlahPenerima: 12, aktif: true },
    { id: '3', nama: 'Diskon Prestasi Akademik', tipe: 'persentase', nilai: 25, kategori: 'prestasi', keterangan: 'Diberikan kepada siswa dengan nilai rata-rata semester ≥ 90', jumlahPenerima: 15, aktif: true },
    { id: '4', nama: 'Potongan Putra/i Guru', tipe: 'persentase', nilai: 50, kategori: 'pegawai', keterangan: 'Diskon khusus bagi putra/i guru dan karyawan tetap madrasah', jumlahPenerima: 6, aktif: true },
    { id: '5', nama: 'Diskon Kakak & Adik', tipe: 'nominal', nilai: 100000, kategori: 'kakak-adik', keterangan: 'Potongan Rp100.000 jika ada saudara kandung yang bersekolah di madrasah yang sama', jumlahPenerima: 18, aktif: true },
    { id: '6', nama: 'Beasiswa Hafidz', tipe: 'persentase', nilai: 50, kategori: 'prestasi', keterangan: 'Siswa penghafal Al-Quran minimal 5 juz mendapatkan diskon 50%', jumlahPenerima: 4, aktif: true },
    { id: '7', nama: 'Bantuan Khusus Ramadhan', tipe: 'nominal', nilai: 200000, kategori: 'dhuafa', keterangan: 'Subsidi tambahan selama bulan Ramadhan bagi siswa dhuafa', jumlahPenerima: 20, aktif: false },
]

// ─── Form Dialog ───────────────────────────────────────────────────────────────
interface DiskonFormDialogProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    mode: 'add' | 'edit'
    initial?: Diskon
    onSave: (data: Omit<Diskon, 'id' | 'jumlahPenerima'>) => void
}

function DiskonFormDialog({ open, onOpenChange, mode, initial, onSave }: DiskonFormDialogProps) {
    const [nama, setNama] = useState(initial?.nama ?? '')
    const [tipe, setTipe] = useState<TipeDiskon>(initial?.tipe ?? 'persentase')
    const [nilai, setNilai] = useState(String(initial?.nilai ?? ''))
    const [kategori, setKategori] = useState<KategoriDiskon>(initial?.kategori ?? 'lainnya')
    const [keterangan, setKeterangan] = useState(initial?.keterangan ?? '')
    const [aktif, setAktif] = useState(initial?.aktif ?? true)

    React.useEffect(() => {
        if (open) {
            setNama(initial?.nama ?? '')
            setTipe(initial?.tipe ?? 'persentase')
            setNilai(String(initial?.nilai ?? ''))
            setKategori(initial?.kategori ?? 'lainnya')
            setKeterangan(initial?.keterangan ?? '')
            setAktif(initial?.aktif ?? true)
        }
    }, [open, initial])

    const handleSave = () => {
        if (!nama.trim() || !nilai) {
            toast.error('Nama dan nilai diskon wajib diisi.')
            return
        }
        const n = Number(nilai)
        if (tipe === 'persentase' && (n <= 0 || n > 100)) {
            toast.error('Persentase harus antara 1–100.')
            return
        }
        onSave({ nama: nama.trim(), tipe, nilai: n, kategori, keterangan: keterangan.trim(), aktif })
        onOpenChange(false)
        toast.success(mode === 'add' ? `Diskon "${nama}" berhasil ditambahkan.` : `Diskon "${nama}" berhasil diperbarui.`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-lg'>
                <DialogHeader>
                    <DialogTitle>{mode === 'add' ? 'Tambah Diskon' : 'Edit Diskon'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'add' ? 'Buat jenis diskon atau subsidi baru untuk siswa.' : 'Perbarui informasi diskon yang dipilih.'}
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-1'>
                    <div className='space-y-1.5'>
                        <Label htmlFor='diskon-nama'>Nama Diskon <span className='text-destructive'>*</span></Label>
                        <Input id='diskon-nama' placeholder='cth. Beasiswa Yatim' value={nama} onChange={(e) => setNama(e.target.value)} />
                    </div>

                    <div className='space-y-1.5'>
                        <Label>Kategori</Label>
                        <Select value={kategori} onValueChange={(v) => setKategori(v as KategoriDiskon)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(Object.keys(kategoriLabel) as KategoriDiskon[]).map((k) => (
                                    <SelectItem key={k} value={k}>{kategoriLabel[k]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-1.5'>
                            <Label>Tipe Diskon</Label>
                            <Select value={tipe} onValueChange={(v) => setTipe(v as TipeDiskon)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='persentase'>Persentase (%)</SelectItem>
                                    <SelectItem value='nominal'>Nominal (Rp)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1.5'>
                            <Label htmlFor='diskon-nilai'>Nilai <span className='text-destructive'>*</span></Label>
                            <div className='relative'>
                                <span className='absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground'>
                                    {tipe === 'persentase' ? '%' : 'Rp'}
                                </span>
                                <Input id='diskon-nilai' type='number' className='pl-10' min={1} max={tipe === 'persentase' ? 100 : undefined} value={nilai} onChange={(e) => setNilai(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <Label htmlFor='diskon-ket'>Keterangan / Syarat</Label>
                        <Textarea id='diskon-ket' rows={3} placeholder='Uraikan syarat penerima diskon ini...' value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
                    </div>

                    <div className='flex items-center gap-3'>
                        <input type='checkbox' id='diskon-aktif' checked={aktif} onChange={(e) => setAktif(e.target.checked)} className='h-4 w-4 cursor-pointer rounded border' />
                        <Label htmlFor='diskon-aktif' className='cursor-pointer'>Aktif (dapat diberikan ke siswa)</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleSave}>{mode === 'add' ? 'Tambah Diskon' : 'Simpan Perubahan'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DiskonSPP() {
    const [diskonList, setDiskonList] = useState<Diskon[]>(initialDiskon)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
    const [selected, setSelected] = useState<Diskon | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<Diskon | null>(null)

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    const handleAdd = () => { setDialogMode('add'); setSelected(undefined); setDialogOpen(true) }
    const handleEdit = (d: Diskon) => { setDialogMode('edit'); setSelected(d); setDialogOpen(true) }
    const handleToggle = (d: Diskon) => {
        setDiskonList((prev) => prev.map((x) => x.id === d.id ? { ...x, aktif: !x.aktif } : x))
        toast.success(`Diskon "${d.nama}" ${d.aktif ? 'dinonaktifkan' : 'diaktifkan'}.`)
    }
    const handleSave = (data: Omit<Diskon, 'id' | 'jumlahPenerima'>) => {
        if (dialogMode === 'add') {
            setDiskonList((prev) => [...prev, { ...data, id: String(Date.now()), jumlahPenerima: 0 }])
        } else if (selected) {
            setDiskonList((prev) => prev.map((x) => x.id === selected.id ? { ...x, ...data } : x))
        }
    }
    const confirmDelete = () => {
        if (!deleteTarget) return
        setDiskonList((prev) => prev.filter((d) => d.id !== deleteTarget.id))
        toast.success(`Diskon "${deleteTarget.nama}" dihapus.`)
        setDeleteTarget(null)
    }

    const columns: ColumnDef<Diskon>[] = [
        {
            accessorKey: 'nama',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Nama Diskon' />,
            cell: ({ row }) => (
                <div className='py-0.5'>
                    <p className='font-medium'>{row.getValue('nama')}</p>
                    {row.original.keterangan && (
                        <p className='mt-0.5 max-w-xs truncate text-xs text-muted-foreground'>{row.original.keterangan}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'kategori',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Kategori' />,
            cell: ({ row }) => {
                const kategori = row.getValue('kategori') as KategoriDiskon
                return (
                    <Badge variant='outline' className={cn('text-xs', kategoriColor[kategori])}>
                        {kategoriLabel[kategori]}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'tipe',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tipe' />,
            cell: ({ row }) => {
                const tipe = row.getValue('tipe') as TipeDiskon
                return <span className='text-sm text-muted-foreground capitalize'>{tipe === 'persentase' ? 'Persentase' : 'Nominal'}</span>
            },
        },
        {
            accessorKey: 'nilai',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Nilai' />,
            cell: ({ row }) => {
                const tipe = row.original.tipe
                const nilai = row.getValue('nilai') as number
                return (
                    <span className='font-mono font-medium text-right block'>
                        {tipe === 'persentase' ? `${nilai}%` : formatRupiah(nilai)}
                    </span>
                )
            },
            meta: { className: 'text-right' },
        },
        {
            accessorKey: 'jumlahPenerima',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Penerima' />,
            cell: ({ row }) => <span className='font-mono text-center block'>{row.getValue('jumlahPenerima')}</span>,
            meta: { className: 'text-center' },
        },
        {
            accessorKey: 'aktif',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
            cell: ({ row }) => {
                const aktif = row.getValue('aktif') as boolean
                return (
                    <div className='flex justify-center'>
                    <Badge variant='outline' className={aktif
                        ? 'border-green-200 bg-green-100/30 text-green-800 dark:text-green-200'
                        : 'border-neutral-300 bg-neutral-100/30 text-neutral-500'}>
                        {aktif ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    </div>
                )
            },
            filterFn: (row, id, value) => {
                const rowValue = row.getValue(id) ? 'aktif' : 'nonaktif'
                return value.includes(rowValue)
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className='text-right'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                            <span className='sr-only'>Buka menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                            <Pencil className='mr-2 h-4 w-4' /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(row.original)}>
                            <CheckCircle className='mr-2 h-4 w-4' />
                            {row.original.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive focus:text-destructive' onClick={() => setDeleteTarget(row.original)}>
                            <Trash2 className='mr-2 h-4 w-4' /> Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            ),
        },
    ]

    const table = useReactTable({
        data: diskonList,
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

    const totalPenerima = diskonList.reduce((s, d) => s + d.jumlahPenerima, 0)
    const aktifCount = diskonList.filter((d) => d.aktif).length

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
                    title='Diskon & Subsidi'
                    description='Kelola jenis diskon dan subsidi SPP untuk siswa madrasah.'
                >
                    <Button className='gap-1.5' onClick={handleAdd}>
                        <BadgePercent size={16} /> Tambah
                    </Button>
                </PageHeader>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <StatCard title='Total Jenis Diskon' value={`${diskonList.length}`} description={`${aktifCount} aktif`} icon={<Tag className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Diskon Aktif' value={`${aktifCount}`} description='dapat diberikan ke siswa' icon={<BadgePercent className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Total Penerima' value={`${totalPenerima}`} description='siswa penerima diskon' icon={<Users className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Diskon Nonaktif' value={`${diskonList.length - aktifCount}`} description='sedang tidak berlaku' icon={<CheckCircle className='h-4 w-4 text-muted-foreground' />} />
                </div>

                <Card>
                    <CardHeader className='space-y-4'>
                        <div>
                            <CardTitle>Daftar Diskon & Subsidi</CardTitle>
                            <CardDescription>{diskonList.length} jenis diskon tercatat · {totalPenerima} total penerima</CardDescription>
                        </div>
                        <DataTableToolbar
                            table={table}
                            searchPlaceholder='Cari diskon...'
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
                                    columnId: 'kategori',
                                    title: 'Kategori',
                                    options: Object.entries(kategoriLabel).map(([value, label]) => ({
                                        label,
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
                                                Tidak ada data diskon.
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

            <DiskonFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                initial={selected}
                onSave={handleSave}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Diskon?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Diskon <strong>{deleteTarget?.nama}</strong> akan dihapus secara permanen. Siswa yang saat ini menerima diskon ini perlu diperbarui secara manual.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

import { useState } from 'react'
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
import { Shapes, BookOpen, Users, UserCheck, TrendingUp } from 'lucide-react'
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { cn } from '@/lib/utils'
import { kelasJenjangColors } from '@/lib/constants'
import { DataTableToolbar, DataTablePagination, DataTableColumnHeader } from '@/components/data-table'
import { ClassesDialog } from './components/classes-dialog'
import { ClassesRowActions } from './components/kelas-row-actions'

type Kelas = {
    id: string
    namaKelas: string
    jenjang: 'VII' | 'VIII' | 'IX'
    waliKelas: string
    jumlahSiswa: number
    kapasitas: number
    tahunAjaran: string
}

const initialKelas: Kelas[] = [
    { id: '1', namaKelas: 'VII-A', jenjang: 'VII', waliKelas: 'Ustdzh. Fatimah Hidayatullah', jumlahSiswa: 32, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '2', namaKelas: 'VII-B', jenjang: 'VII', waliKelas: 'Ibu Sari Nugroho', jumlahSiswa: 30, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '3', namaKelas: 'VII-C', jenjang: 'VII', waliKelas: 'Ustadz Ahmad Maulana', jumlahSiswa: 28, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '4', namaKelas: 'VIII-A', jenjang: 'VIII', waliKelas: 'Pak Budi Santoso', jumlahSiswa: 33, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '5', namaKelas: 'VIII-B', jenjang: 'VIII', waliKelas: 'Ibu Dewi Permana', jumlahSiswa: 31, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '6', namaKelas: 'VIII-C', jenjang: 'VIII', waliKelas: 'Ustadz Ridwan Hakim', jumlahSiswa: 29, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '7', namaKelas: 'IX-A', jenjang: 'IX', waliKelas: 'Ibu Ratna Wibowo', jumlahSiswa: 34, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '8', namaKelas: 'IX-B', jenjang: 'IX', waliKelas: 'Pak Eko Kurniawan', jumlahSiswa: 30, kapasitas: 35, tahunAjaran: '2025/2026' },
    { id: '9', namaKelas: 'IX-C', jenjang: 'IX', waliKelas: 'Ustdz. Zahra Firdaus', jumlahSiswa: 27, kapasitas: 35, tahunAjaran: '2025/2026' },
]


export function DataKelas() {
    const [kelasList, setKelasList] = useState<Kelas[]>(initialKelas)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
    const [selectedKelas, setSelectedKelas] = useState<Kelas | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null)

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    const totalSiswa = kelasList.reduce((s, k) => s + k.jumlahSiswa, 0)

    const handleAdd = () => {
        setDialogMode('add')
        setSelectedKelas(undefined)
        setDialogOpen(true)
    }

    const handleEdit = (k: Kelas) => {
        setDialogMode('edit')
        setSelectedKelas(k)
        setDialogOpen(true)
    }

    const handleSave = (data: Omit<Kelas, 'id' | 'jumlahSiswa'>) => {
        if (dialogMode === 'add') {
            setKelasList((prev) => [
                ...prev,
                { ...data, id: String(Date.now()), jumlahSiswa: 0 },
            ])
        } else if (selectedKelas) {
            setKelasList((prev) =>
                prev.map((k) =>
                    k.id === selectedKelas.id ? { ...k, ...data } : k
                )
            )
        }
    }

    const handleDelete = (k: Kelas) => setDeleteTarget(k)

    const confirmDelete = () => {
        if (!deleteTarget) return
        setKelasList((prev) => prev.filter((k) => k.id !== deleteTarget.id))
        toast.success(`Kelas ${deleteTarget.namaKelas} dihapus. (Demo)`)
        setDeleteTarget(null)
    }

    const columns: ColumnDef<Kelas>[] = [
        {
            accessorKey: 'namaKelas',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Nama Kelas' />,
            cell: ({ row }) => <span className='font-medium'>{row.getValue('namaKelas')}</span>,
        },
        {
            accessorKey: 'jenjang',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Jenjang' />,
            cell: ({ row }) => {
                const jenjang = row.getValue('jenjang') as string
                return (
                    <Badge variant='outline' className={kelasJenjangColors[jenjang]}>
                        Kelas {jenjang}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            accessorKey: 'waliKelas',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Wali Kelas' />,
            cell: ({ row }) => <span className='text-sm'>{row.getValue('waliKelas')}</span>,
        },
        {
            accessorKey: 'jumlahSiswa',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Siswa' />,
            cell: ({ row }) => <span className='font-mono text-center block'>{row.getValue('jumlahSiswa')}</span>,
            meta: { className: 'text-center' },
        },
        {
            accessorKey: 'kapasitas',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Kapasitas' />,
            cell: ({ row }) => <span className='font-mono text-center block text-muted-foreground'>{row.getValue('kapasitas')}</span>,
            meta: { className: 'text-center' },
        },
        {
            id: 'terisi',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Terisi' />,
            cell: ({ row }) => {
                const { jumlahSiswa, kapasitas } = row.original
                const pct = kapasitas > 0 ? Math.round((jumlahSiswa / kapasitas) * 100) : 0
                return (
                    <span className={cn('text-center block', pct >= 90 ? 'font-medium text-amber-600' : 'text-muted-foreground')}>
                        {pct}%
                    </span>
                )
            },
            meta: { className: 'text-center' },
        },
        {
            accessorKey: 'tahunAjaran',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tahun Ajaran' />,
            cell: ({ row }) => <span className='text-sm text-muted-foreground'>{row.getValue('tahunAjaran')}</span>,
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className='text-right'>
                    <ClassesRowActions kelas={row.original} onEdit={handleEdit} onDelete={handleDelete} />
                </div>
            ),
        },
    ]

    const table = useReactTable({
        data: kelasList,
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
                    title='Data Kelas'
                    description='Kelola kelas dan rombongan belajar madrasah.'
                >
                    <Button className='gap-1.5' onClick={handleAdd}>
                        <Shapes size={16} /> Tambah
                    </Button>
                </PageHeader>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <StatCard title='Total Kelas' value={`${kelasList.length}`} description='aktif TA 2025/2026' icon={<BookOpen className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Total Siswa' value={`${totalSiswa}`} description='seluruh kelas' icon={<Users className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Wali Kelas' value={`${kelasList.length}`} description='guru yang bertugas' icon={<UserCheck className='h-4 w-4 text-muted-foreground' />} />
                    <StatCard title='Rata-rata Siswa' value={`${kelasList.length ? Math.round(totalSiswa / kelasList.length) : 0}`} description='per kelas' icon={<TrendingUp className='h-4 w-4 text-muted-foreground' />} />
                </div>

                <Card>
                    <CardHeader className='space-y-4'>
                        <div>
                            <CardTitle>Daftar Kelas</CardTitle>
                            <CardDescription>Tahun ajaran 2025/2026 — {kelasList.length} kelas</CardDescription>
                        </div>
                        <DataTableToolbar
                            table={table}
                            searchPlaceholder='Cari kelas...'
                            searchKey='namaKelas'
                            filters={[
                                {
                                    columnId: 'jenjang',
                                    title: 'Jenjang',
                                    options: [
                                        { label: 'Kelas VII', value: 'VII' },
                                        { label: 'Kelas VIII', value: 'VIII' },
                                        { label: 'Kelas IX', value: 'IX' },
                                    ],
                                },
                                {
                                    columnId: 'tahunAjaran',
                                    title: 'Tahun Ajaran',
                                    options: [
                                        { label: '2024/2025', value: '2024/2025' },
                                        { label: '2025/2026', value: '2025/2026' },
                                    ],
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
                                                className='group/row'
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
                                                Tidak ada data kelas.
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

            <ClassesDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                initialData={selectedKelas}
                onSave={handleSave}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kelas?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kelas <strong>{deleteTarget?.namaKelas}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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

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
import { CheckCircle2, Clock, BookOpen, CalendarRange } from 'lucide-react'
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
import { DataTableToolbar, DataTablePagination, DataTableColumnHeader } from '@/components/data-table'
import { cn } from '@/lib/utils'
import {
    tahunAjaranStatusColors,
    tahunAjaranStatusLabels,
    type TahunAjaranStatus,
} from '@/lib/constants'
import { TahunAjaranDialog } from './components/tahun-ajaran-dialog'
import { TahunAjaranRowActions } from './components/tahun-ajaran-row-actions'


type TahunAjaranItem = {
    id: string
    nama: string
    mulai: string
    selesai: string
    semester: string
    status: TahunAjaranStatus
    keterangan?: string
}

const initialData: TahunAjaranItem[] = [
    { id: '1', nama: '2025/2026', mulai: '15 Juli 2025', selesai: '20 Juni 2026', semester: 'Genap (Jan–Jun 2026)', status: 'active', keterangan: 'Sedang berjalan' },
    { id: '2', nama: '2024/2025', mulai: '17 Juli 2024', selesai: '21 Juni 2025', semester: 'Genap & Ganjil', status: 'completed', keterangan: 'Sudah selesai' },
    { id: '3', nama: '2023/2024', mulai: '17 Juli 2023', selesai: '22 Juni 2024', semester: 'Genap & Ganjil', status: 'completed', keterangan: 'Sudah selesai' },
    { id: '4', nama: '2026/2027', mulai: '13 Juli 2026', selesai: '19 Juni 2027', semester: 'Belum dimulai', status: 'upcoming', keterangan: 'Tahun ajaran mendatang' },
]

const statusConfig: Record<TahunAjaranStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    active:    { label: tahunAjaranStatusLabels.active,    color: tahunAjaranStatusColors.active,    icon: CheckCircle2 },
    completed: { label: tahunAjaranStatusLabels.completed, color: tahunAjaranStatusColors.completed, icon: BookOpen },
    upcoming:  { label: tahunAjaranStatusLabels.upcoming,  color: tahunAjaranStatusColors.upcoming,  icon: Clock },
}

const statusOptions = Object.entries(statusConfig).map(([value, cfg]) => ({
    label: cfg.label,
    value,
}))

export function TahunAjaran() {
    const [tahunList, setTahunList] = useState<TahunAjaranItem[]>(initialData)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
    const [selected, setSelected] = useState<TahunAjaranItem | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<TahunAjaranItem | null>(null)

    // Table state
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    const active = tahunList.find((t) => t.status === 'active')

    const handleAdd = () => {
        setDialogMode('add')
        setSelected(undefined)
        setDialogOpen(true)
    }

    const handleEdit = (item: TahunAjaranItem) => {
        setDialogMode('edit')
        setSelected(item)
        setDialogOpen(true)
    }

    const handleActivate = (item: TahunAjaranItem) => {
        setTahunList((prev) =>
            prev.map((t) => ({
                ...t,
                status: t.id === item.id ? 'active' : t.status === 'active' ? 'completed' : t.status,
                keterangan: t.id === item.id ? 'Sedang berjalan' : t.status === 'active' ? 'Sudah selesai' : t.keterangan,
            }))
        )
        toast.success(`Tahun ajaran ${item.nama} diaktifkan. (Demo)`)
    }

    const handleSave = (data: Omit<TahunAjaranItem, 'id'>) => {
        if (dialogMode === 'add') {
            setTahunList((prev) => [...prev, { ...data, id: String(Date.now()) }])
        } else if (selected) {
            setTahunList((prev) => prev.map((t) => (t.id === selected.id ? { ...t, ...data } : t)))
        }
    }

    const confirmDelete = () => {
        if (!deleteTarget) return
        setTahunList((prev) => prev.filter((t) => t.id !== deleteTarget.id))
        toast.success(`Tahun ajaran ${deleteTarget.nama} dihapus. (Demo)`)
        setDeleteTarget(null)
    }

    // ─── Column Definitions ───────────────────────────────────────────────────
    const columns: ColumnDef<TahunAjaranItem>[] = [
        {
            accessorKey: 'nama',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tahun Ajaran' />,
            cell: ({ row }) => <span className='font-semibold'>{row.getValue('nama')}</span>,
        },
        {
            accessorKey: 'mulai',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tanggal Mulai' />,
            cell: ({ row }) => <span className='text-sm'>{row.getValue('mulai')}</span>,
            enableSorting: false,
        },
        {
            accessorKey: 'selesai',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tanggal Selesai' />,
            cell: ({ row }) => <span className='text-sm'>{row.getValue('selesai')}</span>,
            enableSorting: false,
        },
        {
            accessorKey: 'semester',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Semester' />,
            cell: ({ row }) => <span className='text-sm text-muted-foreground'>{row.getValue('semester')}</span>,
            enableSorting: false,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
            cell: ({ row }) => {
                const status = row.getValue('status') as TahunAjaranStatus
                const cfg = statusConfig[status]
                const Icon = cfg.icon
                return (
                    <Badge variant='outline' className={cn('gap-1', cfg.color)}>
                        <Icon className='h-3 w-3' />
                        {cfg.label}
                    </Badge>
                )
            },
            filterFn: (row, id, value) => value.includes(row.getValue(id)),
            enableSorting: false,
        },
        {
            accessorKey: 'keterangan',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Keterangan' />,
            cell: ({ row }) => <span className='text-sm text-muted-foreground'>{row.getValue('keterangan')}</span>,
            enableSorting: false,
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <TahunAjaranRowActions
                    item={row.original}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    onActivate={handleActivate}
                />
            ),
            enableSorting: false,
            enableHiding: false,
            meta: { className: 'w-12' },
        },
    ]

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data: tahunList,
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
                    title='Tahun Ajaran'
                    description='Kelola tahun ajaran dan periode akademik madrasah.'
                >
                    <Button className='gap-1.5' onClick={handleAdd}>
                        <CalendarRange size={16} /> Tambah
                    </Button>
                </PageHeader>

                {active && (
                    <Card className='border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center gap-2'>
                                <CheckCircle2 className='h-5 w-5 text-green-600' />
                                <CardTitle className='text-green-800 dark:text-green-300'>
                                    Tahun Ajaran Aktif: {active.nama}
                                </CardTitle>
                            </div>
                            <CardDescription>
                                {active.mulai} — {active.selesai} · Semester: {active.semester}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}

                <Card>
                    <CardHeader className='space-y-4'>
                        <div>
                            <CardTitle className='flex items-center gap-2'>
                                <CalendarRange className='h-5 w-5' /> Daftar Tahun Ajaran
                            </CardTitle>
                            <CardDescription>{tahunList.length} tahun ajaran tercatat</CardDescription>
                        </div>
                        <DataTableToolbar
                            table={table}
                            searchPlaceholder='Cari tahun ajaran...'
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
                                            <TableRow key={row.id} className='group/row'>
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
                                                Tidak ada data tahun ajaran.
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

            <TahunAjaranDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                mode={dialogMode}
                initialData={selected}
                onSave={handleSave}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tahun Ajaran?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tahun ajaran <strong>{deleteTarget?.nama}</strong> akan dihapus secara permanen.
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

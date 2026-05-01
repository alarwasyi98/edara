import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { CheckCircle2, Clock, BookOpen, CalendarRange, Loader2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
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
import { orpc } from '@/lib/orpc-react'
import {
    tahunAjaranStatusColors,
    tahunAjaranStatusLabels,
    type TahunAjaranStatus,
} from '@/lib/constants'
import { TahunAjaranDialog } from './components/tahun-ajaran-dialog'
import { TahunAjaranRowActions } from './components/tahun-ajaran-row-actions'
import { type AcademicYearRecord, deriveStatus } from './types'

type AcademicYearRow = AcademicYearRecord & { status: TahunAjaranStatus }

const statusConfig: Record<TahunAjaranStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    active:    { label: tahunAjaranStatusLabels.active,    color: tahunAjaranStatusColors.active,    icon: CheckCircle2 },
    completed: { label: tahunAjaranStatusLabels.completed, color: tahunAjaranStatusColors.completed, icon: BookOpen },
    upcoming:  { label: tahunAjaranStatusLabels.upcoming,  color: tahunAjaranStatusColors.upcoming,  icon: Clock },
}

const statusOptions = Object.entries(statusConfig).map(([value, cfg]) => ({
    label: cfg.label,
    value,
}))

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export function TahunAjaran() {
    const queryClient = useQueryClient()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
    const [selected, setSelected] = useState<AcademicYearRow | undefined>()
    const [activateTarget, setActivateTarget] = useState<AcademicYearRow | null>(null)

    // Table state
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

    // ─── Data Fetching ────────────────────────────────────────
    const { data: rawList = [], isLoading } = useQuery(
        orpc.tenant.academicYears.list.queryOptions({})
    )

    const tahunList: AcademicYearRow[] = rawList.map((item) => ({
        ...item,
        status: deriveStatus(item),
    }))

    const active = tahunList.find((t) => t.status === 'active')

    // ─── Mutations ────────────────────────────────────────────
    const activateMutation = useMutation(
        orpc.tenant.academicYears.activate.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: orpc.tenant.academicYears.list.key() })
                toast.success(`Tahun ajaran berhasil diaktifkan.`)
                setActivateTarget(null)
            },
            onError: (error) => {
                toast.error(error.message || 'Gagal mengaktifkan tahun ajaran.')
            },
        })
    )

    const handleAdd = () => {
        setDialogMode('add')
        setSelected(undefined)
        setDialogOpen(true)
    }

    const handleEdit = (item: AcademicYearRow) => {
        setDialogMode('edit')
        setSelected(item)
        setDialogOpen(true)
    }

    const handleActivate = (item: AcademicYearRow) => {
        setActivateTarget(item)
    }

    const confirmActivate = () => {
        if (!activateTarget) return
        activateMutation.mutate({ id: activateTarget.id })
    }

    // ─── Column Definitions ───────────────────────────────────
    const columns: ColumnDef<AcademicYearRow>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tahun Ajaran' />,
            cell: ({ row }) => <span className='font-semibold'>{row.getValue('name')}</span>,
        },
        {
            accessorKey: 'startDate',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tanggal Mulai' />,
            cell: ({ row }) => <span className='text-sm'>{formatDate(row.getValue('startDate'))}</span>,
            enableSorting: false,
        },
        {
            accessorKey: 'endDate',
            header: ({ column }) => <DataTableColumnHeader column={column} title='Tanggal Selesai' />,
            cell: ({ row }) => <span className='text-sm'>{formatDate(row.getValue('endDate'))}</span>,
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
            id: 'actions',
            cell: ({ row }) => (
                <TahunAjaranRowActions
                    item={row.original}
                    onEdit={handleEdit}
                    onActivate={handleActivate}
                />
            ),
            enableSorting: false,
            enableHiding: false,
            meta: { className: 'w-12' },
        },
    ]

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

                {isLoading ? (
                    <Card>
                        <CardHeader className='pb-3'>
                            <Skeleton className='h-5 w-64' />
                            <Skeleton className='h-4 w-48 mt-2' />
                        </CardHeader>
                    </Card>
                ) : active && (
                    <Card className='border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'>
                        <CardHeader className='pb-3'>
                            <div className='flex items-center gap-2'>
                                <CheckCircle2 className='h-5 w-5 text-green-600' />
                                <CardTitle className='text-green-800 dark:text-green-300'>
                                    Tahun Ajaran Aktif: {active.name}
                                </CardTitle>
                            </div>
                            <CardDescription>
                                {formatDate(active.startDate)} — {formatDate(active.endDate)}
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
                            searchKey='name'
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
                                    {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                {Array.from({ length: columns.length }).map((_, j) => (
                                                    <TableCell key={j}>
                                                        <Skeleton className='h-4 w-full' />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : table.getRowModel().rows?.length ? (
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
            />

            {/* Activate confirmation dialog */}
            <AlertDialog open={!!activateTarget} onOpenChange={(o) => !o && setActivateTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aktifkan Tahun Ajaran?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tahun ajaran <strong>{activateTarget?.name}</strong> akan diaktifkan.
                            {active && (
                                <> Tahun ajaran <strong>{active.name}</strong> yang saat ini aktif akan dinonaktifkan.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={activateMutation.isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmActivate}
                            disabled={activateMutation.isPending}
                        >
                            {activateMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Ya, Aktifkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

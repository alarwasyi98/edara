import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { type DateRange } from 'react-day-picker'
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    getPaginationRowModel,
} from '@tanstack/react-table'
import {
    Receipt,
    CircleCheckBig,
    CircleAlert,
    MoreHorizontal,
    Eye,
    Printer,
    CalendarIcon,
    X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
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
import { formatRupiah, formatBulanTagihan, formatDateShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import { sppStatusColors } from '@/lib/constants'
import { type StudentFinanceRecord } from '../data/schema'
import { getStudentFinance, getFinanceSummary } from '../data/student-finance'

// ── Status badge labels ─────────────────────────

const statusLabels: Record<StudentFinanceRecord['status'], string> = {
    paid:    'Lunas',
    partial: 'Sebagian',
    unpaid:  'Belum Bayar',
    overdue: 'Menunggak',
}

// ── Column definitions ──────────────────────────

const columns: ColumnDef<StudentFinanceRecord>[] = [
    {
        accessorKey: 'bulan',
        header: 'Bulan',
        cell: ({ row }) => (
            <span className='text-sm'>
                {formatBulanTagihan(row.getValue('bulan'))}
            </span>
        ),
    },
    {
        accessorKey: 'jenis',
        header: 'Jenis',
        cell: ({ row }) => (
            <Badge variant='outline' className='text-nowrap border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400'>
                {row.getValue('jenis')}
            </Badge>
        ),
    },
    {
        accessorKey: 'jumlah',
        header: 'Jumlah',
        cell: ({ row }) => (
            <span className='font-mono text-sm'>
                {formatRupiah(row.getValue('jumlah'))}
            </span>
        ),
    },
    {
        accessorKey: 'dibayar',
        header: 'Dibayar',
        cell: ({ row }) => (
            <span className='font-mono text-sm'>
                {formatRupiah(row.getValue('dibayar'))}
            </span>
        ),
    },
    {
        id: 'sisa',
        header: 'Sisa',
        cell: ({ row }) => {
            const sisa =
                (row.original.jumlah as number) -
                (row.original.dibayar as number)
            return (
                <span
                    className={cn(
                        'font-mono text-sm',
                        sisa > 0 && 'text-red-600 dark:text-red-400'
                    )}
                >
                    {formatRupiah(sisa)}
                </span>
            )
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue(
                'status'
            ) as StudentFinanceRecord['status']
            return (
                <Badge variant='outline' className={cn('capitalize', sppStatusColors[status])}>
                    {statusLabels[status]}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'tanggalBayar',
        header: 'Tgl. Bayar',
        cell: ({ row }) => {
            const val = row.getValue('tanggalBayar') as Date | null
            return (
                <span className='text-sm text-muted-foreground'>
                    {val ? formatDateShort(val) : '-'}
                </span>
            )
        },
    },
    {
        id: 'actions',
        cell: () => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 p-0'
                    >
                        <MoreHorizontal className='h-4 w-4' />
                        <span className='sr-only'>Buka menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuItem>
                        <Eye className='mr-2 h-4 w-4' />
                        Lihat Detail
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Printer className='mr-2 h-4 w-4' />
                        Cetak Kwitansi
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
    },
]

// ── Component ───────────────────────────────────

interface TabKeuanganProps {
    studentId: string
}

export function TabKeuangan({ studentId }: TabKeuanganProps) {
    const records = useMemo(
        () => getStudentFinance(studentId),
        [studentId]
    )
    const summary = useMemo(() => getFinanceSummary(records), [records])

    // ── Filters ─────────────────────────────────
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [filterJenis, setFilterJenis] = useState<string>('all')
    const [calendarOpen, setCalendarOpen] = useState(false)

    // Unique jenis values for the dropdown
    const jenisOptions = useMemo(() => {
        const set = new Set(records.map((r) => r.jenis))
        return Array.from(set).sort()
    }, [records])

    // Apply filters
    const filtered = useMemo(() => {
        return records.filter((r) => {
            // Filter by jenis
            if (filterJenis !== 'all' && r.jenis !== filterJenis) return false

            // Filter by date range (tanggalBayar)
            if (dateRange?.from || dateRange?.to) {
                if (!r.tanggalBayar) return false
                const d = new Date(r.tanggalBayar)
                if (dateRange.from && d < dateRange.from) return false
                if (dateRange.to) {
                    const toEnd = new Date(dateRange.to)
                    toEnd.setHours(23, 59, 59, 999)
                    if (d > toEnd) return false
                }
            }

            return true
        })
    }, [records, dateRange, filterJenis])

    const table = useReactTable({
        data: filtered,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: {
            pagination: { pageSize: 12 },
        },
    })

    const hasActiveFilter =
        (dateRange?.from !== undefined || dateRange?.to !== undefined) ||
        filterJenis !== 'all'

    const clearFilters = () => {
        setDateRange(undefined)
        setFilterJenis('all')
    }

    return (
        <div className='space-y-4'>
            {/* Summary Cards */}
            <div className='grid gap-4 md:grid-cols-3'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm font-medium text-muted-foreground'>
                            Total Tagihan
                        </CardTitle>
                        <Receipt className='h-4 w-4 text-muted-foreground' />
                    </CardHeader>
                    <CardContent>
                        <p className='text-2xl font-bold'>
                            {formatRupiah(summary.totalTagihan)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                            Tahun ajaran 2025/2026
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm font-medium text-muted-foreground'>
                            Sudah Dibayar
                        </CardTitle>
                        <CircleCheckBig className='h-4 w-4 text-green-600' />
                    </CardHeader>
                    <CardContent>
                        <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                            {formatRupiah(summary.sudahDibayar)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                            {summary.totalTagihan > 0
                                ? `${Math.round((summary.sudahDibayar / summary.totalTagihan) * 100)}% dari total`
                                : '-'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between pb-2'>
                        <CardTitle className='text-sm font-medium text-muted-foreground'>
                            Sisa Tunggakan
                        </CardTitle>
                        <CircleAlert className='h-4 w-4 text-red-600' />
                    </CardHeader>
                    <CardContent>
                        <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
                            {formatRupiah(summary.sisaTunggakan)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                            {summary.totalTagihan > 0
                                ? `${Math.round((summary.sisaTunggakan / summary.totalTagihan) * 100)}% belum lunas`
                                : '-'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Payment History Table */}
            <Card>
                <CardHeader>
                    <CardTitle className='text-base'>
                        Riwayat Keuangan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* ── Filter Row ── */}
                    <div className='mb-4 flex flex-wrap items-center gap-2'>
                        {/* Date Range Picker */}
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    className={cn(
                                        'h-8 gap-1.5 text-xs',
                                        (dateRange?.from || dateRange?.to) && 'bg-accent'
                                    )}
                                >
                                    <CalendarIcon className='h-3.5 w-3.5' />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, 'd MMM yyyy', { locale: idLocale })} –{' '}
                                                {format(dateRange.to, 'd MMM yyyy', { locale: idLocale })}
                                            </>
                                        ) : (
                                            format(dateRange.from, 'd MMM yyyy', { locale: idLocale })
                                        )
                                    ) : (
                                        'Rentang Tanggal'
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0' align='start'>
                                <Calendar
                                    mode='range'
                                    selected={dateRange}
                                    onSelect={(range) => {
                                        setDateRange(range)
                                        if (range?.from && range?.to) setCalendarOpen(false)
                                    }}
                                    numberOfMonths={2}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Jenis Filter */}
                        <Select value={filterJenis} onValueChange={setFilterJenis}>
                            <SelectTrigger className='h-8 w-[160px] text-xs'>
                                <SelectValue placeholder='Semua Jenis' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>Semua Jenis</SelectItem>
                                {jenisOptions.map((j) => (
                                    <SelectItem key={j} value={j}>{j}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear filters */}
                        {hasActiveFilter && (
                            <Button
                                variant='ghost'
                                size='sm'
                                className='h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground'
                                onClick={clearFilters}
                            >
                                <X className='h-3.5 w-3.5' />
                                Reset Filter
                            </Button>
                        )}

                        <span className='ml-auto text-xs text-muted-foreground'>
                            {filtered.length} dari {records.length} transaksi
                        </span>
                    </div>

                    <div className='rounded-md border'>
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column
                                                            .columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className='h-24 text-center'
                                        >
                                            Tidak ada data keuangan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {table.getPageCount() > 1 && (
                        <div className='flex items-center justify-end space-x-2 pt-4'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                Sebelumnya
                            </Button>
                            <span className='text-sm text-muted-foreground'>
                                Halaman {table.getState().pagination.pageIndex + 1} dari{' '}
                                {table.getPageCount()}
                            </span>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                Selanjutnya
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

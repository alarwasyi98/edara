import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { formatDateShort } from '@/lib/format'
import { Clock } from 'lucide-react'
import { type CalendarEvent } from '../data/schema'
import { categoryColorMap, categoryIconMap, categoryOptions } from '../data/data'

export const kalenderColumns: ColumnDef<CalendarEvent>[] = [
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
        meta: {
            className: cn('bg-background max-md:sticky start-0 z-10 rounded-tl-[inherit]'),
        },
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
        accessorKey: 'title',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Judul Kegiatan' />
        ),
        cell: ({ row }) => (
            <LongText className='max-w-64 font-medium'>{row.getValue('title')}</LongText>
        ),
        meta: {
            className: cn(
                'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
                'bg-background ps-0.5 max-md:sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
            ),
        },
        enableHiding: false,
    },
    {
        accessorKey: 'category',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Kategori' />
        ),
        cell: ({ row }) => {
            const category = row.getValue('category') as CalendarEvent['category']
            const badgeColor = categoryColorMap.get(category)
            const Icon = categoryIconMap.get(category)
            const label =
                categoryOptions.find((c) => c.value === category)?.label ?? category
            return (
                <Badge variant='outline' className={cn('gap-1', badgeColor)}>
                    {Icon && <Icon className='h-3 w-3' />}
                    {label}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        enableSorting: false,
    },
    {
        id: 'date',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Tanggal' />
        ),
        cell: ({ row }) => {
            const start = row.original.startDate
            const end = row.original.endDate
            if (end) {
                return (
                    <div className='text-nowrap text-sm'>
                        {formatDateShort(start)} - {formatDateShort(end)}
                    </div>
                )
            }
            return <div className='text-nowrap text-sm'>{formatDateShort(start)}</div>
        },
        sortingFn: (rowA, rowB) => {
            return rowA.original.startDate.getTime() - rowB.original.startDate.getTime()
        },
    },
    {
        accessorKey: 'timeInfo',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Waktu' />
        ),
        cell: ({ row }) => {
            const time = row.getValue('timeInfo') as string | undefined
            if (!time) return <span className='text-muted-foreground'>-</span>

            return (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Clock className='h-3 w-3' />
                    <span>{time}</span>
                </div>
            )
        },
        enableSorting: false,
    },
    {
        accessorKey: 'location',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Lokasi' />
        ),
        cell: ({ row }) => (
            <span className='text-sm text-muted-foreground'>
                {row.getValue('location') || '-'}
            </span>
        ),
        enableSorting: false,
    },
]

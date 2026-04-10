import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { formatDateShort } from '@/lib/format'
import { genderLabels } from '@/lib/constants'
import { statusColorMap, statusOptions } from '../data/data'
import { type Student } from '../data/schema'
import { SiswaRowActions } from './siswa-row-actions'

export const siswaColumns: ColumnDef<Student>[] = [
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
        accessorKey: 'nis',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='NIS' />
        ),
        cell: ({ row }) => (
            <span className='font-mono text-sm'>{row.getValue('nis')}</span>
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
        accessorKey: 'namaLengkap',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Nama Lengkap' />
        ),
        cell: ({ row }) => (
            <LongText className='max-w-40'>{row.getValue('namaLengkap')}</LongText>
        ),
        meta: { className: 'w-40' },
    },
    {
        accessorKey: 'jenisKelamin',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='L/P' />
        ),
        cell: ({ row }) => {
            const jk = row.getValue('jenisKelamin') as 'L' | 'P'
            return <span className='text-sm'>{genderLabels[jk]}</span>
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        enableSorting: false,
    },
    {
        accessorKey: 'kelas',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Kelas' />
        ),
        cell: ({ row }) => (
            <Badge variant='outline' className='text-nowrap'>
                {row.getValue('kelas')}
            </Badge>
        ),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        sortingFn: (rowA, rowB) => {
            const order: Record<string, number> = { VII: 1, VIII: 2, IX: 3 }
            const parse = (v: string) => {
                const [level, suffix] = v.split('-')
                return [order[level] ?? 0, suffix ?? ''] as const
            }
            const [la, sa] = parse(rowA.getValue('kelas'))
            const [lb, sb] = parse(rowB.getValue('kelas'))
            return la !== lb ? la - lb : sa.localeCompare(sb)
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
            const status = row.getValue('status') as Student['status']
            const badgeColor = statusColorMap.get(status)
            const label =
                statusOptions.find((s) => s.value === status)?.label ?? status
            return (
                <Badge variant='outline' className={cn('capitalize', badgeColor)}>
                    {label}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        enableHiding: false,
        enableSorting: false,
    },
    {
        accessorKey: 'teleponWali',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Telp. Wali' />
        ),
        cell: ({ row }) => <div>{row.getValue('teleponWali')}</div>,
        enableSorting: false,
    },
    {
        accessorKey: 'tanggalLahir',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Tgl. Lahir' />
        ),
        cell: ({ row }) => (
            <div className='text-nowrap text-sm'>
                {formatDateShort(row.getValue('tanggalLahir'))}
            </div>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => <SiswaRowActions row={row} />,
        enableSorting: false,
        enableHiding: false,
    },
]

import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { genderLabels, teacherStatusColors } from '@/lib/constants'
import { type Teacher } from '../data/schema'
import { TeacherRowActions } from './teacher-row-actions'

export const teacherColumns: ColumnDef<Teacher>[] = [
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
        accessorKey: 'namaLengkap',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Nama Lengkap' />
        ),
        cell: ({ row }) => (
            <LongText className='max-w-44'>{row.getValue('namaLengkap')}</LongText>
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
        accessorKey: 'jenisKelamin',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='L/P' />
        ),
        cell: ({ row }) => {
            const jk = row.getValue('jenisKelamin') as 'L' | 'P'
            return <span className='text-sm'>{genderLabels[jk]}</span>
        },
        enableSorting: false,
    },
    {
        accessorKey: 'mataPelajaran',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Mata Pelajaran' />
        ),
        cell: ({ row }) => (
            <Badge variant='outline' className='text-nowrap'>
                {row.getValue('mataPelajaran')}
            </Badge>
        ),
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
        enableSorting: false,
    },
    {
        accessorKey: 'pendidikanTerakhir',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Pendidikan' />
        ),
        cell: ({ row }) => <span>{row.getValue('pendidikanTerakhir')}</span>,
        enableSorting: false,
    },
    {
        accessorKey: 'telepon',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Telepon' />
        ),
        cell: ({ row }) => <div>{row.getValue('telepon')}</div>,
        enableSorting: false,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
            const status = row.getValue('status') as Teacher['status']
            return (
                <Badge
                    variant='outline'
                    className={cn(
                        'capitalize',
                        teacherStatusColors[status]
                    )}
                >
                    {status === 'active' ? 'Aktif' : 'Nonaktif'}
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
        id: 'actions',
        cell: ({ row }) => <TeacherRowActions row={row} />,
        enableSorting: false,
        enableHiding: false,
    },
]

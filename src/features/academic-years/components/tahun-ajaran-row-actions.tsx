import { MoreHorizontal, Pencil, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AcademicYearRecord } from '../types'
import type { TahunAjaranStatus } from '@/lib/constants'

type AcademicYearRow = AcademicYearRecord & { status: TahunAjaranStatus }

interface TahunAjaranRowActionsProps {
    item: AcademicYearRow
    onEdit: (item: AcademicYearRow) => void
    onActivate: (item: AcademicYearRow) => void
}

export function TahunAjaranRowActions({
    item,
    onEdit,
    onActivate,
}: TahunAjaranRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>Buka menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {item.status !== 'active' && (
                    <DropdownMenuItem
                        className='text-green-700 focus:text-green-700 dark:text-green-400'
                        onClick={() => onActivate(item)}
                    >
                        <CheckCircle2 className='mr-2 h-4 w-4' />
                        Aktifkan
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className='mr-2 h-4 w-4' />
                    Edit
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

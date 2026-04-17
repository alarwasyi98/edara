import { MoreHorizontal, Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TahunAjaranItem = {
    id: string
    nama: string
    mulai: string
    selesai: string
    semester: string
    status: 'active' | 'completed' | 'upcoming'
    keterangan?: string
}

interface TahunAjaranRowActionsProps {
    item: TahunAjaranItem
    onEdit: (item: TahunAjaranItem) => void
    onDelete: (item: TahunAjaranItem) => void
    onActivate: (item: TahunAjaranItem) => void
}

export function TahunAjaranRowActions({
    item,
    onEdit,
    onDelete,
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={() => onDelete(item)}
                    disabled={item.status === 'active'}
                >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Hapus
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

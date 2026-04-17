import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Kelas = {
    id: string
    namaKelas: string
    jenjang: 'VII' | 'VIII' | 'IX'
    waliKelas: string
    jumlahSiswa: number
    kapasitas: number
    tahunAjaran: string
}

interface ClassesRowActionsProps {
    kelas: Kelas
    onEdit: (k: Kelas) => void
    onDelete: (k: Kelas) => void
}

export function ClassesRowActions({ kelas, onEdit, onDelete }: ClassesRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>Buka menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onEdit(kelas)}>
                    <Pencil className='mr-2 h-4 w-4' />
                    Edit Kelas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={() => onDelete(kelas)}
                >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Hapus Kelas
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

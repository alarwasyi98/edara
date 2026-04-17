import { Link } from '@tanstack/react-router'
import { Eye, MoreHorizontal, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Row } from '@tanstack/react-table'
import { type Teacher } from '../data/schema'
import { useTeacher } from './teacher-provider'

interface TeacherRowActionsProps {
    row: Row<Teacher>
}

export function TeacherRowActions({ row }: TeacherRowActionsProps) {
    const { setOpen, setCurrentRow } = useTeacher()

    const handleDelete = () => {
        setCurrentRow(row.original)
        setOpen('delete')
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-8 w-8 p-0'>
                    <MoreHorizontal className='h-4 w-4' />
                    <span className='sr-only'>Buka menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuItem asChild>
                    <Link to='/teachers/$id' params={{ id: row.original.id }}>
                        <Eye className='mr-2 h-4 w-4' />
                        Lihat Detail
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                    setCurrentRow(row.original)
                    setOpen('edit')
                }}>
                    <Pencil className='mr-2 h-4 w-4' />
                    Edit Guru
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={handleDelete}
                >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Hapus Guru
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
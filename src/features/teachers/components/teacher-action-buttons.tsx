import { UserPlus, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTeacher } from './teacher-provider'

export function TeacherActionButtons() {
    const { setOpen } = useTeacher()
    return (
        <div className='flex gap-2'>
            <Button variant='outline' className='gap-1.5' onClick={() => setOpen('import')}>
                <Upload size={16} /> Import
            </Button>
            <Button variant='outline' className='gap-1.5' onClick={() => setOpen('export')}>
                <Download size={16} /> Eksport
            </Button>
            <Button className='gap-1.5' onClick={() => setOpen('add')}>
                <UserPlus size={16} /> Tambah Guru
            </Button>
        </div>
    )
}
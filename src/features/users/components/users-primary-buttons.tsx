import { MailPlus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='gap-1.5'
        onClick={() => setOpen('invite')}
      >
        <MailPlus size={16} /> Undang
      </Button>
      <Button className='gap-1.5' onClick={() => setOpen('add')}>
        <UserPlus size={16} /> Tambah
      </Button>
    </div>
  )
}

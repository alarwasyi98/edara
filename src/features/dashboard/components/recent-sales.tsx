import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatRupiah } from '@/lib/format'

const payments = [
  {
    initials: 'AR',
    name: 'Ahmad Rizki F.',
    kelas: 'VII-A',
    amount: 450000,
  },
  {
    initials: 'NP',
    name: 'Nisa Putri Ayu',
    kelas: 'VIII-B',
    amount: 450000,
  },
  {
    initials: 'MF',
    name: 'Muhammad Faqih',
    kelas: 'IX-C',
    amount: 900000,
  },
  {
    initials: 'SA',
    name: 'Siti Aminah',
    kelas: 'VII-C',
    amount: 450000,
  },
  {
    initials: 'HR',
    name: 'Hasan Ridwan',
    kelas: 'VIII-A',
    amount: 1350000,
  },
]

export function RecentPayments() {
  return (
    <div className='space-y-8'>
      {payments.map((item) => (
        <div key={item.name} className='flex items-center gap-4'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback>{item.initials}</AvatarFallback>
          </Avatar>
          <div className='flex flex-1 flex-wrap items-center justify-between'>
            <div className='space-y-1'>
              <p className='text-sm leading-none font-medium'>{item.name}</p>
              <p className='text-sm text-muted-foreground'>
                Kelas {item.kelas}
              </p>
            </div>
            <div className='font-medium text-green-600 dark:text-green-400'>
              +{formatRupiah(item.amount)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

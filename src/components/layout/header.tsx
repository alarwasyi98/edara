import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTenant } from '@/hooks/use-tenant'
import { ROLES } from '@/lib/constants'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)
  const { activeAssignment } = useTenant()

  const isSuperAdminInUnit =
    activeAssignment?.role === ROLES.SUPER_ADMIN &&
    activeAssignment.unitId !== null

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-16 items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg'
        )}
      >
        <SidebarTrigger variant='outline' className='max-md:scale-125' />
        <Separator orientation='vertical' className='h-6' />
        {children}
      </div>

      {isSuperAdminInUnit && (
        <div className='flex items-center gap-2 border-b bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground'>
          <span>
            Anda sedang melihat data{' '}
            <strong className='font-medium text-foreground'>
              {activeAssignment.unitName}
            </strong>
          </span>
          <button
            type='button'
            className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
            onClick={() => {
              /* TODO: navigate back to foundation-level view */
            }}
          >
            <ArrowLeft className='size-3' />
            Kembali ke Yayasan
          </button>
        </div>
      )}
    </header>
  )
}

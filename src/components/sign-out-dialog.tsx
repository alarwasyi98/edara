import { useLocation } from '@tanstack/react-router'
import { signOut } from '@/lib/auth.functions'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    const currentPath = location.href
    window.location.href = `/sign-in?redirect=${encodeURIComponent(currentPath)}`
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      destructive
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}

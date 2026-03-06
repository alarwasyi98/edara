import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useTheme } from '@/context/theme-provider'

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group [&_div[data-content]]:w-full'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success:
            'group-[.toaster]:bg-green-500 group-[.toaster]:text-white group-[.toaster]:border-green-600 dark:group-[.toaster]:bg-green-600 dark:group-[.toaster]:border-green-700',
          error:
            'group-[.toaster]:bg-red-500 group-[.toaster]:text-white group-[.toaster]:border-red-600 dark:group-[.toaster]:bg-red-600 dark:group-[.toaster]:border-red-700',
          warning:
            'group-[.toaster]:bg-amber-500 group-[.toaster]:text-white group-[.toaster]:border-amber-600 dark:group-[.toaster]:bg-amber-600 dark:group-[.toaster]:border-amber-700',
          info:
            'group-[.toaster]:bg-blue-500 group-[.toaster]:text-white group-[.toaster]:border-blue-600 dark:group-[.toaster]:bg-blue-600 dark:group-[.toaster]:border-blue-700',
        },
      }}
      {...props}
    />
  )
}

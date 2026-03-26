import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        // Geist: high-contrast — primary fill (black light / off-white dark)
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        // Geist Color-1 bg + Color-9 text — subtle, harmonious
        secondary:
          'border-border bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        // Error state — keeps red, darkens in dark mode
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        // Border-only — transparent bg, uses foreground text
        outline:
          'text-foreground border-border bg-transparent [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        // Ghost: muted bg + muted-foreground text — lowest emphasis
        ghost:
          'border-transparent bg-muted text-muted-foreground [a&]:hover:bg-secondary [a&]:hover:text-secondary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot='badge'
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

import { Banknote, Building2, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PaymentMethod } from '../types'

interface PaymentMethodSelectorProps {
    value: PaymentMethod
    onChange: (method: PaymentMethod) => void
}

const METHODS: Array<{ id: PaymentMethod; label: string; icon: React.ReactNode; description: string }> = [
    {
        id: 'tunai',
        label: 'Tunai',
        icon: <Banknote className='h-5 w-5' />,
        description: 'Cash langsung',
    },
    {
        id: 'transfer',
        label: 'Transfer Bank',
        icon: <Building2 className='h-5 w-5' />,
        description: 'ATM / m-banking',
    },
    {
        id: 'qris',
        label: 'QRIS',
        icon: <QrCode className='h-5 w-5' />,
        description: 'Scan QR code',
    },
]

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
    return (
        <div className='grid grid-cols-3 gap-2'>
            {METHODS.map(method => {
                const isActive = value === method.id
                return (
                    <button
                        key={method.id}
                        type='button'
                        onClick={() => onChange(method.id)}
                        className={cn(
                            'flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-all duration-150',
                            'hover:border-primary/50 hover:bg-primary/5',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isActive
                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                : 'border-border bg-background text-muted-foreground'
                        )}
                    >
                        <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
                            {method.icon}
                        </span>
                        <span className={cn('text-sm font-medium leading-tight', isActive ? 'text-primary' : 'text-foreground')}>
                            {method.label}
                        </span>
                        <span className='text-[11px] text-muted-foreground leading-tight'>
                            {method.description}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}

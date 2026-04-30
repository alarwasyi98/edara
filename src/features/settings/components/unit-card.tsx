import { Building2, MoreHorizontal, Pencil, Power } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  unitLevelColors,
  unitStatusColors,
  type UnitLevel,
} from '@/lib/constants'

export interface UnitCardData {
  id: string
  name: string
  level: string
  npsn: string | null
  isActive: boolean
}

interface UnitCardProps {
  unit: UnitCardData
  onEdit: (unit: UnitCardData) => void
  onToggleActive: (unit: UnitCardData) => void
}

export function UnitCard({ unit, onEdit, onToggleActive }: UnitCardProps) {
  const levelColor =
    unitLevelColors[unit.level as UnitLevel] ??
    'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400'

  const statusColor = unit.isActive
    ? unitStatusColors.active
    : unitStatusColors.inactive

  return (
    <Card className='group relative transition-shadow duration-150 hover:shadow-md'>
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-muted'>
            <Building2 className='size-5 text-muted-foreground' />
          </div>
          <div className='space-y-1'>
            <h3 className='font-semibold leading-none'>{unit.name}</h3>
            <Badge variant='outline' className={levelColor}>
              {unit.level}
            </Badge>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100'
            >
              <MoreHorizontal className='size-4' />
              <span className='sr-only'>Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(unit)}>
              <Pencil className='mr-2 size-4' />
              Edit Unit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleActive(unit)}>
              <Power className='mr-2 size-4' />
              {unit.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className='space-y-2 pt-0'>
        {unit.npsn && (
          <p className='text-sm text-muted-foreground'>
            NPSN: <span className='font-mono'>{unit.npsn}</span>
          </p>
        )}
        <Badge variant='outline' className={statusColor}>
          {unit.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      </CardContent>
    </Card>
  )
}

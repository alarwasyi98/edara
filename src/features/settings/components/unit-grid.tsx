import { Plus, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UnitCard, type UnitCardData } from './unit-card'

interface UnitGridProps {
  units: UnitCardData[]
  isLoading: boolean
  onAdd: () => void
  onEdit: (unit: UnitCardData) => void
  onToggleActive: (unit: UnitCardData) => void
}

function UnitGridSkeleton() {
  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className='space-y-3 rounded-lg border p-6'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 rounded-lg' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-5 w-16' />
            </div>
          </div>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-5 w-14' />
        </div>
      ))}
    </div>
  )
}

function UnitEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-lg border border-dashed py-16'>
      <div className='flex size-16 items-center justify-center rounded-full bg-muted'>
        <School className='size-8 text-muted-foreground' />
      </div>
      <h3 className='mt-4 text-lg font-semibold'>Belum ada unit terdaftar</h3>
      <p className='mt-1 text-sm text-muted-foreground'>
        Tambahkan unit pendidikan pertama untuk mulai mengelola data.
      </p>
      <Button onClick={onAdd} className='mt-6'>
        <Plus className='mr-2 size-4' />
        Tambah Unit Pertama
      </Button>
    </div>
  )
}

export function UnitGrid({
  units,
  isLoading,
  onAdd,
  onEdit,
  onToggleActive,
}: UnitGridProps) {
  if (isLoading) {
    return <UnitGridSkeleton />
  }

  if (units.length === 0) {
    return <UnitEmptyState onAdd={onAdd} />
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {units.map((unit) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  )
}

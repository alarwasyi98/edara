import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentSection } from '../components/content-section'
import { UnitFormDrawer } from '../components/unit-form-drawer'
import { UnitGrid } from '../components/unit-grid'
import type { UnitCardData } from '../components/unit-card'
import { useUnits, useUpdateUnit } from '../hooks'

export function SettingsUnits() {
  const { data: units, isLoading } = useUnits()
  const updateUnit = useUpdateUnit()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<UnitCardData | null>(null)

  const handleAdd = () => {
    setEditingUnit(null)
    setDrawerOpen(true)
  }

  const handleEdit = (unit: UnitCardData) => {
    setEditingUnit(unit)
    setDrawerOpen(true)
  }

  const handleToggleActive = (unit: UnitCardData) => {
    updateUnit.mutate({
      id: unit.id,
      isActive: !unit.isActive,
    })
  }

  const unitCards: UnitCardData[] = units.map((u) => ({
    id: u.id,
    name: u.name,
    level: u.level,
    npsn: u.npsn,
    isActive: u.isActive,
  }))

  return (
    <>
      <ContentSection
        title='Manajemen Unit'
        desc='Kelola unit pendidikan yang terdaftar di yayasan Anda.'
      >
        <div className='space-y-6'>
          <div className='flex justify-end'>
            <Button onClick={handleAdd}>
              <Plus className='mr-2 size-4' />
              Tambah Unit
            </Button>
          </div>
          <UnitGrid
            units={unitCards}
            isLoading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
          />
        </div>
      </ContentSection>

      <UnitFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editingUnit={editingUnit}
      />
    </>
  )
}

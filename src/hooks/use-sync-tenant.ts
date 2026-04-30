import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { orpc } from '@/lib/orpc-react'
import { useTenantStore } from '@/stores/tenant-store'

export function useSyncTenant(): void {
  const { data, isSuccess } = useQuery(
    orpc.tenant.schools.get.queryOptions({}),
  )
  const setAssignments = useTenantStore((s) => s.setAssignments)

  useEffect(() => {
    if (!isSuccess || !data) return

    const assignments = data.units.map((unit) => ({
      assignmentId: unit.id,
      schoolId: data.id,
      schoolName: data.name,
      unitId: unit.id,
      unitName: unit.name,
      role: '',
    }))

    if (assignments.length === 0) {
      setAssignments([
        {
          assignmentId: data.id,
          schoolId: data.id,
          schoolName: data.name,
          unitId: null,
          unitName: null,
          role: '',
        },
      ])
    } else {
      setAssignments(assignments)
    }
  }, [isSuccess, data, setAssignments])
}

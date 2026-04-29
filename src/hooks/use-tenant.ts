import { useTenantStore, type TenantAssignment } from '@/stores/tenant-store'

export function useTenant() {
  const assignments = useTenantStore((s) => s.assignments)
  const activeAssignmentId = useTenantStore((s) => s.activeAssignmentId)
  const setActiveAssignmentId = useTenantStore((s) => s.setActiveAssignmentId)

  const activeAssignment: TenantAssignment | null =
    assignments.find((a) => a.assignmentId === activeAssignmentId) ??
    assignments[0] ??
    null

  return {
    activeAssignment,
    assignments,
    setActiveAssignmentId,
  }
}

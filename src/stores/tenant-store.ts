import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TenantAssignment {
  assignmentId: string
  schoolId: string
  schoolName: string
  unitId: string | null
  unitName: string | null
  role: string
}

interface TenantState {
  assignments: TenantAssignment[]
  activeAssignmentId: string | null
  setAssignments: (assignments: TenantAssignment[]) => void
  setActiveAssignmentId: (id: string) => void
  getActiveAssignment: () => TenantAssignment | null
  reset: () => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      assignments: [],
      activeAssignmentId: null,

      setAssignments: (assignments) => {
        const current = get().activeAssignmentId
        const stillValid = assignments.some((a) => a.assignmentId === current)
        set({
          assignments,
          activeAssignmentId: stillValid
            ? current
            : (assignments[0]?.assignmentId ?? null),
        })
      },

      setActiveAssignmentId: (id) => set({ activeAssignmentId: id }),

      getActiveAssignment: () => {
        const { assignments, activeAssignmentId } = get()
        return (
          assignments.find((a) => a.assignmentId === activeAssignmentId) ??
          assignments[0] ??
          null
        )
      },

      reset: () => set({ assignments: [], activeAssignmentId: null }),
    }),
    { name: 'edara-tenant' }
  )
)

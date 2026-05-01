import type { TahunAjaranStatus } from '@/lib/constants'

/**
 * Academic Year as returned from the API (DB shape).
 */
export interface AcademicYearRecord {
  id: string
  schoolId: string
  unitId: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

/**
 * Derive UI status from DB fields.
 * - isActive=true → "active"
 * - endDate < today → "completed"
 * - else → "upcoming"
 */
export function deriveStatus(record: AcademicYearRecord): TahunAjaranStatus {
  if (record.isActive) return 'active'
  if (new Date(record.endDate) < new Date()) return 'completed'
  return 'upcoming'
}

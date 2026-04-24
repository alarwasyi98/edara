import { eq } from 'drizzle-orm'
import { authorized } from '../authorized'
import { db } from '@/server/db'
import { userSchoolAssignments } from '@/server/db/schema/users'
import * as z from 'zod'

export const listUsersWithAssignments = authorized.handler(async () => {
  const assignments = await db.query.userSchoolAssignments.findMany({
    with: {
      school: true,
      unit: true,
    },
  })
  return assignments
})

export const assignUserToSchool = authorized
  .input(z.object({
    userId: z.string(),
    schoolId: z.string(),
    unitId: z.string().optional(),
    role: z.enum(['super_admin', 'kepala_sekolah', 'admin_tu', 'bendahara']),
  }))
  .handler(async ({ input }) => {
    return await db.insert(userSchoolAssignments).values({
      userId: input.userId,
      schoolId: input.schoolId,
      unitId: input.unitId,
      role: input.role,
    })
  })

export const toggleAssignment = authorized
  .input(z.object({ assignmentId: z.string(), isActive: z.boolean() }))
  .handler(async ({ input }) => {
    return await db.update(userSchoolAssignments)
      .set({ isActive: input.isActive })
      .where(eq(userSchoolAssignments.id, input.assignmentId))
  })
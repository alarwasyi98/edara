import { eq } from 'drizzle-orm'
import { authOnly } from '../authorized'
import { db } from '@/server/db'
import { schools } from '@/server/db/schema/schools'
import { resolveAssignment } from '../helpers/assignment'
import { notFound, forbidden } from '@/server/shared'
import { updateSchoolSchema } from '@/lib/validators/tenant'

export const getSchool = authOnly.handler(async ({ context }) => {
  const assignment = await resolveAssignment(context.user.id)

  if (!assignment.schoolId) {
    forbidden('No active school assignment found')
  }

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, assignment.schoolId),
    with: { units: true },
  })

  if (!school) {
    notFound('School')
  }

  return school
})

export const updateSchool = authOnly
  .input(updateSchoolSchema)
  .handler(async ({ input, context }) => {
    const assignment = await resolveAssignment(context.user.id)

    if (!assignment.schoolId) {
      forbidden('No active school assignment found')
    }

    const [updated] = await db
      .update(schools)
      .set(input)
      .where(eq(schools.id, assignment.schoolId))
      .returning()

    if (!updated) {
      notFound('School')
    }

    return updated
  })

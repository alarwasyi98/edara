import { eq, and } from 'drizzle-orm'
import { authorized } from '../authorized'
import { requireRole } from '../middlewares'
import { schoolUnits } from '@/server/db/schema/schools'
import { notFound, idParam } from '@/server/shared'
import { createUnitSchema, updateUnitSchema } from '@/lib/validators/tenant'

const tenantAdmin = authorized.use(
  requireRole(['super_admin', 'kepala_sekolah']),
)

export const listUnits = authorized.handler(async ({ context }) => {
  return await context.tx.query.schoolUnits.findMany({
    where: eq(schoolUnits.schoolId, context.schoolId),
    orderBy: (u, { asc }) => [asc(u.name)],
  })
})

export const getUnitById = authorized
  .input(idParam)
  .handler(async ({ input, context }) => {
    const unit = await context.tx.query.schoolUnits.findFirst({
      where: and(
        eq(schoolUnits.id, input.id),
        eq(schoolUnits.schoolId, context.schoolId),
      ),
    })

    if (!unit) {
      notFound('Unit')
    }

    return unit
  })

export const createUnit = tenantAdmin
  .input(createUnitSchema)
  .handler(async ({ input, context }) => {
    const [unit] = await context.tx
      .insert(schoolUnits)
      .values({
        ...input,
        schoolId: context.schoolId,
      })
      .returning()

    return unit
  })

export const updateUnit = tenantAdmin
  .input(idParam.merge(updateUnitSchema))
  .handler(async ({ input, context }) => {
    const { id, ...data } = input

    const [updated] = await context.tx
      .update(schoolUnits)
      .set(data)
      .where(
        and(
          eq(schoolUnits.id, id),
          eq(schoolUnits.schoolId, context.schoolId),
        ),
      )
      .returning()

    if (!updated) {
      notFound('Unit')
    }

    return updated
  })

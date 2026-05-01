import { eq, and, lte, gte, ne } from 'drizzle-orm'
import { authorized } from '../authorized'
import { requireRole } from '../middlewares'
import { academicYears } from '@/server/db/schema/academic-years'
import { notFound, badRequest, idParam } from '@/server/shared'
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
} from '@/lib/validators/academic-years'
import type { db } from '@/server/db'

const tenantAdmin = authorized.use(
  requireRole(['super_admin', 'kepala_sekolah']),
)

export const listAcademicYears = authorized.handler(
  async ({ context }) => {
    return await context.tx.query.academicYears.findMany({
      where: eq(academicYears.unitId, context.unitId!),
      orderBy: (ay, { desc }) => [desc(ay.startDate)],
    })
  },
)

export const getActiveAcademicYear = authorized.handler(
  async ({ context }) => {
    const active = await context.tx.query.academicYears.findFirst({
      where: and(
        eq(academicYears.unitId, context.unitId!),
        eq(academicYears.isActive, true),
      ),
    })

    return active ?? null
  },
)

async function checkDateOverlap(
  tx: typeof db,
  unitId: string,
  startDate: string,
  endDate: string,
  excludeId?: string,
): Promise<void> {
  const overlapConditions = and(
    eq(academicYears.unitId, unitId),
    lte(academicYears.startDate, endDate),
    gte(academicYears.endDate, startDate),
    ...(excludeId ? [ne(academicYears.id, excludeId)] : []),
  )

  const overlapping = await tx.query.academicYears.findFirst({
    where: overlapConditions,
  })

  if (overlapping) {
    badRequest(
      `Tanggal bertumpang tindih dengan tahun ajaran "${overlapping.name}"`,
    )
  }
}

export const createAcademicYear = tenantAdmin
  .input(createAcademicYearSchema)
  .handler(async ({ input, context }) => {
    await checkDateOverlap(
      context.tx,
      context.unitId!,
      input.startDate,
      input.endDate,
    )

    const [created] = await context.tx
      .insert(academicYears)
      .values({
        ...input,
        schoolId: context.schoolId,
        unitId: context.unitId!,
      })
      .returning()

    return created
  })

export const updateAcademicYear = tenantAdmin
  .input(idParam.merge(updateAcademicYearSchema))
  .handler(async ({ input, context }) => {
    const { id, ...data } = input

    const existing = await context.tx.query.academicYears.findFirst({
      where: and(
        eq(academicYears.id, id),
        eq(academicYears.unitId, context.unitId!),
      ),
    })

    if (!existing) {
      notFound('Tahun Ajaran')
    }

    const startDate = data.startDate ?? existing.startDate
    const endDate = data.endDate ?? existing.endDate

    if (new Date(startDate) >= new Date(endDate)) {
      badRequest('Tanggal mulai harus sebelum tanggal selesai')
    }

    await checkDateOverlap(
      context.tx,
      context.unitId!,
      startDate,
      endDate,
      id,
    )

    const [updated] = await context.tx
      .update(academicYears)
      .set(data)
      .where(
        and(
          eq(academicYears.id, id),
          eq(academicYears.unitId, context.unitId!),
        ),
      )
      .returning()

    if (!updated) {
      notFound('Tahun Ajaran')
    }

    return updated
  })

export const activateAcademicYear = tenantAdmin
  .input(idParam)
  .handler(async ({ input, context }) => {
    const target = await context.tx.query.academicYears.findFirst({
      where: and(
        eq(academicYears.id, input.id),
        eq(academicYears.unitId, context.unitId!),
      ),
    })

    if (!target) {
      notFound('Tahun Ajaran')
    }

    if (target.isActive) {
      return target
    }

    // B2: deactivate current active → activate target (within RLS tx)
    await context.tx
      .update(academicYears)
      .set({ isActive: false })
      .where(
        and(
          eq(academicYears.unitId, context.unitId!),
          eq(academicYears.isActive, true),
        ),
      )

    const [activated] = await context.tx
      .update(academicYears)
      .set({ isActive: true })
      .where(eq(academicYears.id, input.id))
      .returning()

    return activated
  })

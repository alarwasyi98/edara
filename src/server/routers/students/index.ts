import { and, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { authorized } from '../authorized'
import { requireRole, withActivityLog } from '../middlewares'
import {
  students,
  enrollments,
  enrollmentStatusHistory,
  classes,
  academicYears,
} from '@/server/db/schema'
import {
  listStudentsSchema,
  createStudentSchema,
  updateStudentSchema,
  changeStatusSchema,
  getStatusHistorySchema,
} from '@/lib/validators/students'
import { badRequest, conflict, forbidden, idParam, notFound, paginationToOffset } from '@/server/shared'

const tenantAdmin = authorized.use(
  requireRole(['super_admin', 'kepala_sekolah', 'admin_tu']),
)

type ScopedContext = {
  schoolId: string
  unitId: string
}

type AcademicYearRecord = typeof academicYears.$inferSelect
type ClassRecord = typeof classes.$inferSelect
type EnrollmentRecord = Pick<
  typeof enrollments.$inferSelect,
  'id' | 'schoolId' | 'unitId' | 'studentId' | 'status'
>

async function getAcademicYearOrThrow(
  tx: typeof authorized['~orpc']['context']['tx'],
  scope: ScopedContext,
  academicYearId: string,
): Promise<AcademicYearRecord> {
  const academicYear = await tx.query.academicYears.findFirst({
    where: and(
      eq(academicYears.id, academicYearId),
      eq(academicYears.schoolId, scope.schoolId),
      eq(academicYears.unitId, scope.unitId),
    ),
  })

  if (!academicYear) {
    notFound('Tahun ajaran')
  }

  return academicYear
}

async function getClassOrThrow(
  tx: typeof authorized['~orpc']['context']['tx'],
  scope: ScopedContext,
  classId: string,
): Promise<ClassRecord> {
  const classRecord = await tx.query.classes.findFirst({
    where: and(
      eq(classes.id, classId),
      eq(classes.schoolId, scope.schoolId),
      eq(classes.unitId, scope.unitId),
    ),
  })

  if (!classRecord) {
    notFound('Kelas')
  }

  return classRecord
}

async function validateEnrollmentScopeOrThrow(
  tx: typeof authorized['~orpc']['context']['tx'],
  scope: ScopedContext,
  enrollmentId: string,
): Promise<EnrollmentRecord> {
  const enrollment = await tx.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
  })

  if (!enrollment) {
    notFound('Pendaftaran')
  }

  if (
    enrollment.schoolId !== scope.schoolId ||
    enrollment.unitId !== scope.unitId
  ) {
    forbidden()
  }

  return enrollment
}

async function validateEnrollmentReferences(
  tx: typeof authorized['~orpc']['context']['tx'],
  scope: ScopedContext,
  classId: string,
  academicYearId: string,
): Promise<void> {
  const [classRecord, academicYear] = await Promise.all([
    getClassOrThrow(tx, scope, classId),
    getAcademicYearOrThrow(tx, scope, academicYearId),
  ])

  if (classRecord.academicYearId !== academicYear.id) {
    badRequest('Kelas harus berada pada tahun ajaran yang dipilih')
  }
}

// Select shape for student list matching students table schema exactly
const studentListSelect = {
  id: students.id,
  schoolId: students.schoolId,
  unitId: students.unitId,
  nis: students.nis,
  nisn: students.nisn,
  namaLengkap: students.namaLengkap,
  nik: students.nik,
  tempatLahir: students.tempatLahir,
  tanggalLahir: students.tanggalLahir,
  jenisKelamin: students.jenisKelamin,
  namaWali: students.namaWali,
  nomorHpWali: students.nomorHpWali,
  namaAyah: students.namaAyah,
  namaIbu: students.namaIbu,
  alamat: students.alamat,
  photoUrl: students.photoUrl,
  createdAt: students.createdAt,
  updatedAt: students.updatedAt,
} as const

// List students with pagination and filters
export const list = authorized
  .input(listStudentsSchema)
  .handler(async ({ input, context }) => {
    const { limit, offset } = paginationToOffset(input)
    const {
      page = 1,
      pageSize = 20,
      search,
      classId,
      academicYearId,
      status,
      jenisKelamin,
    } = input

    const conditions = [
      eq(students.schoolId, context.schoolId),
      eq(students.unitId, context.unitId!),
    ]

    if (search) {
      conditions.push(
        or(
          ilike(students.namaLengkap, `%${search}%`),
          ilike(students.nisn, `%${search}%`),
          ilike(students.nis, `%${search}%`)
        )!
      )
    }

    if (jenisKelamin && jenisKelamin.length > 0) {
      conditions.push(inArray(students.jenisKelamin, jenisKelamin))
    }

    const enrollmentConditions = []
    if (classId) {
      enrollmentConditions.push(eq(enrollments.classId, classId))
    }
    if (academicYearId) {
      enrollmentConditions.push(eq(enrollments.academicYearId, academicYearId))
    }
    if (status && status.length > 0) {
      enrollmentConditions.push(inArray(enrollments.status, status))
    }

    const whereClause = and(
      ...conditions,
      enrollmentConditions.length > 0 ? and(...enrollmentConditions) : undefined,
    )

    const [pagedStudentIds, totalResult] = await Promise.all([
      context.tx
        .select({
          id: students.id,
          createdAt: students.createdAt,
        })
        .from(students)
        .leftJoin(enrollments, eq(students.id, enrollments.studentId))
        .where(whereClause)
        .groupBy(students.id, students.createdAt)
        .orderBy(desc(students.createdAt))
        .limit(limit)
        .offset(offset),
      context.tx
        .select({
          count: sql<number>`count(distinct ${students.id})`,
        })
        .from(students)
        .leftJoin(enrollments, eq(students.id, enrollments.studentId))
        .where(whereClause),
    ])

    const studentIds = pagedStudentIds.map((row) => row.id)
    const total = Number(totalResult[0]?.count ?? 0)

    if (studentIds.length === 0) {
      return {
        items: [],
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      }
    }

    const rows = await context.tx
      .select({
        ...studentListSelect,
        enrollment: {
          id: enrollments.id,
          status: enrollments.status,
          class: {
            id: classes.id,
            name: classes.name,
            grade: classes.grade,
          },
          academicYear: {
            id: academicYears.id,
            name: academicYears.name,
            isActive: academicYears.isActive,
          },
        },
      })
      .from(students)
      .leftJoin(enrollments, eq(students.id, enrollments.studentId))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(academicYears, eq(enrollments.academicYearId, academicYears.id))
      .where(and(whereClause, inArray(students.id, studentIds)))
      .orderBy(desc(students.createdAt), desc(enrollments.enrolledAt))

    const itemMap = new Map<string, (typeof rows)[number]>()
    for (const row of rows) {
      if (!itemMap.has(row.id)) {
        itemMap.set(row.id, row)
      }
    }

    const studentOrder = new Map(studentIds.map((id, index) => [id, index]))
    const data = Array.from(itemMap.values()).sort(
      (left, right) =>
        (studentOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (studentOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    )

    return {
      items: data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  })

// Get student by ID with enrollment details
export const getById = authorized
  .input(idParam)
  .handler(async ({ input, context }) => {
    const result = await context.tx
      .select({
        ...studentListSelect,
        enrollment: {
          id: enrollments.id,
          status: enrollments.status,
          class: {
            id: classes.id,
            name: classes.name,
            grade: classes.grade,
          },
          academicYear: {
            id: academicYears.id,
            name: academicYears.name,
            isActive: academicYears.isActive,
          },
        },
      })
      .from(students)
      .leftJoin(enrollments, eq(students.id, enrollments.studentId))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(academicYears, eq(enrollments.academicYearId, academicYears.id))
      .where(
        and(
          eq(students.id, input.id),
          eq(students.schoolId, context.schoolId),
          eq(students.unitId, context.unitId!)
        )
      )

    if (result.length === 0) {
      notFound('Siswa')
    }

    // Group enrollments
    const student = result[0]
    const enrollmentsList = result
      .filter((r) => r.enrollment && r.enrollment.id)
      .map((r) => r.enrollment)

    return {
      ...student,
      enrollments: enrollmentsList,
    }
  })

// Create student with initial enrollment
export const create = tenantAdmin
  .use(
    withActivityLog({
      action: 'student.created',
      entityType: 'student',
      description: 'Menambahkan data siswa',
    }),
  )
  .input(createStudentSchema)
  .handler(async ({ input, context }) => {
    const { classId, academicYearId, ...studentData } = input
    const scope = {
      schoolId: context.schoolId,
      unitId: context.unitId!,
    }

    return await context.tx.transaction(async (tx) => {
      await validateEnrollmentReferences(tx, scope, classId, academicYearId)

      const existing = await tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.nisn, studentData.nisn),
            eq(students.schoolId, context.schoolId)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        conflict('NISN sudah terdaftar di sekolah ini')
      }

      const [newStudent] = await tx
        .insert(students)
        .values({
          ...studentData,
          schoolId: scope.schoolId,
          unitId: scope.unitId,
        })
        .returning()

      await tx.insert(enrollments).values({
        schoolId: scope.schoolId,
        unitId: scope.unitId,
        studentId: newStudent.id,
        classId,
        academicYearId,
        status: 'active',
        enrolledAt: new Date(),
      })

      return newStudent
    })
  })

// Update student
export const update = tenantAdmin
  .use(
    withActivityLog({
      action: 'student.updated',
      entityType: 'student',
      description: 'Memperbarui data siswa',
    }),
  )
  .input(updateStudentSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { id, ...updateData } = input

    if (updateData.nisn) {
      const existing = await context.tx
        .select({ id: students.id })
        .from(students)
        .where(
          and(
            eq(students.nisn, updateData.nisn),
            eq(students.schoolId, context.schoolId),
            ne(students.id, id)
          )
        )
        .limit(1)

      if (existing.length > 0) {
        conflict('NISN sudah terdaftar di sekolah ini')
      }
    }

    const [updated] = await context.tx
      .update(students)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(students.id, id),
          eq(students.schoolId, context.schoolId),
          eq(students.unitId, context.unitId!)
        )
      )
      .returning()

    if (!updated) {
      notFound('Siswa')
    }

    return updated
  })

// Change enrollment status with audit trail
export const changeStatus = tenantAdmin
  .use(
    withActivityLog({
      action: 'student.status_changed',
      entityType: 'student',
      description: 'Mengubah status pendaftaran siswa',
    }),
  )
  .input(changeStatusSchema)
  .handler(async ({ input, context }) => {
    const { enrollmentId, newStatus, reason, metadata } = input
    const scope = {
      schoolId: context.schoolId,
      unitId: context.unitId!,
    }

    return await context.tx.transaction(async (tx) => {
      const currentEnrollment = await validateEnrollmentScopeOrThrow(
        tx,
        scope,
        enrollmentId,
      )

      const oldStatus = currentEnrollment.status

      await tx
        .update(enrollments)
        .set({
          status: newStatus,
          graduationDate:
            newStatus === 'graduated'
              ? new Date().toISOString().split('T')[0]
              : null,
        })
        .where(eq(enrollments.id, enrollmentId))

      await tx.insert(enrollmentStatusHistory).values({
        enrollmentId,
        oldStatus,
        newStatus,
        changedBy: context.user.id,
        reason,
        metadata,
        changedAt: new Date(),
      })

      return { success: true }
    })
  })

// Get status history for an enrollment
export const getStatusHistory = tenantAdmin
  .input(getStatusHistorySchema)
  .handler(async ({ input, context }) => {
    const { enrollmentId } = input
    const scope = {
      schoolId: context.schoolId,
      unitId: context.unitId!,
    }

    await validateEnrollmentScopeOrThrow(context.tx, scope, enrollmentId)

    return await context.tx
      .select({
        id: enrollmentStatusHistory.id,
        oldStatus: enrollmentStatusHistory.oldStatus,
        newStatus: enrollmentStatusHistory.newStatus,
        changedBy: enrollmentStatusHistory.changedBy,
        reason: enrollmentStatusHistory.reason,
        metadata: enrollmentStatusHistory.metadata,
        changedAt: enrollmentStatusHistory.changedAt,
      })
      .from(enrollmentStatusHistory)
      .where(eq(enrollmentStatusHistory.enrollmentId, enrollmentId))
      .orderBy(desc(enrollmentStatusHistory.changedAt))
  })

import { and, count, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { authorized } from '../authorized'
import { requireRole } from '../middlewares'
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
import { notFound, forbidden, idParam } from '@/server/shared'

const tenantAdmin = authorized.use(
  requireRole(['super_admin', 'kepala_sekolah', 'admin_tu']),
)

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
    const {
      page = 1,
      pageSize = 20,
      search,
      classId,
      academicYearId,
      status,
      jenisKelamin,
    } = input
    const offset = (page - 1) * pageSize

    // Build where conditions matching unit context
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

    // Join with enrollments for filtering
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

    // Query with enrollment join
    const baseQuery = context.tx
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
          ...conditions,
          enrollmentConditions.length > 0
            ? and(...enrollmentConditions)
            : undefined
        )
      )
      .orderBy(desc(students.createdAt))

    const [data, totalResult] = await Promise.all([
      baseQuery.limit(pageSize).offset(offset),
      context.tx
        .select({ count: count() })
        .from(students)
        .leftJoin(enrollments, eq(students.id, enrollments.studentId))
        .where(
          and(
            ...conditions,
            enrollmentConditions.length > 0
              ? and(...enrollmentConditions)
              : undefined
          )
        ),
    ])

    const total = totalResult[0]?.count ?? 0

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
  .input(createStudentSchema)
  .handler(async ({ input, context }) => {
    const { classId, academicYearId, ...studentData } = input

    return await context.tx.transaction(async (tx) => {
      // Check NISN uniqueness per school
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
        throw new Error('NISN sudah terdaftar di sekolah ini')
      }

      // Insert student
      const [newStudent] = await tx
        .insert(students)
        .values({
          ...studentData,
          schoolId: context.schoolId,
          unitId: context.unitId!,
        })
        .returning()

      // Insert enrollment
      await tx.insert(enrollments).values({
        schoolId: context.schoolId,
        unitId: context.unitId!,
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
  .input(updateStudentSchema.extend({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { id, ...updateData } = input

    // Check NISN uniqueness if changed
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
        throw new Error('NISN sudah terdaftar di sekolah ini')
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
  .input(changeStatusSchema)
  .handler(async ({ input, context }) => {
    const { enrollmentId, newStatus, reason, metadata } = input

    return await context.tx.transaction(async (tx) => {
      // Get current enrollment
      const [currentEnrollment] = await tx
        .select({
          id: enrollments.id,
          status: enrollments.status,
          studentId: enrollments.studentId,
          schoolId: enrollments.schoolId,
        })
        .from(enrollments)
        .where(eq(enrollments.id, enrollmentId))
        .limit(1)

      if (!currentEnrollment) {
        notFound('Pendaftaran')
      }

      if (currentEnrollment.schoolId !== context.schoolId) {
        forbidden()
      }

      const oldStatus = currentEnrollment.status

      // Update enrollment status
      await tx
        .update(enrollments)
        .set({
          status: newStatus,
          graduationDate: newStatus === 'graduated' ? new Date().toISOString().split('T')[0] : null,
        })
        .where(eq(enrollments.id, enrollmentId))

      // Record status change in history
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

    // Verify enrollment belongs to school
    const [enrollment] = await context.tx
      .select({ schoolId: enrollments.schoolId })
      .from(enrollments)
      .where(eq(enrollments.id, enrollmentId))
      .limit(1)

    if (!enrollment) {
      notFound('Pendaftaran')
    }

    if (enrollment.schoolId !== context.schoolId) {
      forbidden()
    }

    // Fetch history
    const history = await context.tx
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

    return history
  })

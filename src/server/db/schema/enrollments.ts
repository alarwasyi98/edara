/**
 * Enrollments Schema
 *
 * Academic status layer linking students to classes per academic year.
 *
 * Business Rules:
 * - B5/C6: One enrollment per (student, academic_year). Class transfer within
 *   a year = UPDATE class_id (not INSERT new), with history logged.
 * - B11: Students are never deleted — only enrollment status changes.
 *
 * @see technical-specification.md L877–931
 */

import { relations } from 'drizzle-orm'
import {
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'
import { students } from './students'
import { classes } from './classes'
import { academicYears } from './academic-years'

// ─── Enums ───────────────────────────────────────────────

export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'active',
  'promoted',
  'graduated',
  'transferred_out',
  'inactive',
])

// ─── Tables ──────────────────────────────────────────────

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id')
      .references(() => schoolUnits.id)
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id)
      .notNull(),
    classId: uuid('class_id')
      .references(() => classes.id)
      .notNull(),
    academicYearId: uuid('academic_year_id')
      .references(() => academicYears.id)
      .notNull(),
    status: enrollmentStatusEnum('status').default('active').notNull(),
    transferDestination: varchar('transfer_destination', { length: 255 }),
    graduationDate: date('graduation_date'),
    enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolUnitIdx: index('enrollments_school_unit_idx').on(t.schoolId, t.unitId),
    // C6: One enrollment per student per academic year
    studentYearUnique: uniqueIndex('enrollments_student_year_unique').on(
      t.studentId,
      t.academicYearId,
    ),
    classIdx: index('enrollments_class_idx').on(t.classId),
    statusIdx: index('enrollments_status_idx').on(t.status),
  }),
)

export const enrollmentStatusHistory = pgTable('enrollment_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id')
    .references(() => enrollments.id)
    .notNull(),
  fromStatus: enrollmentStatusEnum('from_status').notNull(),
  toStatus: enrollmentStatusEnum('to_status').notNull(),
  changedBy: varchar('changed_by', { length: 255 }).notNull(), // clerkUserId
  reason: text('reason'),
  metadata: jsonb('metadata'), // { fromClassId, toClassId, destinationSchool, etc. }
  changedAt: timestamp('changed_at').defaultNow().notNull(),
})

// ─── Relations ───────────────────────────────────────────

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  school: one(schools, {
    fields: [enrollments.schoolId],
    references: [schools.id],
  }),
  unit: one(schoolUnits, {
    fields: [enrollments.unitId],
    references: [schoolUnits.id],
  }),
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
  academicYear: one(academicYears, {
    fields: [enrollments.academicYearId],
    references: [academicYears.id],
  }),
  statusHistory: many(enrollmentStatusHistory),
}))

export const enrollmentStatusHistoryRelations = relations(
  enrollmentStatusHistory,
  ({ one }) => ({
    enrollment: one(enrollments, {
      fields: [enrollmentStatusHistory.enrollmentId],
      references: [enrollments.id],
    }),
  }),
)

/**
 * Classes Schema
 *
 * Class definitions per academic year and unit.
 * Each class belongs to one academic year and optionally has a homeroom teacher.
 *
 * @see technical-specification.md L846–871
 */

import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'
import { academicYears } from './academic-years'
import { teachers } from './teachers'

// ─── Tables ──────────────────────────────────────────────

export const classes = pgTable(
  'classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id')
      .references(() => schoolUnits.id)
      .notNull(),
    academicYearId: uuid('academic_year_id')
      .references(() => academicYears.id)
      .notNull(),
    name: varchar('name', { length: 50 }).notNull(), // "7A", "X IPA 1"
    gradeLevel: integer('grade_level').notNull(), // 7, 8, 9, 10, 11, 12
    homeroomTeacherId: uuid('homeroom_teacher_id').references(
      () => teachers.id,
    ),
    capacity: integer('capacity').default(32).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    yearIdx: index('classes_year_idx').on(t.academicYearId),
    unitYearIdx: index('classes_unit_year_idx').on(
      t.unitId,
      t.academicYearId,
    ),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const classesRelations = relations(classes, ({ one }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  unit: one(schoolUnits, {
    fields: [classes.unitId],
    references: [schoolUnits.id],
  }),
  academicYear: one(academicYears, {
    fields: [classes.academicYearId],
    references: [academicYears.id],
  }),
  homeroomTeacher: one(teachers, {
    fields: [classes.homeroomTeacherId],
    references: [teachers.id],
  }),
}))

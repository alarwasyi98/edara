/**
 * Academic Years Schema
 *
 * Tracks academic year periods per unit.
 *
 * Business Rule B1: Only one active academic year per unit at a time.
 * This is enforced by a partial unique index:
 *   CREATE UNIQUE INDEX academic_years_one_active_per_unit
 *     ON academic_years (unit_id) WHERE is_active = TRUE;
 *
 * ⚠️ SQL ESCAPE HATCH: The partial unique index cannot be expressed
 * in Drizzle ORM's schema API. It is implemented in the custom
 * migration file (Step 7: drizzle-kit generate --custom).
 *
 * @see technical-specification.md L747–768
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'

// ─── Tables ──────────────────────────────────────────────

export const academicYears = pgTable(
  'academic_years',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id')
      .references(() => schoolUnits.id)
      .notNull(),
    name: varchar('name', { length: 20 }).notNull(), // "2024/2025"
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isActive: boolean('is_active').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    unitIdx: index('academic_years_unit_idx').on(t.unitId),
    // Partial unique index (B1) → implemented in Step 7 custom migration SQL
    // CREATE UNIQUE INDEX academic_years_one_active_per_unit
    //   ON academic_years (unit_id) WHERE is_active = TRUE;
  }),
)

// ─── Relations ───────────────────────────────────────────

export const academicYearsRelations = relations(
  academicYears,
  ({ one }) => ({
    school: one(schools, {
      fields: [academicYears.schoolId],
      references: [schools.id],
    }),
    unit: one(schoolUnits, {
      fields: [academicYears.unitId],
      references: [schoolUnits.id],
    }),
  }),
)

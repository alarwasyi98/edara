/**
 * School Events Schema
 *
 * Calendar event management per unit and academic year.
 *
 * Business Rule B13: Past events with "ongoing" status are NOT
 * auto-updated by the system. Admin must manually update to "completed".
 *
 * @see technical-specification.md L1136–1181
 */

import { relations } from 'drizzle-orm'
import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'
import { academicYears } from './academic-years'

// ─── Enums ───────────────────────────────────────────────

export const eventCategoryEnum = pgEnum('event_category', [
  'lomba',
  'kegiatan_rutin',
  'rapat',
  'libur',
  'lainnya',
])

export const eventStatusEnum = pgEnum('event_status', [
  'scheduled',
  'ongoing',
  'completed',
  'cancelled',
])

// ─── Tables ──────────────────────────────────────────────

export const schoolEvents = pgTable(
  'school_events',
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
    name: varchar('name', { length: 255 }).notNull(),
    category: eventCategoryEnum('category').notNull(),
    startDate: date('start_date'), // nullable = kegiatan tanpa tanggal
    endDate: date('end_date'),
    location: varchar('location', { length: 255 }),
    description: text('description'),
    status: eventStatusEnum('status').default('scheduled').notNull(),
    createdBy: varchar('created_by', { length: 255 }).notNull(), // clerkUserId
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolIdx: index('school_events_school_idx').on(t.schoolId),
    unitYearIdx: index('school_events_unit_year_idx').on(
      t.unitId,
      t.academicYearId,
    ),
    startDateIdx: index('school_events_start_date_idx').on(t.startDate),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const schoolEventsRelations = relations(schoolEvents, ({ one }) => ({
  school: one(schools, {
    fields: [schoolEvents.schoolId],
    references: [schools.id],
  }),
  unit: one(schoolUnits, {
    fields: [schoolEvents.unitId],
    references: [schoolUnits.id],
  }),
  academicYear: one(academicYears, {
    fields: [schoolEvents.academicYearId],
    references: [academicYears.id],
  }),
}))

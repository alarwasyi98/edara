/**
 * Schools & School Units Schema
 *
 * Root tenant tables for multi-tenancy (ADR-02).
 * `schools` = yayasan (foundation), `school_units` = unit pendidikan (MI/MTs/MA/etc).
 *
 * @see technical-specification.md L714–741
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ─── Tables ──────────────────────────────────────────────

export const schools = pgTable('schools', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  address: text('address'),
  legalNumber: varchar('legal_number', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const schoolUnits = pgTable(
  'school_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    level: varchar('level', { length: 50 }).notNull(), // MI, MTs, MA, SD, SMP, SMA, dll.
    npsn: varchar('npsn', { length: 20 }),
    address: text('address'),
    phone: varchar('phone', { length: 50 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolIdx: index('school_units_school_idx').on(t.schoolId),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const schoolsRelations = relations(schools, ({ many }) => ({
  units: many(schoolUnits),
}))

export const schoolUnitsRelations = relations(schoolUnits, ({ one }) => ({
  school: one(schools, {
    fields: [schoolUnits.schoolId],
    references: [schools.id],
  }),
}))

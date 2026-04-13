/**
 * Activity Logs Schema
 *
 * Centralized audit trail for all mutations (ADR-04/C1).
 *
 * - Written by `withActivityLog` middleware, NOT manually per procedure (C1).
 * - No auto-deletion for Phase 1 MVP (C8).
 * - Indexes on (unit_id) and (created_at) for query performance.
 *
 * @see technical-specification.md L1220–1244
 */

import { relations } from 'drizzle-orm'
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'

// ─── Tables ──────────────────────────────────────────────

/**
 * Activity Logs — centralized audit trail.
 *
 * Written automatically by `withActivityLog` middleware (C1).
 * Retention: kept indefinitely for Phase 1 (C8).
 */
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id').references(() => schoolUnits.id), // nullable for school-wide actions
    actorId: varchar('actor_id', { length: 255 }).notNull(), // clerkUserId
    actorName: varchar('actor_name', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(), // e.g. "student.created"
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    description: text('description').notNull(), // human-readable Bahasa Indonesia
    metadata: jsonb('metadata'), // additional context per action
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    unitIdx: index('activity_logs_unit_idx').on(t.unitId),
    createdAtIdx: index('activity_logs_created_at_idx').on(t.createdAt),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  school: one(schools, {
    fields: [activityLogs.schoolId],
    references: [schools.id],
  }),
  unit: one(schoolUnits, {
    fields: [activityLogs.unitId],
    references: [schoolUnits.id],
  }),
}))

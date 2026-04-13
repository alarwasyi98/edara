/**
 * Users & RBAC Schema
 *
 * Maps Clerk users to schools/units with role assignments.
 * Auth is managed by Clerk (C7); this table tracks organizational assignments.
 *
 * - `unit_id` nullable: super_admin operates at school-wide level (B10)
 * - Multiple assignments per user allowed for admin_tu/bendahara (B10)
 *
 * @see technical-specification.md L1186–1215
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'

// ─── Enums ───────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'kepala_sekolah',
  'admin_tu',
  'bendahara',
])

// ─── Tables ──────────────────────────────────────────────

export const userSchoolAssignments = pgTable(
  'user_school_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id').references(() => schoolUnits.id), // null = school-wide (super_admin)
    role: userRoleEnum('role').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolIdx: index('user_assignments_school_idx').on(t.schoolId),
    clerkUserIdx: index('user_assignments_clerk_idx').on(t.clerkUserId),
    uniqueAssignment: uniqueIndex('user_assignment_unique').on(
      t.clerkUserId,
      t.schoolId,
      t.unitId,
    ),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const userSchoolAssignmentsRelations = relations(
  userSchoolAssignments,
  ({ one }) => ({
    school: one(schools, {
      fields: [userSchoolAssignments.schoolId],
      references: [schools.id],
    }),
    unit: one(schoolUnits, {
      fields: [userSchoolAssignments.unitId],
      references: [schoolUnits.id],
    }),
  }),
)

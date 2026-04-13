/**
 * Cashflow Schema
 *
 * General income/expense tracking for the school.
 *
 * Business Rule B12: SPP payments auto-create a cashflow record with
 * `spp_payment_id` linked. Linked records cannot be edited/deleted
 * from the cashflow module.
 *
 * ADR-07: All monetary columns use numeric(15,2).
 *
 * @see technical-specification.md L1082–1130
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'
import { academicYears } from './academic-years'
import { paymentTransactions } from './spp'

// ─── Tables ──────────────────────────────────────────────

export const cashflowCategories = pgTable('cashflow_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .references(() => schools.id)
    .notNull(),
  unitId: uuid('unit_id')
    .references(() => schoolUnits.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 10 }).notNull(), // income, expense
  isActive: boolean('is_active').default(true).notNull(),
})

export const cashflowTransactions = pgTable(
  'cashflow_transactions',
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
    categoryId: uuid('category_id')
      .references(() => cashflowCategories.id)
      .notNull(),
    type: varchar('type', { length: 10 }).notNull(), // income, expense
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // ADR-07
    transactionDate: date('transaction_date').notNull(),
    description: text('description'),
    paymentMethod: varchar('payment_method', { length: 30 }),
    referenceNumber: varchar('reference_number', { length: 100 }),
    sppPaymentId: uuid('spp_payment_id').references(
      () => paymentTransactions.id,
    ), // B12: auto-link opsional
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(), // clerkUserId
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    unitYearIdx: index('cashflow_transactions_unit_year_idx').on(
      t.unitId,
      t.academicYearId,
    ),
    dateIdx: index('cashflow_transactions_date_idx').on(t.transactionDate),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const cashflowCategoriesRelations = relations(
  cashflowCategories,
  ({ one }) => ({
    school: one(schools, {
      fields: [cashflowCategories.schoolId],
      references: [schools.id],
    }),
    unit: one(schoolUnits, {
      fields: [cashflowCategories.unitId],
      references: [schoolUnits.id],
    }),
  }),
)

export const cashflowTransactionsRelations = relations(
  cashflowTransactions,
  ({ one }) => ({
    school: one(schools, {
      fields: [cashflowTransactions.schoolId],
      references: [schools.id],
    }),
    unit: one(schoolUnits, {
      fields: [cashflowTransactions.unitId],
      references: [schoolUnits.id],
    }),
    academicYear: one(academicYears, {
      fields: [cashflowTransactions.academicYearId],
      references: [academicYears.id],
    }),
    category: one(cashflowCategories, {
      fields: [cashflowTransactions.categoryId],
      references: [cashflowCategories.id],
    }),
    sppPayment: one(paymentTransactions, {
      fields: [cashflowTransactions.sppPaymentId],
      references: [paymentTransactions.id],
    }),
  }),
)

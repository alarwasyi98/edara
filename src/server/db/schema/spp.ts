/**
 * SPP (Sumbangan Pembinaan Pendidikan) Schema
 *
 * Financial tables for school fee management. This is the most critical schema file.
 *
 * Key ADRs enforced:
 * - ADR-03: Payment status is NEVER stored. Always computed via SQL aggregation.
 * - ADR-04: payment_transactions is APPEND-ONLY. No updated_at column.
 * - ADR-07: ALL monetary columns use numeric(15,2). No JavaScript Number.
 *
 * Key Business Rules:
 * - B2: discount_schemes.is_locked = true after academic year activation
 * - B3: No UPDATE/DELETE on payment_transactions at application level
 * - B6: Status (paid/partial/unpaid) computed from SUM(transactions.amount) vs net_amount
 * - B7: Overpayment recorded as separate transaction with type 'overpayment'
 * - B8: Bills with transactions cannot be cancelled — correction via reversal
 * - C4: Soft-cancel via status column ('active'/'cancelled')
 * - C5: billing_month as VARCHAR(7) "YYYY-MM" with CHECK constraint
 *
 * @see technical-specification.md L937–1076
 */

import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'
import { academicYears } from './academic-years'
import { students } from './students'
import { classes } from './classes'
import { enrollments } from './enrollments'

// ─── Enums ───────────────────────────────────────────────

export const paymentBillStatusEnum = pgEnum('payment_bill_status', [
  'active',
  'cancelled',
])

export const transactionTypeEnum = pgEnum('transaction_type', [
  'payment',
  'reversal',
  'adjustment',
  'overpayment',
])

// ─── Tables ──────────────────────────────────────────────

export const paymentCategories = pgTable('payment_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .references(() => schools.id)
    .notNull(),
  unitId: uuid('unit_id')
    .references(() => schoolUnits.id)
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  period: varchar('period', { length: 20 }).notNull(), // monthly, annual, one_time
  defaultAmount: numeric('default_amount', { precision: 15, scale: 2 }), // ADR-07
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  schoolUnitIdx: index('payment_categories_school_unit_idx').on(t.schoolId, t.unitId),
}))

export const classPaymentRates = pgTable(
  'class_payment_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    classId: uuid('class_id')
      .references(() => classes.id)
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => paymentCategories.id)
      .notNull(),
    academicYearId: uuid('academic_year_id')
      .references(() => academicYears.id)
      .notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // ADR-07
  },
  (t) => ({
    schoolIdx: index('class_payment_rates_school_idx').on(t.schoolId),
    classRateUnique: uniqueIndex('class_payment_rates_unique').on(
      t.classId,
      t.categoryId,
      t.academicYearId,
    ),
  }),
)

export const discountSchemes = pgTable('discount_schemes', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id')
    .references(() => schools.id)
    .notNull(),
  studentId: uuid('student_id')
    .references(() => students.id)
    .notNull(),
  categoryId: uuid('category_id').references(() => paymentCategories.id), // null = semua kategori
  academicYearId: uuid('academic_year_id')
    .references(() => academicYears.id)
    .notNull(),
  discountType: varchar('discount_type', { length: 10 }).notNull(), // percent, fixed
  discountValue: numeric('discount_value', {
    precision: 10,
    scale: 2,
  }).notNull(), // ADR-07
  reason: varchar('reason', { length: 255 }),
  isLocked: boolean('is_locked').default(false).notNull(), // B2: true setelah tahun ajaran aktif
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  schoolIdx: index('discount_schemes_school_idx').on(t.schoolId),
}))

/**
 * Payment Bills — the core billing record.
 *
 * CRITICAL: `status` here is ONLY for cancellation ('active'/'cancelled').
 * Payment status (paid/partial/unpaid) is NEVER stored here (ADR-03).
 * Always compute via: SUM(payment_transactions.amount) vs net_amount
 */
export const paymentBills = pgTable(
  'payment_bills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    enrollmentId: uuid('enrollment_id')
      .references(() => enrollments.id)
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => paymentCategories.id)
      .notNull(),
    billingMonth: varchar('billing_month', { length: 7 }).notNull(), // C5: "YYYY-MM"
    baseAmount: numeric('base_amount', { precision: 15, scale: 2 }).notNull(), // ADR-07
    discountAmount: numeric('discount_amount', { precision: 15, scale: 2 })
      .default('0')
      .notNull(), // ADR-07
    netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(), // ADR-07
    status: paymentBillStatusEnum('status').default('active').notNull(), // C4: soft-cancel only
  },
  (t) => ({
    schoolIdx: index('payment_bills_school_idx').on(t.schoolId),
    billUnique: uniqueIndex('payment_bills_unique').on(
      t.enrollmentId,
      t.categoryId,
      t.billingMonth,
    ),
    enrollmentIdx: index('payment_bills_enrollment_idx').on(t.enrollmentId),
    billingMonthCheck: check(
      'billing_month_check',
      sql`${t.billingMonth} ~ '^\\d{4}-(0[1-9]|1[0-2])$'`,
    ),
  }),
)

/**
 * Payment Transactions — APPEND-ONLY (ADR-04).
 *
 * - No `updated_at` column.
 * - Corrections via reversal records only (B3).
 * - Self-referencing FK `reversed_by_id` for reversal chain.
 * - All amounts use numeric(15,2) (ADR-07).
 */
export const paymentTransactions = pgTable(
  'payment_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    billId: uuid('bill_id')
      .references(() => paymentBills.id)
      .notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(), // ADR-07
    transactionType: transactionTypeEnum('transaction_type').notNull(),
    paymentDate: date('payment_date').notNull(),
    paymentMethod: varchar('payment_method', { length: 30 }), // cash, transfer, qris
    notes: text('notes'),
    reversedById: uuid('reversed_by_id').references(
      (): AnyPgColumn => paymentTransactions.id,
    ), // self-referencing FK for reversal chain
    recordedBy: varchar('recorded_by', { length: 255 }).notNull(), // clerkUserId
    createdAt: timestamp('created_at').defaultNow().notNull(),
    // CATATAN: Tidak ada updated_at — tabel ini append-only (ADR-04)
  },
  (t) => ({
    schoolDateIdx: index('payment_transactions_school_date_idx').on(t.schoolId, t.paymentDate), // Fast analytics aggregation
    billIdx: index('payment_transactions_bill_idx').on(t.billId),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const paymentCategoriesRelations = relations(
  paymentCategories,
  ({ one }) => ({
    school: one(schools, {
      fields: [paymentCategories.schoolId],
      references: [schools.id],
    }),
    unit: one(schoolUnits, {
      fields: [paymentCategories.unitId],
      references: [schoolUnits.id],
    }),
  }),
)

export const classPaymentRatesRelations = relations(
  classPaymentRates,
  ({ one }) => ({
    school: one(schools, {
      fields: [classPaymentRates.schoolId],
      references: [schools.id],
    }),
    class: one(classes, {
      fields: [classPaymentRates.classId],
      references: [classes.id],
    }),
    category: one(paymentCategories, {
      fields: [classPaymentRates.categoryId],
      references: [paymentCategories.id],
    }),
    academicYear: one(academicYears, {
      fields: [classPaymentRates.academicYearId],
      references: [academicYears.id],
    }),
  }),
)

export const discountSchemesRelations = relations(
  discountSchemes,
  ({ one }) => ({
    school: one(schools, {
      fields: [discountSchemes.schoolId],
      references: [schools.id],
    }),
    student: one(students, {
      fields: [discountSchemes.studentId],
      references: [students.id],
    }),
    category: one(paymentCategories, {
      fields: [discountSchemes.categoryId],
      references: [paymentCategories.id],
    }),
    academicYear: one(academicYears, {
      fields: [discountSchemes.academicYearId],
      references: [academicYears.id],
    }),
  }),
)

export const paymentBillsRelations = relations(
  paymentBills,
  ({ one, many }) => ({
    school: one(schools, {
      fields: [paymentBills.schoolId],
      references: [schools.id],
    }),
    enrollment: one(enrollments, {
      fields: [paymentBills.enrollmentId],
      references: [enrollments.id],
    }),
    category: one(paymentCategories, {
      fields: [paymentBills.categoryId],
      references: [paymentCategories.id],
    }),
    transactions: many(paymentTransactions),
  }),
)

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    school: one(schools, {
      fields: [paymentTransactions.schoolId],
      references: [schools.id],
    }),
    bill: one(paymentBills, {
      fields: [paymentTransactions.billId],
      references: [paymentBills.id],
    }),
    reversedBy: one(paymentTransactions, {
      fields: [paymentTransactions.reversedById],
      references: [paymentTransactions.id],
    }),
  }),
)

/**
 * Students Schema
 *
 * Identity layer — permanent records that are NEVER deleted (Business Rule B11).
 * Status changes happen via enrollment status, not student deletion.
 *
 * Business Rule B4: NISN is unique per school, not globally.
 * Implemented via composite unique index (nisn, school_id).
 *
 * @see technical-specification.md L810–840
 */

import { relations } from 'drizzle-orm'
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { schools, schoolUnits } from './schools'

// ─── Tables ──────────────────────────────────────────────

export const students = pgTable(
  'students',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id')
      .references(() => schoolUnits.id)
      .notNull(),
    nis: varchar('nis', { length: 20 }),
    nisn: varchar('nisn', { length: 10 }).notNull(),
    namaLengkap: varchar('nama_lengkap', { length: 255 }).notNull(),
    nik: varchar('nik', { length: 16 }),
    tempatLahir: varchar('tempat_lahir', { length: 100 }),
    tanggalLahir: date('tanggal_lahir'),
    jenisKelamin: varchar('jenis_kelamin', { length: 1 }).notNull(), // "L" atau "P"
    namaWali: varchar('nama_wali', { length: 255 }),
    nomorHpWali: varchar('nomor_hp_wali', { length: 20 }),
    namaAyah: varchar('nama_ayah', { length: 255 }),
    namaIbu: varchar('nama_ibu', { length: 255 }),
    alamat: text('alamat'),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolUnitIdx: index('students_school_unit_idx').on(t.schoolId, t.unitId),
    nisnIdx: uniqueIndex('students_nisn_school_unique').on(
      t.nisn,
      t.schoolId,
    ), // B4: unique per school
  }),
)

// ─── Relations ───────────────────────────────────────────

export const studentsRelations = relations(students, ({ one }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  unit: one(schoolUnits, {
    fields: [students.unitId],
    references: [schoolUnits.id],
  }),
}))

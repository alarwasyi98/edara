/**
 * Teachers Schema
 *
 * Personnel management with soft-delete pattern (Business Rule B11).
 *
 * ADR-06: `mata_pelajaran` is stored as a JSON array string (e.g. '["Matematika","IPA"]'),
 * NOT a junction table. This is sufficient for Phase 1 filter/display needs.
 *
 * @see technical-specification.md L774–804
 */

import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
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

export const teachers = pgTable(
  'teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .references(() => schools.id)
      .notNull(),
    unitId: uuid('unit_id')
      .references(() => schoolUnits.id)
      .notNull(),
    nip: varchar('nip', { length: 50 }),
    nik: varchar('nik', { length: 16 }).notNull(),
    namaLengkap: varchar('nama_lengkap', { length: 255 }).notNull(),
    tempatLahir: varchar('tempat_lahir', { length: 100 }),
    tanggalLahir: date('tanggal_lahir'),
    jenisKelamin: varchar('jenis_kelamin', { length: 1 }).notNull(), // "L" atau "P"
    nomorHp: varchar('nomor_hp', { length: 20 }),
    alamat: text('alamat'),
    statusKepegawaian: varchar('status_kepegawaian', { length: 20 }).notNull(), // tetap, honorer, gtt
    mataPelajaran: jsonb('mata_pelajaran').$type<string[]>(), // ADR-06: JSON array
    tanggalBergabung: date('tanggal_bergabung'),
    photoUrl: text('photo_url'),
    isActive: boolean('is_active').default(true).notNull(), // B11: soft-delete
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    schoolUnitIdx: index('teachers_school_unit_idx').on(t.schoolId, t.unitId),
    nikIdx: index('teachers_nik_idx').on(t.nik),
  }),
)

// ─── Relations ───────────────────────────────────────────

export const teachersRelations = relations(teachers, ({ one }) => ({
  school: one(schools, {
    fields: [teachers.schoolId],
    references: [schools.id],
  }),
  unit: one(schoolUnits, {
    fields: [teachers.unitId],
    references: [schoolUnits.id],
  }),
}))

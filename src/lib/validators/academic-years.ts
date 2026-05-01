/**
 * Academic Year Validators
 *
 * Zod schemas for academic year CRUD operations.
 * Name format: "2024/2025" (academic year period).
 * Dates must not overlap with existing academic years for the same unit.
 */

import * as z from 'zod'

// ── Academic Year Name ───────────────────────────────────────

const academicYearNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama tahun ajaran wajib diisi')
  .max(20, 'Nama tahun ajaran maksimal 20 karakter')
  .regex(
    /^\d{4}\/\d{4}$/,
    'Format nama harus YYYY/YYYY (contoh: 2024/2025)',
  )

// ── Create ───────────────────────────────────────────────────

export const createAcademicYearSchema = z
  .object({
    name: academicYearNameSchema,
    startDate: z.string().date('Tanggal mulai tidak valid'),
    endDate: z.string().date('Tanggal selesai tidak valid'),
  })
  .refine(
    (data) => new Date(data.startDate) < new Date(data.endDate),
    {
      message: 'Tanggal mulai harus sebelum tanggal selesai',
      path: ['startDate'],
    },
  )

// ── Update ───────────────────────────────────────────────────

export const updateAcademicYearSchema = z.object({
  name: academicYearNameSchema.optional(),
  startDate: z.string().date('Tanggal mulai tidak valid').optional(),
  endDate: z.string().date('Tanggal selesai tidak valid').optional(),
})

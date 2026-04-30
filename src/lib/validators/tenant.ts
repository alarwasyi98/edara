/**
 * Tenant Validators
 *
 * Zod schemas for school (yayasan) and school-unit CRUD operations.
 * NPSN = Nomor Pokok Sekolah Nasional — always 8 digits.
 */

import * as z from 'zod'

// ── NPSN ─────────────────────────────────────────────────────

export const npsnSchema = z
  .string()
  .regex(/^\d{8}$/, 'NPSN harus 8 digit angka')

// ── School (Yayasan) ─────────────────────────────────────────

export const updateSchoolSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(255),
  logoUrl: z.string().url('URL logo tidak valid').nullish(),
  address: z.string().trim().max(1000).nullish(),
  legalNumber: z.string().trim().max(100).nullish(),
})

// ── School Unit ──────────────────────────────────────────────

export const createUnitSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit wajib diisi').max(255),
  level: z.string().trim().min(1, 'Jenjang wajib diisi').max(50),
  npsn: npsnSchema.nullish(),
  address: z.string().trim().max(1000).nullish(),
  phone: z.string().trim().max(50).nullish(),
})

export const updateUnitSchema = z.object({
  name: z.string().trim().min(1, 'Nama unit wajib diisi').max(255).optional(),
  level: z.string().trim().min(1, 'Jenjang wajib diisi').max(50).optional(),
  npsn: npsnSchema.nullish(),
  address: z.string().trim().max(1000).nullish(),
  phone: z.string().trim().max(50).nullish(),
  isActive: z.boolean().optional(),
})

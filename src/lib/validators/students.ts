import * as z from 'zod'

export const studentGenderSchema = z.enum(['L', 'P'])

export const enrollmentStatusSchema = z.enum([
  'active',
  'promoted',
  'graduated',
  'transferred_out',
  'inactive',
])

const optionalTrimmedString = (max: number) =>
  z.string().trim().max(max).nullish()

export const listStudentsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  classId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  status: z.array(enrollmentStatusSchema).default([]),
  jenisKelamin: z.array(studentGenderSchema).default([]),
})

export const createStudentSchema = z.object({
  // Student identity fields
  nis: optionalTrimmedString(20),
  nisn: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'NISN harus 10 digit angka'),
  namaLengkap: z
    .string()
    .trim()
    .min(1, 'Nama lengkap wajib diisi')
    .max(255, 'Nama lengkap maksimal 255 karakter'),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, 'NIK harus 16 digit angka')
    .nullish(),
  tempatLahir: optionalTrimmedString(100),
  tanggalLahir: z.string().date('Tanggal lahir tidak valid').nullish(),
  jenisKelamin: studentGenderSchema,
  namaWali: optionalTrimmedString(255),
  nomorHpWali: optionalTrimmedString(20),
  namaAyah: optionalTrimmedString(255),
  namaIbu: optionalTrimmedString(255),
  alamat: z.string().trim().max(1000).nullish(),
  photoUrl: z.string().trim().url('URL foto tidak valid').nullish(),
  // Enrollment fields (for dual insert)
  classId: z.string().uuid('Class ID tidak valid'),
  academicYearId: z.string().uuid('Academic Year ID tidak valid'),
})

export const updateStudentSchema = z
  .object({
    nis: optionalTrimmedString(20),
    nisn: z
      .string()
      .trim()
      .regex(/^\d{10}$/, 'NISN harus 10 digit angka')
      .optional(),
    namaLengkap: z
      .string()
      .trim()
      .min(1, 'Nama lengkap wajib diisi')
      .max(255, 'Nama lengkap maksimal 255 karakter')
      .optional(),
    nik: z
      .string()
      .trim()
      .regex(/^\d{16}$/, 'NIK harus 16 digit angka')
      .nullish(),
    tempatLahir: optionalTrimmedString(100),
    tanggalLahir: z.string().date('Tanggal lahir tidak valid').nullish(),
    jenisKelamin: studentGenderSchema.optional(),
    namaWali: optionalTrimmedString(255),
    nomorHpWali: optionalTrimmedString(20),
    namaAyah: optionalTrimmedString(255),
    namaIbu: optionalTrimmedString(255),
    alamat: z.string().trim().max(1000).nullish(),
    photoUrl: z.string().trim().url('URL foto tidak valid').nullish(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diubah',
  })

export const changeStatusSchema = z.object({
  enrollmentId: z.string().uuid('Enrollment ID tidak valid'),
  newStatus: enrollmentStatusSchema,
  reason: z.string().trim().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const getStatusHistorySchema = z.object({
  enrollmentId: z.string().uuid('Enrollment ID tidak valid'),
})

export type StudentListInput = z.infer<typeof listStudentsSchema>
export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>
export type GetStatusHistoryInput = z.infer<typeof getStatusHistorySchema>


import { z } from 'zod'

const teacherStatusSchema = z.union([
    z.literal('active'),
    z.literal('inactive'),
])
export type TeacherStatus = z.infer<typeof teacherStatusSchema>

const genderSchema = z.union([z.literal('L'), z.literal('P')])

const teacherSchema = z.object({
    id: z.string(),
    nip: z.string(),
    namaLengkap: z.string(),
    jenisKelamin: genderSchema,
    tempatLahir: z.string(),
    tanggalLahir: z.coerce.date(),
    mataPelajaran: z.string(),
    pendidikanTerakhir: z.string(),
    telepon: z.string(),
    email: z.string(),
    status: teacherStatusSchema,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
})
export type Teacher = z.infer<typeof teacherSchema>

export const teacherListSchema = z.array(teacherSchema)

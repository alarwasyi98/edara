import { beforeEach, describe, expect, it, vi } from 'vitest'

type ProcedureHandler<TArgs, TResult> = (args: TArgs) => TResult

type ProcedureBuilder = {
  use: (_middleware: unknown) => ProcedureBuilder
  input: (_schema: unknown) => ProcedureBuilder
  handler: <TArgs, TResult>(
    fn: ProcedureHandler<TArgs, TResult>,
  ) => ProcedureHandler<TArgs, TResult>
}

function createProcedureBuilder(): ProcedureBuilder {
  return {
    use: () => createProcedureBuilder(),
    input: () => createProcedureBuilder(),
    handler: (fn) => fn,
  }
}

vi.mock('../authorized', () => ({
  authorized: createProcedureBuilder(),
}))

vi.mock('../middlewares', () => ({
  requireRole: () => Symbol('require-role'),
  withActivityLog: () => Symbol('with-activity-log'),
}))

const studentsModule = await import('./index')

const { list, create, update, getStatusHistory } = studentsModule

type QueryChain<T> = PromiseLike<T> & {
  from: (_table?: unknown) => QueryChain<T>
  leftJoin: (_table?: unknown, _condition?: unknown) => QueryChain<T>
  where: (_condition?: unknown) => QueryChain<T>
  groupBy: (..._fields: unknown[]) => QueryChain<T>
  orderBy: (..._fields: unknown[]) => QueryChain<T>
  limit: (_limit: number) => QueryChain<T>
  offset: (_offset: number) => Promise<T>
}

function makeQueryChain<T>(result: T): QueryChain<T> {
  const promise = Promise.resolve(result)

  const chain: QueryChain<T> = {
    from: () => chain,
    leftJoin: () => chain,
    where: () => chain,
    groupBy: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    offset: async () => result,
    then: promise.then.bind(promise),
  }

  return chain
}

type QueryRecord = Record<string, unknown>

type MockOptions = {
  selectResults?: QueryRecord[] | QueryRecord[][]
  classResults?: Array<QueryRecord | null>
  academicYearResults?: Array<QueryRecord | null>
  enrollmentResults?: Array<QueryRecord | null>
}

function makeTx(options: MockOptions = {}) {
  const selectResults = [...(options.selectResults ?? [])]
  const classResults = [...(options.classResults ?? [])]
  const academicYearResults = [...(options.academicYearResults ?? [])]
  const enrollmentResults = [...(options.enrollmentResults ?? [])]

  const tx = {
    select: vi.fn(() => makeQueryChain(selectResults.shift() ?? [])),
    query: {
      classes: {
        findFirst: vi.fn(async () => classResults.shift() ?? null),
      },
      academicYears: {
        findFirst: vi.fn(async () => academicYearResults.shift() ?? null),
      },
      enrollments: {
        findFirst: vi.fn(async () => enrollmentResults.shift() ?? null),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => []),
      })),
    })),
    transaction: async <T>(callback: (innerTx: typeof tx) => Promise<T>) =>
      callback(tx),
  }

  return tx
}

function makeContext(tx: ReturnType<typeof makeTx>) {
  return {
    tx,
    schoolId: 'school-1',
    unitId: 'unit-1',
    role: 'super_admin',
    assignmentId: 'assignment-1',
    session: {
      id: 'session-1',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      token: 'token-1',
      userId: 'user-1',
    },
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
  }
}

async function expectOrpcError(
  action: () => Promise<unknown>,
  code: string,
  _message: string,
) {
  try {
    await action()
  } catch (error) {
    expect(error).toHaveProperty('code', code)
    return
  }

  throw new Error(`Expected ORPCError ${code} but action resolved successfully`)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('students router regressions', () => {
  it('deduplicates student list rows and keeps the distinct total', async () => {
    const tx = makeTx({
      selectResults: [
        [
          {
            id: 'student-1',
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ],
        [{ count: 1 }],
        [
          {
            id: 'student-1',
            schoolId: 'school-1',
            unitId: 'unit-1',
            nis: '1001',
            nisn: '1234567890',
            namaLengkap: 'Alya',
            nik: null,
            tempatLahir: null,
            tanggalLahir: null,
            jenisKelamin: 'P',
            namaWali: null,
            nomorHpWali: null,
            namaAyah: null,
            namaIbu: null,
            alamat: null,
            photoUrl: null,
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            enrollment: {
              id: 'enrollment-2',
              status: 'active',
              class: { id: 'class-2', name: '8A', grade: 8 },
              academicYear: {
                id: 'year-2',
                name: '2026/2027',
                isActive: true,
              },
            },
          },
          {
            id: 'student-1',
            schoolId: 'school-1',
            unitId: 'unit-1',
            nis: '1001',
            nisn: '1234567890',
            namaLengkap: 'Alya',
            nik: null,
            tempatLahir: null,
            tanggalLahir: null,
            jenisKelamin: 'P',
            namaWali: null,
            nomorHpWali: null,
            namaAyah: null,
            namaIbu: null,
            alamat: null,
            photoUrl: null,
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
            enrollment: {
              id: 'enrollment-1',
              status: 'promoted',
              class: { id: 'class-1', name: '7A', grade: 7 },
              academicYear: {
                id: 'year-1',
                name: '2025/2026',
                isActive: false,
              },
            },
          },
        ],
      ],
    })

    const result = await list({
      input: {
        page: 1,
        pageSize: 20,
        status: [],
        jenisKelamin: [],
      },
      context: makeContext(tx),
    })

    expect(result.total).toBe(1)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.enrollment?.id).toBe('enrollment-2')
  })

  it('returns a structured conflict when creating a duplicate NISN', async () => {
    const tx = makeTx({
      classResults: [
        {
          id: 'class-1',
          schoolId: 'school-1',
          unitId: 'unit-1',
          academicYearId: 'year-1',
        },
      ],
      academicYearResults: [
        {
          id: 'year-1',
          schoolId: 'school-1',
          unitId: 'unit-1',
        },
      ],
      selectResults: [[{ id: 'student-existing' }]],
    })

    await expectOrpcError(
      () =>
        create({
          input: {
            nis: '1001',
            nisn: '1234567890',
            namaLengkap: 'Alya',
            nik: null,
            tempatLahir: null,
            tanggalLahir: null,
            jenisKelamin: 'P',
            namaWali: null,
            nomorHpWali: null,
            namaAyah: null,
            namaIbu: null,
            alamat: null,
            photoUrl: null,
            classId: 'class-1',
            academicYearId: 'year-1',
          },
          context: makeContext(tx),
        }),
      'CONFLICT',
      'NISN sudah terdaftar di sekolah ini',
    )
  })

  it('rejects create when the class does not belong to the selected academic year', async () => {
    const tx = makeTx({
      classResults: [
        {
          id: 'class-1',
          schoolId: 'school-1',
          unitId: 'unit-1',
          academicYearId: 'year-1',
        },
      ],
      academicYearResults: [
        {
          id: 'year-2',
          schoolId: 'school-1',
          unitId: 'unit-1',
        },
      ],
    })

    await expectOrpcError(
      () =>
        create({
          input: {
            nis: '1001',
            nisn: '1234567890',
            namaLengkap: 'Alya',
            nik: null,
            tempatLahir: null,
            tanggalLahir: null,
            jenisKelamin: 'P',
            namaWali: null,
            nomorHpWali: null,
            namaAyah: null,
            namaIbu: null,
            alamat: null,
            photoUrl: null,
            classId: 'class-1',
            academicYearId: 'year-2',
          },
          context: makeContext(tx),
        }),
      'BAD_REQUEST',
      'Kelas harus berada pada tahun ajaran yang dipilih',
    )
  })

  it('returns a structured conflict when updating to a duplicate NISN', async () => {
    const tx = makeTx({
      selectResults: [[{ id: 'student-existing' }]],
    })

    await expectOrpcError(
      () =>
        update({
          input: {
            id: 'student-1',
            nisn: '1234567890',
          },
          context: makeContext(tx),
        }),
      'CONFLICT',
      'NISN sudah terdaftar di sekolah ini',
    )
  })

  it('forbids reading status history from another unit', async () => {
    const tx = makeTx({
      enrollmentResults: [
        {
          id: 'enrollment-1',
          schoolId: 'school-1',
          unitId: 'unit-2',
          studentId: 'student-1',
          status: 'active',
        },
      ],
    })

    await expectOrpcError(
      () =>
        getStatusHistory({
          input: { enrollmentId: 'enrollment-1' },
          context: makeContext(tx),
        }),
      'FORBIDDEN',
      'Access denied',
    )
  })
})

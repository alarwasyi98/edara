import { School, Building2, GraduationCap } from 'lucide-react'

// ──────────────────────────────────────────────
// Tenant / Kampus
// ──────────────────────────────────────────────

// ── Unit Level ───────────────────────────────────────────────

export const UNIT_LEVELS = {
  MI: 'MI',
  MTS: 'MTs',
  MA: 'MA',
  SD: 'SD',
  SMP: 'SMP',
  SMA: 'SMA',
  SMK: 'SMK',
} as const

export type UnitLevel = (typeof UNIT_LEVELS)[keyof typeof UNIT_LEVELS]

export const unitLevelLabels: Record<UnitLevel, string> = {
  MI: 'Madrasah Ibtidaiyah',
  MTs: 'Madrasah Tsanawiyah',
  MA: 'Madrasah Aliyah',
  SD: 'Sekolah Dasar',
  SMP: 'Sekolah Menengah Pertama',
  SMA: 'Sekolah Menengah Atas',
  SMK: 'Sekolah Menengah Kejuruan',
}

/** Grouped options for <select> / <optgroup> in unit form */
export const unitLevelGroups = [
  {
    label: 'Madrasah',
    options: [
      { label: 'MI — Madrasah Ibtidaiyah', value: UNIT_LEVELS.MI },
      { label: 'MTs — Madrasah Tsanawiyah', value: UNIT_LEVELS.MTS },
      { label: 'MA — Madrasah Aliyah', value: UNIT_LEVELS.MA },
    ],
  },
  {
    label: 'Umum',
    options: [
      { label: 'SD — Sekolah Dasar', value: UNIT_LEVELS.SD },
      { label: 'SMP — Sekolah Menengah Pertama', value: UNIT_LEVELS.SMP },
      { label: 'SMA — Sekolah Menengah Atas', value: UNIT_LEVELS.SMA },
      { label: 'SMK — Sekolah Menengah Kejuruan', value: UNIT_LEVELS.SMK },
    ],
  },
] as const

export const unitLevelColors: Record<UnitLevel, string> = {
  MI:  'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  MTs: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  MA:  'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  SD:  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  SMP: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  SMA: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  SMK: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
}

export const unitStatusColors = {
  active:   'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  inactive: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400',
} as const

// ── Legacy Tenant (kept for backward compat) ────────────────

export type TenantLevel = 'mi' | 'mts' | 'ma'

export interface Tenant {
  id: string
  name: string
  shortName: string
  level: TenantLevel
  icon: React.ElementType
}

export const tenants: Tenant[] = [
  {
    id: 'campus_mts',
    name: 'MTs Ulul Ilmi',
    shortName: 'MTs',
    level: 'mts',
    icon: School,
  },
  {
    id: 'campus_ma',
    name: 'MA Ulul Ilmi',
    shortName: 'MA',
    level: 'ma',
    icon: Building2,
  },
  {
    id: 'campus_mi',
    name: 'MI Ulul Ilmi',
    shortName: 'MI',
    level: 'mi',
    icon: GraduationCap,
  },
]

// ──────────────────────────────────────────────
// Roles
// ──────────────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  KEPALA_SEKOLAH: 'kepala_sekolah',
  ADMIN_TU: 'admin_tu',
  BENDAHARA: 'bendahara',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  kepala_sekolah: 'Kepala Sekolah',
  admin_tu: 'Admin TU',
  bendahara: 'Bendahara',
}

// ──────────────────────────────────────────────
// Status Siswa
// ──────────────────────────────────────────────

export const STUDENT_STATUS = {
  ACTIVE: 'active',
  GRADUATED: 'graduated',
  TRANSFERRED: 'transferred',
  INACTIVE: 'inactive',
} as const

export type StudentStatus =
  (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS]

export const studentStatusLabels: Record<StudentStatus, string> = {
  active: 'Aktif',
  graduated: 'Lulus',
  transferred: 'Pindah',
  inactive: 'Nonaktif',
}

export const studentStatusColors: Record<StudentStatus, string> = {
  active:      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  graduated:   'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  transferred: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  inactive:    'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400',
}

// ──────────────────────────────────────────────
// Status Guru
// ──────────────────────────────────────────────

export const TEACHER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export type TeacherStatus =
  (typeof TEACHER_STATUS)[keyof typeof TEACHER_STATUS]

export const teacherStatusLabels: Record<TeacherStatus, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
}

export const teacherStatusColors: Record<TeacherStatus, string> = {
  active:   'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  inactive: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400',
}

// ──────────────────────────────────────────────
// Status SPP
// ──────────────────────────────────────────────

export const SPP_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const

export type SppStatus = (typeof SPP_STATUS)[keyof typeof SPP_STATUS]

export const sppStatusLabels: Record<SppStatus, string> = {
  unpaid: 'Belum Dibayar',
  partial: 'Sebagian',
  paid: 'Lunas',
  overdue: 'Menunggak',
}

export const sppStatusColors: Record<SppStatus, string> = {
  unpaid:  'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400',
  partial: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  paid:    'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  overdue: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
}

// ──────────────────────────────────────────────
// Status User
// ──────────────────────────────────────────────

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  INVITED: 'invited',
  SUSPENDED: 'suspended',
} as const

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]

export const userStatusLabels: Record<UserStatus, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  invited: 'Diundang',
  suspended: 'Ditangguhkan',
}

// ──────────────────────────────────────────────
// Tahun Ajaran Status
// ──────────────────────────────────────────────

export type TahunAjaranStatus = 'active' | 'completed' | 'upcoming'

export const tahunAjaranStatusLabels: Record<TahunAjaranStatus, string> = {
  active:    'Aktif',
  completed: 'Selesai',
  upcoming:  'Mendatang',
}

export const tahunAjaranStatusColors: Record<TahunAjaranStatus, string> = {
  active:    'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  completed: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400',
  upcoming:  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
}

// ──────────────────────────────────────────────
// Kelas Jenjang
// ──────────────────────────────────────────────

export const kelasJenjangColors: Record<string, string> = {
  VII:  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  VIII: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  IX:   'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
}

// ──────────────────────────────────────────────
// Kalender Kategori
// ──────────────────────────────────────────────

export type KalenderKategori = 'akademik' | 'keagamaan' | 'olahraga' | 'umum'

export const kalenderKategoriColors: Record<KalenderKategori, string> = {
  akademik:  'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  keagamaan: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  olahraga:  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  umum:      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
}

// ──────────────────────────────────────────────
// Jenis Bayar Periode
// ──────────────────────────────────────────────

export type PeriodeBayar = 'bulanan' | 'tahunan' | 'sekali'

export const periodeBayarLabels: Record<PeriodeBayar, string> = {
  bulanan: 'Bulanan',
  tahunan: 'Tahunan',
  sekali:  'Sekali Bayar',
}

export const periodeBayarColors: Record<PeriodeBayar, string> = {
  bulanan: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  tahunan: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  sekali:  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
}

// ──────────────────────────────────────────────
// Diskon Kategori
// ──────────────────────────────────────────────

export const diskonKategoriColors: Record<string, string> = {
  yatim:       'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  dhuafa:      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  prestasi:    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  pegawai:     'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  'kakak-adik':'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-400',
  lainnya:     'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950/30 dark:text-gray-400',
}

// ──────────────────────────────────────────────
// Keuangan Jenis Transaksi (Badge)
// ──────────────────────────────────────────────

export const keuanganJenisColors: Record<string, string> = {
  income:  'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  expense: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
}

// ──────────────────────────────────────────────
// Jenis Transaksi Keuangan
// ──────────────────────────────────────────────

export const TRANSACTION_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const

export type TransactionType =
  (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE]

export const transactionTypeLabels: Record<TransactionType, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
}

// ──────────────────────────────────────────────
// Metode Pembayaran
// ──────────────────────────────────────────────

export const PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'QRIS',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

// ──────────────────────────────────────────────
// Gender
// ──────────────────────────────────────────────

export const GENDER = {
  L: 'L',
  P: 'P',
} as const

export type Gender = (typeof GENDER)[keyof typeof GENDER]

export const genderLabels: Record<Gender, string> = {
  L: 'Laki-laki',
  P: 'Perempuan',
}

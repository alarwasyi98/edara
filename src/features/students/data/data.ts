import { type StudentStatus, studentStatusColors } from '@/lib/constants'

export const statusOptions: {
    label: string
    value: StudentStatus
    color: string
}[] = [
        {
            label: 'Aktif',
            value: 'active',
            color: studentStatusColors.active,
        },
        {
            label: 'Lulus',
            value: 'graduated',
            color: studentStatusColors.graduated,
        },
        {
            label: 'Pindah',
            value: 'transferred',
            color: studentStatusColors.transferred,
        },
        {
            label: 'Nonaktif',
            value: 'inactive',
            color: studentStatusColors.inactive,
        },
    ]

export const kelasOptions = [
    'VII-A',
    'VII-B',
    'VII-C',
    'VIII-A',
    'VIII-B',
    'VIII-C',
    'IX-A',
    'IX-B',
    'IX-C',
] as const

export const statusColorMap = new Map<StudentStatus, string>(
    statusOptions.map((opt) => [opt.value, opt.color])
)

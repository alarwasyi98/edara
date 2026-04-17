import { type EventCategory } from './schema'
import { BookOpen, GraduationCap, Trophy, Users, type LucideIcon } from 'lucide-react'
import { kalenderKategoriColors } from '@/lib/constants'

export const categoryOptions: {
    label: string
    value: EventCategory
    color: string
    icon: LucideIcon
}[] = [
        {
            label: 'Akademik',
            value: 'akademik',
            color: kalenderKategoriColors.akademik,
            icon: BookOpen,
        },
        {
            label: 'Keagamaan',
            value: 'keagamaan',
            color: kalenderKategoriColors.keagamaan,
            icon: GraduationCap,
        },
        {
            label: 'Olahraga',
            value: 'olahraga',
            color: kalenderKategoriColors.olahraga,
            icon: Trophy,
        },
        {
            label: 'Umum',
            value: 'umum',
            color: kalenderKategoriColors.umum,
            icon: Users,
        },
    ]

export const categoryColorMap = new Map<EventCategory, string>(
    categoryOptions.map((opt) => [opt.value, opt.color])
)

export const categoryIconMap = new Map<EventCategory, LucideIcon>(
    categoryOptions.map((opt) => [opt.value, opt.icon])
)

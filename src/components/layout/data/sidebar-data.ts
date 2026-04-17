import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  CalendarDays,
  Receipt,
  BookOpen,
  Users,
  Settings,
  UserCog,
  Wrench,
  Palette,
  School,
  Building2,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@ululilmi.sch.id',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'MTs Ulul Ilmi',
      logo: School,
      plan: 'Madrasah Tsanawiyah',
    },
    {
      name: 'MA Ulul Ilmi',
      logo: Building2,
      plan: 'Madrasah Aliyah',
    },
    {
      name: 'MI Ulul Ilmi',
      logo: GraduationCap,
      plan: 'Madrasah Ibtidaiyah',
    },
  ],
  navGroups: [
    {
      title: 'Utama',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Akademik',
      items: [
        {
          title: 'Manajemen Siswa',
          icon: GraduationCap,
          items: [
            {
              title: 'Data Siswa',
              url: '/students',
            },
            {
              title: 'Kelas',
              url: '/classes',
            },
            {
              title: 'Tahun Ajaran',
              url: '/academic-years',
            },
          ],
        },
        {
          title: 'Manajemen Guru',
          icon: UserCheck,
          items: [
            {
              title: 'Data Guru',
              url: '/teachers',
            },
            {
              title: 'Penugasan',
              url: '/teachers/penugasan',
            },
          ],
        },
        {
title: 'Kalender Kegiatan',
              url: '/events',
          icon: CalendarDays,
        },
      ],
    },
    {
      title: 'Keuangan',
      items: [
        {
          title: 'Manajemen SPP',
          icon: Receipt,
          items: [
            {
              title: 'Pembayaran Siswa',
              url: '/spp',
            },
            {
              title: 'Jenis Bayar',
              url: '/spp/jenis-bayar',
            },
            {
              title: 'Diskon & Subsidi',
              url: '/spp/diskon',
            },
            {
              title: 'Laporan',
              url: '/spp/laporan',
            },
          ],
        },
        {
          title: 'Pencatatan Keuangan',
          icon: BookOpen,
          items: [
            {
              title: 'Arus Kas',
              url: '/cashflow',
            },
            {
              title: 'Akun',
              url: '/cashflow/akun',
            },
            {
              title: 'Kategori',
              url: '/cashflow/kategori',
            },
            {
              title: 'Laporan',
              url: '/cashflow/laporan',
            },
          ],
        },
      ],
    },
    {
      title: 'Pengaturan',
      items: [
        {
          title: 'Manajemen User',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Pengaturan',
          icon: Settings,
          items: [
            {
              title: 'Profil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Akun',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Tampilan',
              url: '/settings/appearance',
              icon: Palette,
            },
          ],
        },
      ],
    },
  ],
}

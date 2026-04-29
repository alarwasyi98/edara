import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  GraduationCap,
  UserCheck,
  Receipt,
  AlertTriangle,
  Activity,
  CalendarClock,
  CreditCard,
  UserPlus,
  BookOpen,
  MoreHorizontal,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { StatCard } from '@/components/shared/stat-card'
import { useTenant } from '@/hooks/use-tenant'
import { formatRupiah } from '@/lib/format'
import { SppCollectionChart } from './components/overview'
import { RecentPayments } from './components/recent-sales'
import { Analytics } from './components/analytics'

const activityLog = [
  { id: 1, icon: CreditCard, user: 'Admin Keuangan', action: 'mencatat pembayaran SPP atas nama Ahmad Fauzi', time: '2 menit lalu' },
  { id: 2, icon: UserPlus, user: 'Admin Tata Usaha', action: 'menambahkan siswa baru: Rizky Ramadhan (VII-B)', time: '15 menit lalu' },
  { id: 3, icon: CreditCard, user: 'Admin Keuangan', action: 'mencatat pembayaran Daftar Ulang atas nama Siti Aisyah', time: '42 menit lalu' },
  { id: 4, icon: BookOpen, user: 'Admin Akademik', action: 'memperbarui data kelas IX-A', time: '1 jam lalu' },
  { id: 5, icon: UserPlus, user: 'Admin Tata Usaha', action: 'menambahkan siswa baru: Nur Fadilah (VIII-C)', time: '2 jam lalu' },
]

const upcomingEvents = [
  { id: 1, title: 'Rapat Wali Murid', date: '16 Maret 2026', desc: 'Pembahasan perkembangan akademik semester genap' },
  { id: 2, title: 'Batas Akhir Pembayaran SPP', date: '20 Maret 2026', desc: 'Tenggat pembayaran SPP bulan Maret 2026' },
  { id: 3, title: 'Ujian Tengah Semester', date: '25 Maret 2026', desc: 'UTS Semester Genap 2025/2026 seluruh kelas' },
  { id: 4, title: 'Peringatan Hari Pendidikan', date: '2 Mei 2026', desc: 'Upacara dan kegiatan peringatan Hardiknas' },
]

export function Dashboard() {
  const { activeAssignment } = useTenant()
  const [sppTimeRange, setSppTimeRange] = useState('12')

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
            <p className='text-muted-foreground'>{activeAssignment?.schoolName ?? 'No school assigned'}</p>
          </div>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList variant='line'>
              <TabsTrigger value='overview'>Ringkasan</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <StatCard
                title='Total Siswa Aktif'
                value='248'
                trend={{ value: '+12 bulan ini', positive: true }}
                description='3 rombel baru'
                icon={
                  <GraduationCap className='h-4 w-4 text-muted-foreground' />
                }
              />
              <StatCard
                title='Guru & Staff'
                value='32'
                trend={{ value: '+2 semester ini', positive: true }}
                description='28 aktif mengajar'
                icon={
                  <UserCheck className='h-4 w-4 text-muted-foreground' />
                }
              />
              <StatCard
                title='Penerimaan SPP Bulan Ini'
                value={formatRupiah(38600000)}
                trend={{ value: '+8.2%', positive: true }}
                description='vs bulan lalu'
                icon={
                  <Receipt className='h-4 w-4 text-muted-foreground' />
                }
              />
              <StatCard
                title='Tunggakan SPP'
                value={formatRupiah(12450000)}
                trend={{ value: '18 siswa', positive: false }}
                description='perlu tindak lanjut'
                icon={
                  <AlertTriangle className='h-4 w-4 text-muted-foreground' />
                }
              />
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Penerimaan SPP</CardTitle>
                    <CardDescription>
                      Total penerimaan SPP bulanan tahun ajaran 2025/2026
                    </CardDescription>
                  </div>
                  <Select value={sppTimeRange} onValueChange={setSppTimeRange}>
                    <SelectTrigger className="w-30">
                      <SelectValue placeholder="Pilih rentang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Bulan</SelectItem>
                      <SelectItem value="3">3 Bulan</SelectItem>
                      <SelectItem value="6">6 Bulan</SelectItem>
                      <SelectItem value="12">1 Tahun</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className='ps-2 pt-4'>
                  <SppCollectionChart timeRange={sppTimeRange} />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Pembayaran Terbaru</CardTitle>
                    <CardDescription>
                      5 pembayaran SPP terakhir hari ini.
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/spp">Lihat Selengkapnya</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <RecentPayments />
                </CardContent>
              </Card>
            </div>

            {/* Log Aktivitas & Kegiatan Mendatang */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <Activity className='h-4 w-4' /> Log Aktivitas
                    </CardTitle>
                    <CardDescription>Aktivitas pengguna terkini di sistem</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/settings">Lihat Selengkapnya</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-3'>
                    {activityLog.map((log) => (
                      <li key={log.id} className='flex items-start gap-3'>
                        <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted'>
                          <log.icon className='h-3.5 w-3.5 text-muted-foreground' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm'>
                            <span className='font-medium'>{log.user}</span>{' '}
                            <span className='text-muted-foreground'>{log.action}</span>
                          </p>
                          <p className='text-xs text-muted-foreground'>{log.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <CalendarClock className='h-4 w-4' /> Kegiatan Mendatang
                    </CardTitle>
                    <CardDescription>Jadwal acara dan tenggat yang akan datang</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/events">Lihat Selengkapnya</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-3'>
                    {upcomingEvents.map((ev) => (
                      <li key={ev.id} className='flex items-start gap-3'>
                        <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted'>
                          <CalendarClock className='h-3.5 w-3.5 text-muted-foreground' />
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm font-medium'>{ev.title}</p>
                          <p className='text-xs text-muted-foreground'>{ev.date} · {ev.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value='analytics' className='space-y-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

import { notFound, useParams, Link } from '@tanstack/react-router'
import {
    ArrowLeft,
    UserCircle,
    Users,
    Wallet,
    FileText,
    GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { cn } from '@/lib/utils'
import { TabDataPribadi } from './components/tab-data-pribadi'
import { TabKeluarga } from './components/tab-keluarga'
import { TabKeuangan } from './components/tab-keuangan'
import { TabDokumen } from './components/tab-dokumen'
import { TabAkademik } from './components/tab-akademik'
import { students } from './data/students'
import { statusColorMap, statusOptions } from './data/data'

export function DetailStudent() {
    const { id } = useParams({ from: '/_authenticated/students/$id' })
    const siswa = students.find((s) => s.id === id)

    if (!siswa) throw notFound()

    const statusColor = statusColorMap.get(siswa.status)
    const statusLabel =
        statusOptions.find((s) => s.value === siswa.status)?.label ??
        siswa.status

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

            <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
                <div className='flex items-center gap-3'>
                    <Button variant='ghost' size='icon' asChild>
                        <Link to='/students'>
                            <ArrowLeft className='h-4 w-4' />
                        </Link>
                    </Button>
                    <div>
                        <h2 className='text-2xl font-bold tracking-tight'>
                            {siswa.namaLengkap}
                        </h2>
                        <p className='text-sm text-muted-foreground'>
                            NIS: {siswa.nis} · NISN: {siswa.nisn}
                        </p>
                    </div>
                    <Badge
                        variant='outline'
                        className={cn('ml-auto', statusColor)}
                    >
                        {statusLabel}
                    </Badge>
                </div>

                {/* Tabbed content */}
                <Tabs defaultValue='pribadi'>
                    <TabsList variant='line' className='w-full justify-start overflow-x-auto'>
                        <TabsTrigger value='pribadi' className='gap-1.5'>
                            <UserCircle className='h-4 w-4' />
                            <span className='hidden sm:inline'>Data Pribadi</span>
                            <span className='sm:hidden'>Pribadi</span>
                        </TabsTrigger>
                        <TabsTrigger value='keluarga' className='gap-1.5'>
                            <Users className='h-4 w-4' />
                            <span className='hidden sm:inline'>Keluarga</span>
                            <span className='sm:hidden'>Keluarga</span>
                        </TabsTrigger>
                        <TabsTrigger value='keuangan' className='gap-1.5'>
                            <Wallet className='h-4 w-4' />
                            <span className='hidden sm:inline'>Keuangan</span>
                            <span className='sm:hidden'>Keuangan</span>
                        </TabsTrigger>
                        <TabsTrigger value='dokumen' className='gap-1.5'>
                            <FileText className='h-4 w-4' />
                            <span className='hidden sm:inline'>Dokumen</span>
                            <span className='sm:hidden'>Dokumen</span>
                        </TabsTrigger>
                        <TabsTrigger value='akademik' className='gap-1.5'>
                            <GraduationCap className='h-4 w-4' />
                            <span className='hidden sm:inline'>Akademik</span>
                            <span className='sm:hidden'>Akademik</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value='pribadi'>
                        <TabDataPribadi siswa={siswa} />
                    </TabsContent>

                    <TabsContent value='keluarga'>
                        <TabKeluarga siswa={siswa} />
                    </TabsContent>

                    <TabsContent value='keuangan'>
                        <TabKeuangan studentId={siswa.id} />
                    </TabsContent>

                    <TabsContent value='dokumen'>
                        <TabDokumen />
                    </TabsContent>

                    <TabsContent value='akademik'>
                        <TabAkademik siswa={siswa} />
                    </TabsContent>
                </Tabs>
            </Main>
        </>
    )
}

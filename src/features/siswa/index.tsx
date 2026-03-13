import { getRouteApi } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SiswaTable } from './components/siswa-table'
import { SiswaActionButtons } from './components/siswa-action-buttons'
import { SiswaProvider } from './components/siswa-provider'
import { SiswaImportDialog, SiswaExportDialog, SiswaDeleteDialog } from './components/siswa-dialogs'
import { SiswaAddDialog } from './components/siswa-add-dialog'
import { students } from './data/students'

const route = getRouteApi('/_authenticated/siswa/')

// Tahun ajaran aktif — sinkron dengan data di tahun-ajaran/index.tsx
const activeTahunAjaran = {
    nama: '2025/2026',
    mulai: '15 Juli 2025',
    selesai: '20 Juni 2026',
    semester: 'Genap (Jan–Jun 2026)',
}

export function DataSiswa() {
    const search = route.useSearch()
    const navigate = route.useNavigate()

    return (
        <SiswaProvider>
            <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
                <PageHeader
                    title='Data Siswa'
                    description='Kelola data peserta didik madrasah.'
                >
                    <SiswaActionButtons />
                </PageHeader>

                <Card className='border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'>
                    <CardHeader className='pb-3'>
                        <div className='flex items-center gap-2'>
                            <CheckCircle2 className='h-4 w-4 text-green-600' />
                            <CardTitle className='text-sm font-semibold text-green-800 dark:text-green-300'>
                                Tahun Ajaran Aktif: {activeTahunAjaran.nama}
                            </CardTitle>
                        </div>
                        <CardDescription>
                            {activeTahunAjaran.mulai} — {activeTahunAjaran.selesai} · Semester: {activeTahunAjaran.semester}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <SiswaTable data={students} search={search} navigate={navigate} />
            </Main>

            <SiswaImportDialog />
            <SiswaExportDialog />
            <SiswaDeleteDialog />
            <SiswaAddDialog />
        </SiswaProvider>
    )
}

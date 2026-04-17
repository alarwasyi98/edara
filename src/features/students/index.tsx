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
import { StudentTable } from './components/student-table'
import { StudentActionButtons } from './components/student-action-buttons'
import { StudentProvider } from './components/student-provider'
import { StudentImportDialog, StudentExportDialog, StudentDeleteDialog } from './components/student-dialogs'
import { StudentAddDialog } from './components/student-add-dialog'
import { students } from './data/students'

const route = getRouteApi('/_authenticated/students/')

const activeTahunAjaran = {
    nama: '2025/2026',
    mulai: '15 Juli 2025',
    selesai: '20 Juni 2026',
    semester: 'Genap (Jan–Jun 2026)',
}

export function DataStudent() {
    const search = route.useSearch()
    const navigate = route.useNavigate()

    return (
        <StudentProvider>
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
                    <StudentActionButtons />
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

                <StudentTable data={students} search={search} navigate={navigate} />
            </Main>

            <StudentImportDialog />
            <StudentExportDialog />
            <StudentDeleteDialog />
            <StudentAddDialog />
        </StudentProvider>
    )
}
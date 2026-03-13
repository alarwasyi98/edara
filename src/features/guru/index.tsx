import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { GuruTable } from './components/guru-table'
import { GuruProvider } from './components/guru-provider'
import { GuruActionButtons } from './components/guru-action-buttons'
import { GuruImportDialog, GuruExportDialog } from './components/guru-dialogs'
import { GuruAddDialog } from './components/guru-add-dialog'
import { teachers } from './data/teachers'

const route = getRouteApi('/_authenticated/guru/')

export function DataGuru() {
    const search = route.useSearch()
    const navigate = route.useNavigate()

    return (
        <GuruProvider>
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
                    title='Data Guru'
                    description='Kelola data guru dan tenaga pengajar.'
                >
                    <GuruActionButtons />
                </PageHeader>
                <GuruTable data={teachers} search={search} navigate={navigate} />
            </Main>

            <GuruAddDialog />
            <GuruImportDialog />
            <GuruExportDialog />
        </GuruProvider>
    )
}

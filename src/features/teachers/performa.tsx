import { BarChart3 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export function GuruPerforma() {
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
                <PageHeader
                    title='Performa Guru'
                    description='Pantau kinerja, evaluasi, dan penilaian performa tenaga pengajar.'
                />
                <EmptyState
                    icon={BarChart3}
                    title='Belum ada data performa'
                    description='Data performa guru akan ditampilkan setelah penilaian dilakukan. Mulai dengan membuat periode evaluasi terlebih dahulu.'
                    actionLabel='Buat Periode Evaluasi'
                />
            </Main>
        </>
    )
}

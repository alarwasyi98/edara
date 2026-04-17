import { ClipboardList } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export function GuruPenugasan() {
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
                    title='Penugasan Guru'
                    description='Kelola penugasan, jadwal mengajar, dan beban kerja guru.'
                />
                <EmptyState
                    icon={ClipboardList}
                    title='Belum ada penugasan'
                    description='Buat penugasan mengajar untuk guru berdasarkan mata pelajaran dan kelas. Penugasan akan muncul di halaman ini.'
                    actionLabel='Buat Penugasan'
                />
            </Main>
        </>
    )
}

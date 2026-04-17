import { FileBarChart } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export function KeuanganLaporan() {
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
                    title='Laporan Keuangan'
                    description='Generate dan unduh laporan keuangan bulanan atau tahunan madrasah.'
                />
                <EmptyState
                    icon={FileBarChart}
                    title='Belum ada laporan yang dibuat'
                    description='Laporan keuangan dapat di-generate setelah transaksi tercatat. Tersedia laporan Arus Kas, Neraca, dan Laba Rugi.'
                    actionLabel='Buat Laporan'
                />
            </Main>
        </>
    )
}

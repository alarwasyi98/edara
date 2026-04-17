import { Landmark } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export function KeuanganAkun() {
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
                    title='Akun Keuangan'
                    description='Kelola daftar akun keuangan (chart of accounts) madrasah.'
                />
                <EmptyState
                    icon={Landmark}
                    title='Belum ada akun keuangan'
                    description='Tambahkan akun keuangan seperti Kas, Bank, Pendapatan SPP, dan Biaya Operasional untuk mulai mencatat transaksi.'
                    actionLabel='Tambah Akun'
                />
            </Main>
        </>
    )
}

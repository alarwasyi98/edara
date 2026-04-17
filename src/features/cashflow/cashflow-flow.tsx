import { ArrowLeftRight } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export function CashflowFlow() {
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
                    title='Arus Kas'
                    description='Pantau arus kas masuk dan keluar keuangan madrasah secara real-time.'
                />
                <EmptyState
                    icon={ArrowLeftRight}
                    title='Belum ada transaksi arus kas'
                    description='Transaksi keuangan akan muncul di sini setelah Anda mulai mencatat pemasukan dan pengeluaran. Pastikan akun dan kategori sudah disiapkan terlebih dahulu.'
                    actionLabel='Catat Transaksi'
                />
            </Main>
        </>
    )
}
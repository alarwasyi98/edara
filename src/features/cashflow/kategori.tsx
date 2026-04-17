import { Tag } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'

export function KeuanganKategori() {
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
                    title='Kategori Transaksi'
                    description='Kelola kategori pemasukan dan pengeluaran untuk pengelompokan laporan keuangan.'
                />
                <EmptyState
                    icon={Tag}
                    title='Belum ada kategori transaksi'
                    description='Buat kategori seperti Pemasukan SPP, Gaji Pegawai, dan Biaya Operasional agar transaksi mudah dikelompokkan dan dilaporkan.'
                    actionLabel='Tambah Kategori'
                />
            </Main>
        </>
    )
}

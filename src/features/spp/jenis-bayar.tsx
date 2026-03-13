import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { formatRupiah } from '@/lib/format'
import { Plus, Receipt, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'

type PeriodeBayar = 'bulanan' | 'tahunan' | 'sekali'
type SortField = 'default' | 'nominal_asc' | 'nominal_desc' | 'dateAdded_asc' | 'dateAdded_desc'

type JenisBayarItem = {
    id: string
    kode: string
    nama: string
    nominal: number
    periode: PeriodeBayar
    keterangan: string
    aktif: boolean
    dateAdded: Date
}

const periodeConfig: Record<PeriodeBayar, { label: string; color: string }> = {
    bulanan: { label: 'Bulanan', color: 'bg-blue-100/30 text-blue-800 dark:text-blue-200 border-blue-200' },
    tahunan: { label: 'Tahunan', color: 'bg-purple-100/30 text-purple-800 dark:text-purple-200 border-purple-200' },
    sekali: { label: 'Sekali Bayar', color: 'bg-amber-100/30 text-amber-800 dark:text-amber-200 border-amber-200' },
}

const initialList: JenisBayarItem[] = [
    { id: '1', kode: 'SPP-MTS', nama: 'SPP MTs', nominal: 450000, periode: 'bulanan', keterangan: 'Sumbangan Pembinaan Pendidikan bulanan', aktif: true, dateAdded: new Date('2024-07-15') },
    { id: '2', kode: 'SPP-MA', nama: 'SPP MA', nominal: 500000, periode: 'bulanan', keterangan: 'Sumbangan Pembinaan Pendidikan MA', aktif: true, dateAdded: new Date('2024-07-15') },
    { id: '3', kode: 'PPDB-2026', nama: 'Biaya Pendaftaran PPDB', nominal: 150000, periode: 'sekali', keterangan: 'Biaya formulir dan seleksi PPDB', aktif: true, dateAdded: new Date('2025-01-10') },
    { id: '4', kode: 'DAFTAR-ULANG', nama: 'Daftar Ulang', nominal: 750000, periode: 'tahunan', keterangan: 'Biaya daftar ulang awal tahun ajaran', aktif: true, dateAdded: new Date('2024-07-15') },
    { id: '5', kode: 'SERAGAM', nama: 'Seragam Sekolah', nominal: 600000, periode: 'sekali', keterangan: 'Paket lengkap seragam (putih, batik, olahraga)', aktif: true, dateAdded: new Date('2024-08-01') },
    { id: '6', kode: 'BK-MATPEL', nama: 'Buku Mata Pelajaran', nominal: 350000, periode: 'tahunan', keterangan: 'Paket buku LKS dan referensi', aktif: true, dateAdded: new Date('2024-08-01') },
    { id: '7', kode: 'EKSKUL', nama: 'Kegiatan Ekstrakurikuler', nominal: 75000, periode: 'bulanan', keterangan: 'Biaya ekskul (futsal, pramuka, dll)', aktif: false, dateAdded: new Date('2024-09-05') },
    { id: '8', kode: 'WISATA', nama: 'Study Tour', nominal: 1200000, periode: 'sekali', keterangan: 'Biaya wisata tahunan kelas VIII', aktif: true, dateAdded: new Date('2024-10-20') },
    { id: '9', kode: 'UJIAN', nama: 'Biaya Ujian', nominal: 200000, periode: 'tahunan', keterangan: 'UN / UAS (termasuk kartu ujian)', aktif: true, dateAdded: new Date('2024-07-20') },
]

function emptyForm(): Omit<JenisBayarItem, 'id' | 'dateAdded'> {
    return { kode: '', nama: '', nominal: 0, periode: 'bulanan', keterangan: '', aktif: true }
}

const sortLabels: Record<SortField, string> = {
    default: 'Default',
    nominal_asc: 'Nominal: Terendah',
    nominal_desc: 'Nominal: Tertinggi',
    dateAdded_asc: 'Tgl Ditambahkan: Terlama',
    dateAdded_desc: 'Tgl Ditambahkan: Terbaru',
}

export function JenisBayar() {
    const [list, setList] = useState<JenisBayarItem[]>(initialList)
    const [open, setOpen] = useState(false)
    const [form, setForm] = useState(emptyForm())
    const [sortBy, setSortBy] = useState<SortField>('default')

    const handleAdd = () => {
        if (!form.kode || !form.nama) return
        const newItem: JenisBayarItem = {
            ...form,
            id: Date.now().toString(),
            dateAdded: new Date(),
        }
        setList((prev) => [...prev, newItem])
        setOpen(false)
        setForm(emptyForm())
        toast.success(`Jenis bayar "${form.nama}" berhasil ditambahkan.`)
    }

    const sortedList = useMemo(() => {
        const arr = [...list]
        switch (sortBy) {
            case 'nominal_asc': return arr.sort((a, b) => a.nominal - b.nominal)
            case 'nominal_desc': return arr.sort((a, b) => b.nominal - a.nominal)
            case 'dateAdded_asc': return arr.sort((a, b) => a.dateAdded.getTime() - b.dateAdded.getTime())
            case 'dateAdded_desc': return arr.sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime())
            default: return arr
        }
    }, [list, sortBy])

    const aktifCount = list.filter((j) => j.aktif).length

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
                    title='Jenis Bayar'
                    description='Master data jenis pembayaran dan skema tarif madrasah.'
                >
                    <Button size='sm' className='gap-1.5' onClick={() => setOpen(true)}>
                        <Plus className='h-4 w-4' />
                        Tambah
                    </Button>
                </PageHeader>

                <Card>
                    <CardHeader className='flex flex-row items-start justify-between'>
                        <div>
                            <CardTitle className='flex items-center gap-2'>
                                <Receipt className='h-5 w-5' /> Daftar Jenis Pembayaran
                            </CardTitle>
                            <CardDescription>
                                {aktifCount} aktif dari {list.length} jenis pembayaran
                            </CardDescription>
                        </div>
                        {/* Sort By Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='outline' size='sm' className='gap-1.5 text-xs'>
                                    <ArrowUpDown className='h-3.5 w-3.5' />
                                    {sortBy === 'default' ? 'Urutkan' : sortLabels[sortBy]}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end' className='w-48'>
                                <DropdownMenuLabel>Urutkan berdasarkan</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSortBy('default')}>Default</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSortBy('nominal_asc')}>Nominal: Terendah</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('nominal_desc')}>Nominal: Tertinggi</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSortBy('dateAdded_asc')}>Tgl Ditambahkan: Terlama</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('dateAdded_desc')}>Tgl Ditambahkan: Terbaru</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <div className='overflow-auto rounded-md border'>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama Jenis Bayar</TableHead>
                                        <TableHead className='text-right'>Nominal</TableHead>
                                        <TableHead>Periode</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead>Tgl. Ditambahkan</TableHead>
                                        <TableHead className='text-center'>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedList.map((item) => {
                                        const pCfg = periodeConfig[item.periode]
                                        return (
                                            <TableRow key={item.id} className={!item.aktif ? 'opacity-60' : ''}>
                                                <TableCell className='font-mono text-sm font-medium'>{item.kode}</TableCell>
                                                <TableCell className='font-medium'>{item.nama}</TableCell>
                                                <TableCell className='text-right font-mono'>{formatRupiah(item.nominal)}</TableCell>
                                                <TableCell>
                                                    <Badge variant='outline' className={cn(pCfg.color)}>
                                                        {pCfg.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className='max-w-[200px] truncate text-sm text-muted-foreground'>{item.keterangan}</TableCell>
                                                <TableCell className='text-sm text-muted-foreground'>{format(item.dateAdded, 'dd/MM/yyyy')}</TableCell>
                                                <TableCell className='text-center'>
                                                    <Badge variant='outline' className={item.aktif ? 'border-green-200 bg-green-100/30 text-green-800 dark:text-green-200' : 'border-neutral-300 bg-neutral-100/30 text-neutral-500'}>
                                                        {item.aktif ? 'Aktif' : 'Nonaktif'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Main>

            {/* ── Dialog Tambah Jenis Bayar ── */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-[440px]'>
                    <DialogHeader>
                        <DialogTitle>Tambah Jenis Bayar</DialogTitle>
                        <DialogDescription>Isi informasi pos pembayaran baru.</DialogDescription>
                    </DialogHeader>

                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='kode' className='text-right'>Kode</Label>
                            <Input
                                id='kode'
                                value={form.kode}
                                onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
                                placeholder='Mis: SPP-MTS'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='nama' className='text-right'>Nama</Label>
                            <Input
                                id='nama'
                                value={form.nama}
                                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                                placeholder='Nama jenis bayar'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='nominal' className='text-right'>Nominal</Label>
                            <Input
                                id='nominal'
                                type='number'
                                value={form.nominal || ''}
                                onChange={(e) => setForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                                placeholder='0'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Periode</Label>
                            <Select
                                value={form.periode}
                                onValueChange={(v) => setForm((f) => ({ ...f, periode: v as PeriodeBayar }))}
                            >
                                <SelectTrigger className='col-span-3'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='bulanan'>Bulanan</SelectItem>
                                    <SelectItem value='tahunan'>Tahunan</SelectItem>
                                    <SelectItem value='sekali'>Sekali Bayar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='ket' className='text-right'>Keterangan</Label>
                            <Input
                                id='ket'
                                value={form.keterangan}
                                onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                                placeholder='Opsional'
                                className='col-span-3'
                            />
                        </div>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label className='text-right'>Status</Label>
                            <Select
                                value={form.aktif ? 'aktif' : 'nonaktif'}
                                onValueChange={(v) => setForm((f) => ({ ...f, aktif: v === 'aktif' }))}
                            >
                                <SelectTrigger className='col-span-3'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='aktif'>Aktif</SelectItem>
                                    <SelectItem value='nonaktif'>Nonaktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant='outline' onClick={() => setOpen(false)}>Batal</Button>
                        <Button onClick={handleAdd} disabled={!form.kode || !form.nama}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

import { useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { UserCircle, MapPin, Users, GraduationCap, Save, CalendarIcon } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useStudent } from './student-provider'

export function StudentAddDialog() {
    const { open, setOpen, currentRow } = useStudent()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('pribadi')
    const isEdit = open === 'edit'
    const [tanggalLahir, setTanggalLahir] = useState<Date | undefined>(
        isEdit && currentRow?.tanggalLahir ? new Date(currentRow.tanggalLahir) : undefined
    )

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        // Mock API call
        setTimeout(() => {
            toast.success(isEdit ? 'Data siswa berhasil diperbarui!' : 'Data siswa baru berhasil ditambahkan!')
            setLoading(false)
            setOpen(null)
            setActiveTab('pribadi')
            setTanggalLahir(undefined)
        }, 1000)
    }

    const handleClose = () => {
        setOpen(null)
        setActiveTab('pribadi')
        setTanggalLahir(undefined)
    }

    return (
        <Dialog open={open === 'add' || open === 'edit'} onOpenChange={handleClose}>
            <DialogContent className="max-w-none w-screen h-dvh m-0 p-0 rounded-none border-none flex flex-col sm:max-w-none sm:rounded-none">
                <form key={isEdit ? currentRow?.id : 'new'} onSubmit={handleSubmit} className="flex flex-col h-full">
                    <DialogHeader className="px-6 py-4 border-b shrink-0">
                        <DialogTitle>{isEdit ? 'Edit Data Siswa' : 'Tambah Data Siswa'}</DialogTitle>
                        <DialogDescription>
                            Isi formulir berikut untuk {isEdit ? 'mengedit' : 'menambahkan'} data peserta didik. Field dengan tanda (*) wajib diisi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                            <div className="px-6 pt-4 shrink-0">
                                <TabsList variant="line" className="w-full justify-start h-auto flex-wrap">
                                    <TabsTrigger value="pribadi" className="gap-1.5 py-2">
                                        <UserCircle className="h-4 w-4" />
                                        Data Pribadi
                                    </TabsTrigger>
                                    <TabsTrigger value="alamat" className="gap-1.5 py-2">
                                        <MapPin className="h-4 w-4" />
                                        Alamat & Kontak
                                    </TabsTrigger>
                                    <TabsTrigger value="keluarga" className="gap-1.5 py-2">
                                        <Users className="h-4 w-4" />
                                        Data Keluarga
                                    </TabsTrigger>
                                    <TabsTrigger value="akademik" className="gap-1.5 py-2">
                                        <GraduationCap className="h-4 w-4" />
                                        Data Akademik
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 px-6 pb-6 pt-2">
                                {/* TAB: PRIBADI */}
                                <TabsContent value="pribadi" className="space-y-4 m-0 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nis">NIS <span className="text-red-500">*</span></Label>
                                            <Input id="nis" required placeholder="Ex: 202501001" defaultValue={isEdit ? currentRow?.nis : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nisn">NISN <span className="text-red-500">*</span></Label>
                                            <Input id="nisn" required placeholder="Ex: 0101234567" defaultValue={isEdit ? currentRow?.nisn : ''} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="nikSiswa">NIK Siswa <span className="text-red-500">*</span></Label>
                                            <Input id="nikSiswa" required placeholder="16 digit NIK" defaultValue={isEdit ? currentRow?.nikSiswa : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nomorKK">Nomor Kartu Keluarga <span className="text-red-500">*</span></Label>
                                            <Input id="nomorKK" required placeholder="16 digit No. KK" defaultValue={isEdit ? currentRow?.nomorKK : ''} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="namaLengkap">Nama Lengkap <span className="text-red-500">*</span></Label>
                                            <Input id="namaLengkap" required placeholder="Nama lengkap sesuai ijazah/akta" defaultValue={isEdit ? currentRow?.namaLengkap : ''} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="jenisKelamin">Jenis Kelamin <span className="text-red-500">*</span></Label>
                                            <Select required defaultValue={isEdit ? currentRow?.jenisKelamin : undefined}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="L">Laki-laki</SelectItem>
                                                    <SelectItem value="P">Perempuan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tempatLahir">Tempat Lahir <span className="text-red-500">*</span></Label>
                                            <Input id="tempatLahir" required placeholder="Kab/Kota" defaultValue={isEdit ? currentRow?.tempatLahir : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tanggalLahir">Tanggal Lahir <span className="text-red-500">*</span></Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="tanggalLahir"
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !tanggalLahir && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {tanggalLahir
                                                            ? format(tanggalLahir, 'd MMMM yyyy', { locale: idLocale })
                                                            : <span>Pilih tanggal</span>
                                                        }
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={tanggalLahir}
                                                        onSelect={setTanggalLahir}
                                                        captionLayout="dropdown"
                                                        fromYear={1990}
                                                        toYear={2020}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB: ALAMAT */}
                                <TabsContent value="alamat" className="space-y-4 m-0 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="alamat">Alamat Lengkap (Jalan/Dusun) <span className="text-red-500">*</span></Label>
                                        <Input id="alamat" required placeholder="Contoh: Jl. Merdeka No. 10" defaultValue={isEdit ? currentRow?.alamat : ''} />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="rt">RT <span className="text-red-500">*</span></Label>
                                            <Input id="rt" required placeholder="001" defaultValue={isEdit ? currentRow?.rt : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="rw">RW <span className="text-red-500">*</span></Label>
                                            <Input id="rw" required placeholder="002" defaultValue={isEdit ? currentRow?.rw : ''} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="kelurahan">Desa/Kelurahan <span className="text-red-500">*</span></Label>
                                            <Input id="kelurahan" required placeholder="Nama Desa/Kelurahan" defaultValue={isEdit ? currentRow?.kelurahan : ''} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="kecamatan">Kecamatan <span className="text-red-500">*</span></Label>
                                            <Input id="kecamatan" required placeholder="Kecamatan" defaultValue={isEdit ? currentRow?.kecamatan : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="kabKota">Kabupaten/Kota <span className="text-red-500">*</span></Label>
                                            <Input id="kabKota" required placeholder="Kabupaten/Kota" defaultValue={isEdit ? currentRow?.kabKota : ''} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="provinsi">Provinsi <span className="text-red-500">*</span></Label>
                                            <Input id="provinsi" required placeholder="Provinsi" defaultValue={isEdit ? currentRow?.provinsi : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="kodePos">Kode Pos</Label>
                                            <Input id="kodePos" placeholder="Cth: 12345" defaultValue={isEdit ? currentRow?.kodePos : ''} />
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t space-y-2">
                                        <Label htmlFor="nomorHp">Nomor HP / WhatsApp (Aktif) <span className="text-red-500">*</span></Label>
                                        <Input id="nomorHp" required placeholder="08123456789" defaultValue={isEdit ? currentRow?.nomorHp : ''} />
                                    </div>
                                </TabsContent>

                                {/* TAB: KELUARGA */}
                                <TabsContent value="keluarga" className="space-y-6 m-0 mt-4">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm bg-muted/50 p-2 rounded">Data Ayah Kandung</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="namaAyah">Nama Ayah</Label>
                                                <Input id="namaAyah" placeholder="Nama lengkap ayah" defaultValue={isEdit ? currentRow?.namaAyahKandung : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nikAyah">NIK Ayah</Label>
                                                <Input id="nikAyah" placeholder="16 digit NIK" defaultValue={isEdit ? currentRow?.nikAyah : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pekerjaanAyah">Pekerjaan</Label>
                                                <Input id="pekerjaanAyah" placeholder="Pekerjaan ayah" defaultValue={isEdit ? currentRow?.pekerjaanAyah : ''} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status Yatim</Label>
                                            <Select defaultValue="tidak">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih status..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tidak">Tidak</SelectItem>
                                                    <SelectItem value="yatim">Yatim (Ayah meninggal)</SelectItem>
                                                    <SelectItem value="piatu">Piatu (Ibu meninggal)</SelectItem>
                                                    <SelectItem value="yatimpiatu">Yatim-Piatu (Ayah & Ibu meninggal)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm bg-muted/50 p-2 rounded">Data Ibu Kandung</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="namaIbu">Nama Ibu <span className="text-red-500">*</span></Label>
                                                <Input id="namaIbu" required placeholder="Nama lengkap ibu (wajib)" defaultValue={isEdit ? currentRow?.namaIbuKandung : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nikIbu">NIK Ibu</Label>
                                                <Input id="nikIbu" placeholder="16 digit NIK" defaultValue={isEdit ? currentRow?.nikIbu : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pekerjaanIbu">Pekerjaan</Label>
                                                <Input id="pekerjaanIbu" placeholder="Pekerjaan ibu" defaultValue={isEdit ? currentRow?.pekerjaanIbu : ''} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-sm bg-muted/50 p-2 rounded">Data Wali (Opsional)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="namaWali">Nama Wali</Label>
                                                <Input id="namaWali" placeholder="Nama lengkap wali" defaultValue={isEdit ? currentRow?.namaWali : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nikWali">NIK Wali</Label>
                                                <Input id="nikWali" placeholder="16 digit NIK" defaultValue={isEdit ? currentRow?.nikWali : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pekerjaanWali">Pekerjaan</Label>
                                                <Input id="pekerjaanWali" placeholder="Pekerjaan wali" defaultValue={isEdit ? currentRow?.pekerjaanWali : ''} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="teleponWali">Nomor HP Wali</Label>
                                                <Input id="teleponWali" placeholder="08..." defaultValue={isEdit ? currentRow?.teleponWali : ''} />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB: AKADEMIK */}
                                <TabsContent value="akademik" className="space-y-4 m-0 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="asalSekolah">Sekolah Asal</Label>
                                            <Input id="asalSekolah" placeholder="Nama sekolah asal" defaultValue={isEdit ? (currentRow as Record<string, unknown>)?.asalSekolah as string : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="npsnAsalSekolah">NPSN Sekolah Asal</Label>
                                            <Input id="npsnAsalSekolah" placeholder="NPSN sekolah asal" defaultValue={isEdit ? (currentRow as Record<string, unknown>)?.npsnAsalSekolah as string : ''} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="tahunMasuk">Tahun Masuk <span className="text-red-500">*</span></Label>
                                            <Input id="tahunMasuk" required placeholder="Cth: 2025" defaultValue={isEdit ? currentRow?.tahunMasuk : ''} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="kelas">Kelas Awal <span className="text-red-500">*</span></Label>
                                            <Select required defaultValue={isEdit ? currentRow?.kelas : undefined}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Kelas..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="VII-A">VII-A</SelectItem>
                                                    <SelectItem value="VII-B">VII-B</SelectItem>
                                                    <SelectItem value="VII-C">VII-C</SelectItem>
                                                    <SelectItem value="VIII-A">VIII-A</SelectItem>
                                                    <SelectItem value="IX-A">IX-A</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status Aktif <span className="text-red-500">*</span></Label>
                                            <Select defaultValue={isEdit && currentRow?.status ? currentRow.status : "active"} required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih Status..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Aktif</SelectItem>
                                                    <SelectItem value="inactive">Nonaktif</SelectItem>
                                                    <SelectItem value="graduated">Lulus</SelectItem>
                                                    <SelectItem value="transferred">Pindah</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>

                    <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-muted/20">
                        <div className="text-xs text-muted-foreground hidden sm:block">
                            Pastikan data yang diisi sudah valid dan sesuai dengan dokumen asli.
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={loading} className="gap-2">
                                <Save className="h-4 w-4" />
                                {loading ? 'Menyimpan...' : 'Simpan Data'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

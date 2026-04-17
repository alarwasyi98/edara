import { useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'
import { UserCircle, BookOpen, Save, CalendarIcon } from 'lucide-react'
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
import { useTeacher } from './teacher-provider'

export function TeacherAddDialog() {
    const { open, setOpen } = useTeacher()
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('identitas')
    const [tanggalLahir, setTanggalLahir] = useState<Date | undefined>()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        setTimeout(() => {
            toast.success('Data guru baru berhasil ditambahkan!')
            setLoading(false)
            setOpen(null)
            setActiveTab('identitas')
            setTanggalLahir(undefined)
        }, 1000)
    }

    const handleClose = () => {
        setOpen(null)
        setActiveTab('identitas')
        setTanggalLahir(undefined)
    }

    return (
        <Dialog open={open === 'add'} onOpenChange={handleClose}>
            <DialogContent className='max-w-none w-screen h-dvh m-0 p-0 rounded-none border-none flex flex-col sm:max-w-none sm:rounded-none'>
                <form onSubmit={handleSubmit} className='flex flex-col h-full'>
                    <DialogHeader className='px-6 py-4 border-b shrink-0'>
                        <DialogTitle>Tambah Data Guru</DialogTitle>
                        <DialogDescription>
                            Isi formulir berikut untuk menambahkan data tenaga pengajar. Field dengan tanda (*) wajib diisi.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='flex-1 overflow-hidden'>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full flex flex-col'>
                            <div className='px-6 pt-4 shrink-0'>
                                <TabsList variant='line' className='w-full justify-start h-auto flex-wrap'>
                                    <TabsTrigger value='identitas' className='gap-1.5 py-2'>
                                        <UserCircle className='h-4 w-4' />
                                        Identitas
                                    </TabsTrigger>
                                    <TabsTrigger value='profesi' className='gap-1.5 py-2'>
                                        <BookOpen className='h-4 w-4' />
                                        Kontak &amp; Profesi
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className='flex-1 px-6 pb-6 pt-2'>
                                {/* TAB: IDENTITAS */}
                                <TabsContent value='identitas' className='space-y-4 m-0 mt-4'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div className='space-y-2 md:col-span-2'>
                                            <Label htmlFor='g-nip'>NIP <span className='text-red-500'>*</span></Label>
                                            <Input id='g-nip' required placeholder='Cth: 19650101200101001' />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div className='space-y-2 md:col-span-2'>
                                            <Label htmlFor='g-nama'>Nama Lengkap <span className='text-red-500'>*</span></Label>
                                            <Input id='g-nama' required placeholder='Nama lengkap sesuai KTP' />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                        <div className='space-y-2'>
                                            <Label>Jenis Kelamin <span className='text-red-500'>*</span></Label>
                                            <Select required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Pilih...' />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='L'>Laki-laki</SelectItem>
                                                    <SelectItem value='P'>Perempuan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='g-tempat'>Tempat Lahir <span className='text-red-500'>*</span></Label>
                                            <Input id='g-tempat' required placeholder='Kab/Kota' />
                                        </div>
                                        <div className='space-y-2'>
                                            <Label>Tanggal Lahir <span className='text-red-500'>*</span></Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant='outline'
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !tanggalLahir && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                                        {tanggalLahir
                                                            ? format(tanggalLahir, 'd MMMM yyyy', { locale: idLocale })
                                                            : <span>Pilih tanggal</span>
                                                        }
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className='w-auto p-0' align='start'>
                                                    <Calendar
                                                        mode='single'
                                                        selected={tanggalLahir}
                                                        onSelect={setTanggalLahir}
                                                        captionLayout='dropdown'
                                                        fromYear={1950}
                                                        toYear={2005}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* TAB: KONTAK & PROFESI */}
                                <TabsContent value='profesi' className='space-y-4 m-0 mt-4'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label htmlFor='g-telepon'>Nomor HP <span className='text-red-500'>*</span></Label>
                                            <Input id='g-telepon' required placeholder='08xxxxxxxxxx' />
                                        </div>
                                        <div className='space-y-2'>
                                            <Label htmlFor='g-email'>Email</Label>
                                            <Input id='g-email' type='email' placeholder='guru@madrasah.sch.id' />
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label>Mata Pelajaran <span className='text-red-500'>*</span></Label>
                                            <Select required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Pilih mata pelajaran...' />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Al-Quran Hadits','Aqidah Akhlak','Fiqih','SKI','Bahasa Arab','Bahasa Indonesia','Bahasa Inggris','Matematika','IPA','IPS','PKn','Seni Budaya','PJOK','Prakarya','TIK'].map((m) => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label>Pendidikan Terakhir <span className='text-red-500'>*</span></Label>
                                            <Select required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder='Pilih...' />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='D4'>D4</SelectItem>
                                                    <SelectItem value='S1'>S1</SelectItem>
                                                    <SelectItem value='S2'>S2</SelectItem>
                                                    <SelectItem value='S3'>S3</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                        <div className='space-y-2'>
                                            <Label>Status Kepegawaian <span className='text-red-500'>*</span></Label>
                                            <Select defaultValue='active' required>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value='active'>Aktif</SelectItem>
                                                    <SelectItem value='inactive'>Nonaktif</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>

                    <div className='px-6 py-4 border-t shrink-0 flex items-center justify-between bg-muted/20'>
                        <div className='text-xs text-muted-foreground hidden sm:block'>
                            Pastikan data yang diisi sudah valid dan sesuai dengan dokumen asli.
                        </div>
                        <div className='flex gap-2 w-full sm:w-auto justify-end'>
                            <Button type='button' variant='outline' onClick={handleClose} disabled={loading}>
                                Batal
                            </Button>
                            <Button type='submit' disabled={loading} className='gap-2'>
                                <Save className='h-4 w-4' />
                                {loading ? 'Menyimpan...' : 'Simpan Data'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

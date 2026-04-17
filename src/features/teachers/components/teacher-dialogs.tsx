import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Download, Upload } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useTeacher } from './teacher-provider'
import { teachers } from '../data/teachers'

// ─── Import Dialog ────────────────────────────────────────────────────────────
export function TeacherImportDialog() {
    const { open, setOpen } = useTeacher()
    const [file, setFile] = useState<File | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDownloadTemplate = () => {
        const header = 'NIP,Nama Lengkap,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Mata Pelajaran,Pendidikan Terakhir,No. Telepon,Email,Status'
        const example = '196501010001,Ustadz Ahmad Hidayatullah,L,Jakarta,1965-01-01,Fiqih,S2,08123456789,contoh@madrasah.sch.id,active'
        const csv = [header, example].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-import-guru.csv'
        a.click()
    }

    const handleImport = () => {
        if (!file) { toast.error('Pilih file terlebih dahulu.'); return }
        toast.success(`File "${file.name}" berhasil diimpor. (Demo)`)
        setFile(null)
        setOpen(null)
    }

    return (
        <Dialog open={open === 'import'} onOpenChange={() => setOpen(null)}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Import Data Guru</DialogTitle>
                    <DialogDescription>
                        Upload file CSV atau Excel berisi data guru. Pastikan format sesuai template.
                    </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-2'>
                    <Button variant='outline' size='sm' className='w-full gap-2' onClick={handleDownloadTemplate}>
                        <Download className='h-4 w-4' /> Unduh Template (.csv)
                    </Button>
                    <Separator />
                    <div className='space-y-2'>
                        <Label htmlFor='guru-import-file'>File Data Guru</Label>
                        <Input
                            id='guru-import-file'
                            ref={inputRef}
                            type='file'
                            accept='.csv,.xlsx,.xls'
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                        {file && (
                            <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                                <CheckCircle2 className='h-3.5 w-3.5 text-green-500' />
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => setOpen(null)}>Batal</Button>
                    <Button onClick={handleImport} disabled={!file} className='gap-1.5'>
                        <Upload className='h-4 w-4' /> Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Export Dialog ────────────────────────────────────────────────────────────
export function TeacherExportDialog() {
    const { open, setOpen } = useTeacher()
    const [agreed, setAgreed] = useState(false)

    const handleExport = () => {
        const header = 'NIP,Nama Lengkap,L/P,Mata Pelajaran,Pendidikan,Telepon,Email,Status'
        const rows = teachers.map((t) =>
            [t.nip, t.namaLengkap, t.jenisKelamin, t.mataPelajaran, t.pendidikanTerakhir, t.telepon, t.email, t.status].join(',')
        )
        const csv = [header, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-guru-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        toast.success('Data guru berhasil dieksport.')
        setAgreed(false)
        setOpen(null)
    }

    return (
        <Dialog open={open === 'export'} onOpenChange={() => { setAgreed(false); setOpen(null) }}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Eksport Data Guru</DialogTitle>
                    <DialogDescription>
                        Data guru akan diunduh sebagai file CSV.
                    </DialogDescription>
                </DialogHeader>
                <div className='rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30'>
                    <div className='flex items-start gap-2'>
                        <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
                        <p className='text-sm text-amber-800 dark:text-amber-300'>
                            Data guru bersifat <strong>rahasia</strong>. Anda bertanggung jawab atas keamanan dan penggunaan data sesuai ketentuan lembaga.
                        </p>
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    <Checkbox id='guru-export-agree' checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
                    <Label htmlFor='guru-export-agree' className='cursor-pointer text-sm'>
                        Saya memahami dan bertanggung jawab atas data yang dieksport.
                    </Label>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => { setAgreed(false); setOpen(null) }}>Batal</Button>
                    <Button onClick={handleExport} disabled={!agreed} className='gap-1.5'>
                        <Download className='h-4 w-4' /> Unduh CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

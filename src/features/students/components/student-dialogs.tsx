import { useState, useRef } from 'react'
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
import { useStudent } from './student-provider'
import { students } from '../data/students'

// ─── Import Dialog ────────────────────────────────────────────────────────────
export function StudentImportDialog() {
    const { open, setOpen } = useStudent()
    const [file, setFile] = useState<File | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDownloadTemplate = () => {
        // Generate a simple CSV template
        const header = 'NIS,NISN,Nama Lengkap,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Kelas,Tahun Masuk,Status,Nama Wali,Telepon Wali,Alamat'
        const example = '202501001,1234567890,Ahmad Fauzan,L,Jakarta,2012-05-15,VII-A,2025,active,Budi Santoso,081234567890,Jl. Contoh No. 1 Jakarta'
        const csv = [header, example].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-import-siswa.csv'
        a.click()
    }

    const handleImport = () => {
        if (!file) {
            toast.error('Pilih file terlebih dahulu.')
            return
        }
        // Simulate import
        toast.success(`File "${file.name}" berhasil diimpor. (Demo)`)
        setFile(null)
        setOpen(null)
    }

    return (
        <Dialog open={open === 'import'} onOpenChange={() => setOpen(null)}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Import Data Siswa</DialogTitle>
                    <DialogDescription>
                        Upload file CSV atau Excel berisi data siswa. Pastikan format sesuai template.
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-2'>
                    <Button
                        variant='outline'
                        size='sm'
                        className='w-full gap-2'
                        onClick={handleDownloadTemplate}
                    >
                        <Download className='h-4 w-4' />
                        Unduh Template (.csv)
                    </Button>

                    <Separator />

                    <div className='space-y-2'>
                        <Label htmlFor='import-file'>File Data Siswa</Label>
                        <Input
                            id='import-file'
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
export function StudentExportDialog() {
    const { open, setOpen } = useStudent()
    const [agreed, setAgreed] = useState(false)

    const handleExport = () => {
        // Build CSV from mock students
        const header = 'NIS,NISN,Nama Lengkap,L/P,Kelas,Status,Nama Wali,Telepon Wali'
        const rows = students.map((s) =>
            [s.nis, s.nisn, s.namaLengkap, s.jenisKelamin, s.kelas, s.status, s.namaWali, s.teleponWali].join(',')
        )
        const csv = [header, ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-siswa-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        toast.success('Data siswa berhasil dieksport.')
        setAgreed(false)
        setOpen(null)
    }

    return (
        <Dialog open={open === 'export'} onOpenChange={() => { setAgreed(false); setOpen(null) }}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Eksport Data Siswa</DialogTitle>
                    <DialogDescription>
                        Data siswa akan diunduh sebagai file CSV. Pastikan Anda memahami kebijakan privasi data.
                    </DialogDescription>
                </DialogHeader>

                <div className='rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30'>
                    <div className='flex items-start gap-2'>
                        <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
                        <p className='text-sm text-amber-800 dark:text-amber-300'>
                            Data siswa bersifat <strong>rahasia</strong>. Anda bertanggung jawab penuh atas keamanan data yang diunduh dan penggunaannya sesuai ketentuan lembaga.
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-3'>
                    <Checkbox
                        id='export-agree'
                        checked={agreed}
                        onCheckedChange={(v) => setAgreed(!!v)}
                    />
                    <Label htmlFor='export-agree' className='cursor-pointer text-sm'>
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

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────
export function StudentDeleteDialog() {
    const { open, setOpen, currentRow, setCurrentRow } = useStudent()
    const [loading, setLoading] = useState(false)

    const handleClose = () => {
        setOpen(null)
        setTimeout(() => setCurrentRow(null), 300)
    }

    const handleDelete = () => {
        setLoading(true)
        // Simulate async delete
        setTimeout(() => {
            toast.success(`Siswa "${currentRow?.namaLengkap}" berhasil dihapus. (Demo)`)
            setLoading(false)
            handleClose()
        }, 600)
    }

    return (
        <Dialog open={open === 'delete'} onOpenChange={handleClose}>
            <DialogContent className='sm:max-w-sm'>
                <DialogHeader>
                    <DialogTitle>Hapus Siswa</DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Data siswa{' '}
                        <strong>{currentRow?.namaLengkap}</strong> akan dihapus secara permanen.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant='outline' onClick={handleClose} disabled={loading}>Batal</Button>
                    <Button variant='destructive' onClick={handleDelete} disabled={loading}>
                        {loading ? 'Menghapus...' : 'Ya, Hapus'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

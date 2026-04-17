import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { teachers } from '@/features/teachers/data/teachers'

type Kelas = {
    id: string
    namaKelas: string
    jenjang: 'VII' | 'VIII' | 'IX'
    waliKelas: string
    jumlahSiswa: number
    kapasitas: number
    tahunAjaran: string
}

type ClassesDialogMode = 'add' | 'edit'

interface ClassesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: ClassesDialogMode
    initialData?: Kelas
    onSave: (data: Omit<Kelas, 'id' | 'jumlahSiswa'>) => void
}

export function ClassesDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    onSave,
}: ClassesDialogProps) {
    const [namaKelas, setNamaKelas] = useState(initialData?.namaKelas ?? '')
    const [jenjang, setJenjang] = useState<'VII' | 'VIII' | 'IX'>(
        initialData?.jenjang ?? 'VII'
    )
    const [waliKelas, setWaliKelas] = useState(initialData?.waliKelas ?? '')
    const [kapasitas, setKapasitas] = useState(
        String(initialData?.kapasitas ?? 35)
    )

    // Reset form when dialog opens
    React.useEffect(() => {
        if (open) {
            setNamaKelas(initialData?.namaKelas ?? '')
            setJenjang(initialData?.jenjang ?? 'VII')
            setWaliKelas(initialData?.waliKelas ?? '')
            setKapasitas(String(initialData?.kapasitas ?? 35))
        }
    }, [open, initialData])

    const handleSave = () => {
        if (!namaKelas.trim() || !waliKelas.trim()) {
            toast.error('Lengkapi nama kelas dan wali kelas.')
            return
        }
        onSave({
            namaKelas: namaKelas.trim(),
            jenjang,
            waliKelas: waliKelas.trim(),
            kapasitas: Number(kapasitas) || 35,
            tahunAjaran: '2025/2026',
        })
        onOpenChange(false)
        toast.success(
            mode === 'add'
                ? `Kelas ${namaKelas} berhasil ditambahkan. (Demo)`
                : `Kelas ${namaKelas} berhasil diperbarui. (Demo)`
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' ? 'Tambah Kelas' : 'Edit Kelas'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'add'
                            ? 'Isi informasi kelas baru untuk tahun ajaran 2025/2026.'
                            : 'Perbarui informasi kelas yang dipilih.'}
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-2'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='space-y-1.5'>
                            <Label htmlFor='kelas-nama'>Nama Kelas</Label>
                            <Input
                                id='kelas-nama'
                                placeholder='cth. VII-A'
                                value={namaKelas}
                                onChange={(e) => setNamaKelas(e.target.value)}
                            />
                        </div>
                        <div className='space-y-1.5'>
                            <Label>Jenjang</Label>
                            <Select
                                value={jenjang}
                                onValueChange={(v) => setJenjang(v as 'VII' | 'VIII' | 'IX')}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='VII'>Kelas VII</SelectItem>
                                    <SelectItem value='VIII'>Kelas VIII</SelectItem>
                                    <SelectItem value='IX'>Kelas IX</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <Label htmlFor='kelas-wali'>Wali Kelas</Label>
                        <Select
                            value={waliKelas}
                            onValueChange={setWaliKelas}
                        >
                            <SelectTrigger id='kelas-wali'>
                                <SelectValue placeholder='Pilih wali kelas...' />
                            </SelectTrigger>
                            <SelectContent className='max-h-64'>
                                {teachers
                                    .filter((t) => t.status === 'active')
                                    .map((t) => (
                                        <SelectItem key={t.id} value={t.namaLengkap}>
                                            {t.namaLengkap}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='space-y-1.5'>
                        <Label htmlFor='kelas-kapasitas'>Kapasitas Siswa</Label>
                        <Input
                            id='kelas-kapasitas'
                            type='number'
                            min={1}
                            max={50}
                            value={kapasitas}
                            onChange={(e) => setKapasitas(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSave}>
                        {mode === 'add' ? 'Tambah Kelas' : 'Simpan Perubahan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

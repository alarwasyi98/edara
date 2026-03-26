import React, { useState } from 'react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type TahunAjaranItem = {
    id: string
    nama: string
    mulai: string
    selesai: string
    semester: string
    status: 'active' | 'completed' | 'upcoming'
    keterangan?: string
}

type TahunAjaranDialogMode = 'add' | 'edit'

interface TahunAjaranDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: TahunAjaranDialogMode
    initialData?: TahunAjaranItem
    onSave: (data: Omit<TahunAjaranItem, 'id'>) => void
}

// Helper to parse date string "15 Juli 2025" → Date
function parseDateStr(str: string): Date | undefined {
    if (!str) return undefined
    const d = new Date(str)
    return isNaN(d.getTime()) ? undefined : d
}

export function TahunAjaranDialog({
    open,
    onOpenChange,
    mode,
    initialData,
    onSave,
}: TahunAjaranDialogProps) {
    const [nama, setNama] = useState(initialData?.nama ?? '')
    const [mulai, setMulai] = useState<Date | undefined>(parseDateStr(initialData?.mulai ?? ''))
    const [selesai, setSelesai] = useState<Date | undefined>(parseDateStr(initialData?.selesai ?? ''))
    const [status, setStatus] = useState<TahunAjaranItem['status']>(
        initialData?.status ?? 'upcoming'
    )
    const [keterangan, setKeterangan] = useState(initialData?.keterangan ?? '')

    React.useEffect(() => {
        if (open) {
            setNama(initialData?.nama ?? '')
            setMulai(parseDateStr(initialData?.mulai ?? ''))
            setSelesai(parseDateStr(initialData?.selesai ?? ''))
            setStatus(initialData?.status ?? 'upcoming')
            setKeterangan(initialData?.keterangan ?? '')
        }
    }, [open, initialData])

    const handleSave = () => {
        if (!nama.trim() || !mulai || !selesai) {
            toast.error('Lengkapi nama, tanggal mulai, dan tanggal selesai.')
            return
        }
        onSave({
            nama: nama.trim(),
            mulai: format(mulai, 'd MMMM yyyy', { locale: idLocale }),
            selesai: format(selesai, 'd MMMM yyyy', { locale: idLocale }),
            semester: status === 'active' ? 'Genap (Jan–Jun)' : 'Belum ditentukan',
            status,
            keterangan: keterangan.trim() || undefined,
        })
        onOpenChange(false)
        toast.success(
            mode === 'add'
                ? `Tahun ajaran ${nama} berhasil ditambahkan. (Demo)`
                : `Tahun ajaran ${nama} berhasil diperbarui. (Demo)`
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'add' ? 'Tambah Tahun Ajaran' : 'Edit Tahun Ajaran'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'add'
                            ? 'Daftarkan tahun ajaran baru.'
                            : 'Perbarui informasi tahun ajaran yang dipilih.'}
                    </DialogDescription>
                </DialogHeader>

                <div className='space-y-4 py-2'>
                    <div className='space-y-1.5'>
                        <Label htmlFor='ta-nama'>Nama Tahun Ajaran</Label>
                        <Input
                            id='ta-nama'
                            placeholder='cth. 2026/2027'
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                        />
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                        {/* Tanggal Mulai */}
                        <div className='space-y-1.5'>
                            <Label>Tanggal Mulai</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant='outline'
                                        className={cn(
                                            'w-full justify-start text-left font-normal text-sm',
                                            !mulai && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className='mr-2 h-4 w-4 shrink-0' />
                                        {mulai
                                            ? format(mulai, 'd MMM yyyy', { locale: idLocale })
                                            : 'Pilih tanggal'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                        mode='single'
                                        selected={mulai}
                                        onSelect={setMulai}
                                        captionLayout='dropdown'
                                        fromYear={2020}
                                        toYear={2035}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Tanggal Selesai */}
                        <div className='space-y-1.5'>
                            <Label>Tanggal Selesai</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant='outline'
                                        className={cn(
                                            'w-full justify-start text-left font-normal text-sm',
                                            !selesai && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className='mr-2 h-4 w-4 shrink-0' />
                                        {selesai
                                            ? format(selesai, 'd MMM yyyy', { locale: idLocale })
                                            : 'Pilih tanggal'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className='w-auto p-0' align='start'>
                                    <Calendar
                                        mode='single'
                                        selected={selesai}
                                        onSelect={setSelesai}
                                        captionLayout='dropdown'
                                        fromYear={2020}
                                        toYear={2035}
                                        disabled={mulai ? { before: mulai } : undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(v) =>
                                setStatus(v as TahunAjaranItem['status'])
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='active'>Aktif</SelectItem>
                                <SelectItem value='upcoming'>Mendatang</SelectItem>
                                <SelectItem value='completed'>Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='space-y-1.5'>
                        <Label htmlFor='ta-keterangan'>Keterangan (opsional)</Label>
                        <Input
                            id='ta-keterangan'
                            placeholder='cth. Sedang berjalan'
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button onClick={handleSave}>
                        {mode === 'add' ? 'Tambah' : 'Simpan Perubahan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

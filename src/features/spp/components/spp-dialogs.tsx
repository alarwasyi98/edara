import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Download, Upload, CalendarIcon } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

export function SppImportDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [file, setFile] = useState<File | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleDownloadTemplate = () => {
        const header = 'NIS,Nama Siswa,Kelas,Bulan,Nominal Tagihan,Terbayar,Status,Tanggal Bayar'
        const example = '202501001,Ahmad Rizki F.,VII-A,2026-01,750000,750000,paid,2026-01-10'
        const csv = [header, example].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'template-import-spp.csv'
        a.click()
    }

    const handleImport = () => {
        if (!file) {
            toast.error('Pilih file terlebih dahulu.')
            return
        }
        toast.success(`File "${file.name}" berhasil diimpor. (Demo)`)
        setFile(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) setFile(null); onOpenChange(v); }}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Import Data Pembayaran SPP</DialogTitle>
                    <DialogDescription>
                        Upload file CSV atau Excel berisi histori pembayaran SPP siswa. Pastikan format sesuai template.
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
                        <Label htmlFor='import-file'>File Data SPP</Label>
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
                    <Button variant='outline' onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleImport} disabled={!file} className='gap-1.5'>
                        <Upload className='h-4 w-4' /> Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function SppExportDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
    const [agreed, setAgreed] = useState(false)
    const [dateFrom, setDateFrom] = useState<Date>()
    const [dateTo, setDateTo] = useState<Date>()

    const handleExport = () => {
        const header = 'ID,Nama Siswa,Kelas,Bulan,Tagihan,Dibayar,Status,Tanggal Bayar'
        const csv = [header, "mock-export-data"].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `data-spp-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        toast.success(`Data pembayaran SPP berhasil dieksport.`)
        setAgreed(false)
        setDateFrom(undefined)
        setDateTo(undefined)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { 
                if (!v) { setAgreed(false); setDateFrom(undefined); setDateTo(undefined); } 
                onOpenChange(v) 
            }}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Eksport Data SPP</DialogTitle>
                    <DialogDescription>
                        Pilih rentang tanggal untuk meminimalisir penurunan performa akibat besarnya data.
                    </DialogDescription>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 flex flex-col">
                            <Label>Dari Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateFrom && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFrom ? formatDate(dateFrom) : <span>Pilih</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={setDateFrom}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <Label>Hingga Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !dateTo && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateTo ? formatDate(dateTo) : <span>Pilih</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={setDateTo}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className='rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30'>
                        <div className='flex items-start gap-2'>
                            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
                            <p className='text-sm text-amber-800 dark:text-amber-300'>
                                Data pembayaran bersifat sensitif. Anda bertanggung jawab penuh atas keamanan data yang dieksport.
                            </p>
                        </div>
                    </div>

                    <div className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                        <Checkbox
                            id='export-agree'
                            checked={agreed}
                            onCheckedChange={(v) => setAgreed(!!v)}
                        />
                        <div className="space-y-1 leading-none">
                            <Label htmlFor='export-agree' className='cursor-pointer text-sm font-medium'>
                                Konfirmasi eksport data
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Saya memahami dan bertanggung jawab atas data yang dieksport.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>Batal</Button>
                    <Button onClick={handleExport} disabled={!agreed || !dateFrom || !dateTo} className='gap-1.5'>
                        <Download className='h-4 w-4' /> Eksport
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

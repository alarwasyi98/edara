import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PpdbDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PpdbDialog({ open, onOpenChange }: PpdbDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Tambah Pendaftar Baru</DialogTitle>
                    <DialogDescription>
                        Masukkan data ringkas calon peserta didik baru.
                    </DialogDescription>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                    <div className='grid gap-2'>
                        <Label htmlFor='nama'>Nama Lengkap</Label>
                        <Input id='nama' placeholder='Contoh: Ahmad Rizki' />
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor='asal-sekolah'>Asal Sekolah</Label>
                        <Input id='asal-sekolah' placeholder='Contoh: SDN 01 Jakarta' />
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor='nilai'>Nilai Rata-rata</Label>
                        <Input id='nilai' type='number' placeholder='80.5' />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type='submit' onClick={() => onOpenChange(false)}>Selanjutnya</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

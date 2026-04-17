import { FileText, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TabDokumen() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                    <FileText className='h-4 w-4' /> Dokumen Siswa
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <div className='mb-4 rounded-full bg-muted p-4'>
                        <Upload className='h-8 w-8 text-muted-foreground' />
                    </div>
                    <h3 className='text-lg font-semibold'>Fitur Dokumen</h3>
                    <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
                        Fitur pengelolaan dokumen siswa (KTP, KK, Akta
                        Kelahiran, Ijazah, dll) akan segera hadir.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

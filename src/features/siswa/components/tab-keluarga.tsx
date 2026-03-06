import { Users, UserCircle, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPhone } from '@/lib/format'
import { type Student } from '../data/schema'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className='text-xs text-muted-foreground'>{label}</p>
            <p className='font-medium'>{value || '-'}</p>
        </div>
    )
}

interface TabKeluargaProps {
    siswa: Student
}

export function TabKeluarga({ siswa }: TabKeluargaProps) {
    return (
        <div className='grid gap-4 md:grid-cols-2'>
            {/* Ibu Kandung */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <UserCircle className='h-4 w-4' /> Data Ibu Kandung
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4'>
                        <Field label='Nama Ibu Kandung' value={siswa.namaIbuKandung} />
                        <Field label='NIK Ibu' value={<span className='font-mono'>{siswa.nikIbu}</span>} />
                        <Field label='Pekerjaan Ibu' value={siswa.pekerjaanIbu} />
                    </div>
                </CardContent>
            </Card>

            {/* Ayah Kandung */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <UserCircle className='h-4 w-4' /> Data Ayah Kandung
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4'>
                        <Field label='Nama Ayah Kandung' value={siswa.namaAyahKandung} />
                        <Field label='NIK Ayah' value={<span className='font-mono'>{siswa.nikAyah}</span>} />
                        <Field label='Pekerjaan Ayah' value={siswa.pekerjaanAyah} />
                    </div>
                </CardContent>
            </Card>

            {/* Wali */}
            <Card className='md:col-span-2'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <Users className='h-4 w-4' /> Data Wali
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                        <Field label='Nama Wali' value={siswa.namaWali} />
                        <Field label='NIK Wali' value={<span className='font-mono'>{siswa.nikWali}</span>} />
                        <Field label='Pekerjaan Wali' value={siswa.pekerjaanWali} />
                        <Field
                            label='No. Telepon Wali'
                            value={
                                <span className='flex items-center gap-1.5'>
                                    <Phone className='h-3.5 w-3.5 text-muted-foreground' />
                                    {formatPhone(siswa.teleponWali)}
                                </span>
                            }
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

import { GraduationCap, CalendarDays, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateShort } from '@/lib/format'
import { cn } from '@/lib/utils'
import { statusColorMap, statusOptions } from '../data/data'
import { type Student } from '../data/schema'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <p className='text-xs text-muted-foreground'>{label}</p>
            <p className='font-medium'>{value || '-'}</p>
        </div>
    )
}

interface TabAkademikProps {
    siswa: Student
}

export function TabAkademik({ siswa }: TabAkademikProps) {
    const statusColor = statusColorMap.get(siswa.status)
    const statusLabel =
        statusOptions.find((s) => s.value === siswa.status)?.label ??
        siswa.status

    return (
        <div className='grid gap-4 md:grid-cols-2'>
            {/* Info Akademik */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <GraduationCap className='h-4 w-4' /> Informasi
                        Akademik
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-4'>
                        <Field
                            label='NIS'
                            value={
                                <span className='font-mono'>
                                    {siswa.nis}
                                </span>
                            }
                        />
                        <Field
                            label='NISN'
                            value={
                                <span className='font-mono'>
                                    {siswa.nisn}
                                </span>
                            }
                        />
                        <Field
                            label='Sekolah Asal'
                            value={(siswa as Student & { asalSekolah?: string }).asalSekolah || '-'}
                        />
                        <Field
                            label='NPSN Sekolah Asal'
                            value={(siswa as Student & { npsnAsalSekolah?: string }).npsnAsalSekolah || '-'}
                        />
                        <Field
                            label='Kelas'
                            value={
                                <Badge variant='outline'>
                                    {siswa.kelas}
                                </Badge>
                            }
                        />
                        <Field
                            label='Tahun Masuk'
                            value={siswa.tahunMasuk}
                        />
                        <Field
                            label='Status'
                            value={
                                <Badge
                                    variant='outline'
                                    className={cn(statusColor)}
                                >
                                    {statusLabel}
                                </Badge>
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Riwayat Data */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <CalendarDays className='h-4 w-4' /> Riwayat Data
                    </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                    <Field
                        label='Terdaftar pada'
                        value={formatDateShort(siswa.createdAt)}
                    />
                    <Field
                        label='Terakhir diperbarui'
                        value={formatDateShort(siswa.updatedAt)}
                    />
                </CardContent>
            </Card>

            {/* Placeholder: Nilai */}
            <Card className='md:col-span-2'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-base'>
                        <BookOpen className='h-4 w-4' /> Nilai & Rapor
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col items-center justify-center py-8 text-center'>
                        <div className='mb-4 rounded-full bg-muted p-4'>
                            <BookOpen className='h-8 w-8 text-muted-foreground' />
                        </div>
                        <h3 className='text-lg font-semibold'>
                            Fitur Nilai & Rapor
                        </h3>
                        <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
                            Fitur pengelolaan nilai dan rapor siswa akan
                            segera hadir.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

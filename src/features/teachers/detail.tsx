import { notFound, useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, UserCircle, Phone, Mail, BookOpen, CalendarDays, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { formatDateShort, formatPhone } from '@/lib/format'
import { cn } from '@/lib/utils'
import { teachers } from './data/teachers'

const genderFullLabel: Record<'L' | 'P', string> = {
    L: 'Laki-laki',
    P: 'Perempuan',
}

export function DetailTeacher() {
    const { id } = useParams({ from: '/_authenticated/teachers/$id' })
    const guru = teachers.find((t) => t.id === id)

    if (!guru) throw notFound()

    const isActive = guru.status === 'active'

    return (
        <>
            <Header fixed>
                <Search />
                <div className='ms-auto flex items-center space-x-4'>
                    <ThemeSwitch />
                    <ConfigDrawer />
                    <ProfileDropdown />
                </div>
            </Header>

            <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
                <div className='flex items-center gap-3'>
                    <Button variant='ghost' size='icon' asChild>
                        <Link to='/teachers'>
                            <ArrowLeft className='h-4 w-4' />
                        </Link>
                    </Button>
                    <div>
                        <h2 className='text-2xl font-bold tracking-tight'>{guru.namaLengkap}</h2>
                        <p className='text-sm text-muted-foreground'>NIP: {guru.nip}</p>
                    </div>
                    <Badge
                        variant='outline'
                        className={cn(
                            'ml-auto',
                            isActive
                                ? 'bg-green-100/30 text-green-800 dark:text-green-200 border-green-200'
                                : 'bg-neutral-300/40 border-neutral-300'
                        )}
                    >
                        {isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <UserCircle className='h-4 w-4' /> Identitas Pribadi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Nama Lengkap</p>
                                    <p className='font-medium'>{guru.namaLengkap}</p>
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Jenis Kelamin</p>
                                    <p className='font-medium'>{genderFullLabel[guru.jenisKelamin]}</p>
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Tempat Lahir</p>
                                    <p className='font-medium'>{guru.tempatLahir}</p>
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Tanggal Lahir</p>
                                    <p className='font-medium'>{formatDateShort(guru.tanggalLahir)}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-xs text-muted-foreground'>No. Telepon</p>
                                    <p className='flex items-center gap-1.5 font-medium'>
                                        <Phone className='h-3.5 w-3.5 text-muted-foreground' />
                                        {formatPhone(guru.telepon)}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Email</p>
                                    <p className='flex items-center gap-1.5 font-medium truncate'>
                                        <Mail className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
                                        {guru.email}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <BookOpen className='h-4 w-4' /> Informasi Mengajar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-xs text-muted-foreground'>NIP</p>
                                    <p className='font-mono text-sm font-medium'>{guru.nip}</p>
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Mata Pelajaran</p>
                                    <Badge variant='outline'>{guru.mataPelajaran}</Badge>
                                </div>
                            </div>
                            <Separator />
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Pendidikan Terakhir</p>
                                    <p className='flex items-center gap-1.5 font-medium'>
                                        <Award className='h-3.5 w-3.5 text-muted-foreground' />
                                        {guru.pendidikanTerakhir}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-xs text-muted-foreground'>Status Kepegawaian</p>
                                    <Badge
                                        variant='outline'
                                        className={cn(
                                            isActive
                                                ? 'bg-green-100/30 text-green-800 dark:text-green-200 border-green-200'
                                                : 'bg-neutral-300/40 border-neutral-300'
                                        )}
                                    >
                                        {isActive ? 'Aktif' : 'Nonaktif'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-base'>
                                <CalendarDays className='h-4 w-4' /> Riwayat Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className='space-y-3'>
                            <div>
                                <p className='text-xs text-muted-foreground'>Terdaftar pada</p>
                                <p className='font-medium'>{formatDateShort(guru.createdAt)}</p>
                            </div>
                            <div>
                                <p className='text-xs text-muted-foreground'>Terakhir diperbarui</p>
                                <p className='font-medium'>{formatDateShort(guru.updatedAt)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    )
}

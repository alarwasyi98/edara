import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { orpc } from '@/lib/orpc-react'
import type { AcademicYearRecord } from '../types'

type DialogMode = 'add' | 'edit'

interface TahunAjaranDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: DialogMode
    initialData?: AcademicYearRecord
}

const formSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Nama tahun ajaran wajib diisi')
        .max(20, 'Nama tahun ajaran maksimal 20 karakter')
        .regex(/^\d{4}\/\d{4}$/, 'Format nama harus YYYY/YYYY (contoh: 2024/2025)'),
    startDate: z.date({ required_error: 'Tanggal mulai wajib diisi' }),
    endDate: z.date({ required_error: 'Tanggal selesai wajib diisi' }),
}).refine(
    (data) => data.startDate < data.endDate,
    { message: 'Tanggal mulai harus sebelum tanggal selesai', path: ['startDate'] },
)

type FormValues = z.infer<typeof formSchema>

export function TahunAjaranDialog({
    open,
    onOpenChange,
    mode,
    initialData,
}: TahunAjaranDialogProps) {
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            startDate: undefined,
            endDate: undefined,
        },
    })

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                form.reset({
                    name: initialData.name,
                    startDate: new Date(initialData.startDate),
                    endDate: new Date(initialData.endDate),
                })
            } else {
                form.reset({ name: '', startDate: undefined, endDate: undefined })
            }
        }
    }, [open, mode, initialData, form])

    const createMutation = useMutation(
        orpc.tenant.academicYears.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: orpc.tenant.academicYears.list.key() })
                toast.success('Tahun ajaran berhasil ditambahkan.')
                onOpenChange(false)
            },
            onError: (error) => {
                toast.error(error.message || 'Gagal menambahkan tahun ajaran.')
            },
        })
    )

    const updateMutation = useMutation(
        orpc.tenant.academicYears.update.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: orpc.tenant.academicYears.list.key() })
                toast.success('Tahun ajaran berhasil diperbarui.')
                onOpenChange(false)
            },
            onError: (error) => {
                toast.error(error.message || 'Gagal memperbarui tahun ajaran.')
            },
        })
    )

    const isPending = createMutation.isPending || updateMutation.isPending

    function onSubmit(values: FormValues) {
        const payload = {
            name: values.name,
            startDate: format(values.startDate, 'yyyy-MM-dd'),
            endDate: format(values.endDate, 'yyyy-MM-dd'),
        }

        if (mode === 'add') {
            createMutation.mutate(payload)
        } else if (initialData) {
            updateMutation.mutate({ id: initialData.id, ...payload })
        }
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

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 py-2'>
                        <FormField
                            control={form.control}
                            name='name'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Tahun Ajaran</FormLabel>
                                    <FormControl>
                                        <Input placeholder='cth. 2026/2027' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className='grid grid-cols-2 gap-4'>
                            <FormField
                                control={form.control}
                                name='startDate'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal Mulai</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant='outline'
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal text-sm',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        <CalendarIcon className='mr-2 h-4 w-4 shrink-0' />
                                                        {field.value
                                                            ? format(field.value, 'd MMM yyyy', { locale: idLocale })
                                                            : 'Pilih tanggal'}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className='w-auto p-0' align='start'>
                                                <Calendar
                                                    mode='single'
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    captionLayout='dropdown'
                                                    fromYear={2020}
                                                    toYear={2035}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='endDate'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tanggal Selesai</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant='outline'
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal text-sm',
                                                            !field.value && 'text-muted-foreground'
                                                        )}
                                                    >
                                                        <CalendarIcon className='mr-2 h-4 w-4 shrink-0' />
                                                        {field.value
                                                            ? format(field.value, 'd MMM yyyy', { locale: idLocale })
                                                            : 'Pilih tanggal'}
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className='w-auto p-0' align='start'>
                                                <Calendar
                                                    mode='single'
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    captionLayout='dropdown'
                                                    fromYear={2020}
                                                    toYear={2035}
                                                    disabled={form.watch('startDate') ? { before: form.watch('startDate') } : undefined}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isPending}>
                                Batal
                            </Button>
                            <Button type='submit' disabled={isPending}>
                                {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                                {mode === 'add' ? 'Tambah' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

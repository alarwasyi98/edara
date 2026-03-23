import * as React from 'react'
import { Check, ChevronsUpDown, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MOCK_STUDENTS, getInitials, getAvatarColor } from '../data/mock-data'
import type { Student } from '../types'

interface StudentSearchProps {
    value: Student | null
    onChange: (student: Student | null) => void
}

export function StudentSearch({ value, onChange }: StudentSearchProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')

    const filtered = React.useMemo<Student[]>(() => {
        if (!query || query.length < 1) return MOCK_STUDENTS
        const q = query.toLowerCase()
        return MOCK_STUDENTS.filter(
            s =>
                s.nama.toLowerCase().includes(q) ||
                s.nis.includes(q) ||
                s.kelas.toLowerCase().includes(q)
        ).slice(0, 10)
    }, [query])

    const handleSelect = (student: Student) => {
        onChange(student)
        setOpen(false)
        setQuery('')
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
    }

    // Selected state — card ringkas dengan avatar initials
    if (value) {
        return (
            <div className='flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2.5'>
                <Avatar className='h-9 w-9 shrink-0'>
                    <AvatarFallback
                        className={cn(
                            'text-xs font-semibold text-white',
                            getAvatarColor(value.nama)
                        )}
                    >
                        {getInitials(value.nama)}
                    </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                    <p className='font-medium text-sm leading-tight truncate'>{value.nama}</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                        {value.kelas} · NIS {value.nis}
                    </p>
                </div>
                <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground'
                    onClick={handleClear}
                    aria-label='Ganti siswa'
                >
                    <X className='h-3.5 w-3.5' />
                </Button>
            </div>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    className='w-full justify-between font-normal text-muted-foreground'
                >
                    <span className='flex items-center gap-2'>
                        <UserRound className='h-4 w-4' />
                        Cari nama atau NIS siswa...
                    </span>
                    <ChevronsUpDown className='h-4 w-4 opacity-50' />
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-(--radix-popover-trigger-width) p-0' align='start'>
                <Command>
                    <CommandInput
                        placeholder='Ketik nama, NIS, atau kelas...'
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className='py-4 text-center text-sm text-muted-foreground'>
                                Siswa tidak ditemukan.
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading={`${filtered.length} siswa ditemukan`}>
                            {filtered.map(student => (
                                <CommandItem
                                    key={student.id}
                                    value={`${student.nama} ${student.nis} ${student.kelas}`}
                                    onSelect={() => handleSelect(student)}
                                    className='flex items-center gap-2.5 py-2'
                                >
                                    <Avatar className='h-7 w-7 shrink-0'>
                                        <AvatarFallback
                                            className={cn(
                                                'text-[10px] font-bold text-white',
                                                getAvatarColor(student.nama)
                                            )}
                                        >
                                            {getInitials(student.nama)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex-1 min-w-0'>
                                        <p className='text-sm font-medium leading-tight truncate'>
                                            {student.nama}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>
                                            {student.kelas} · NIS {student.nis}
                                        </p>
                                    </div>
                                    <Badge variant='outline' className='text-xs shrink-0'>
                                        {student.kelas}
                                    </Badge>
                                    {value?.id === student.id && (
                                        <Check className='h-4 w-4 text-primary shrink-0' />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

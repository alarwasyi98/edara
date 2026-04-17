import { useState } from 'react'
import {
    addMonths,
    subMonths,
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    isSameMonth,
    isToday,
} from 'date-fns'
import { id } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { categoryColorMap } from '../data/data'
import { type CalendarEvent } from '../data/schema'

interface EventCalendarProps {
    events: CalendarEvent[]
}

export function EventCalendar({ events }: EventCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const goToToday = () => setCurrentDate(new Date())

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const dateFormat = 'd'
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

    const getEventsForDay = (day: Date) => {
        return events.filter((event) => {
            const eventStart = new Date(event.startDate).setHours(0, 0, 0, 0)
            const eventEnd = event.endDate
                ? new Date(event.endDate).setHours(0, 0, 0, 0)
                : eventStart
            const currentDay = day.setHours(0, 0, 0, 0)

            return currentDay >= eventStart && currentDay <= eventEnd
        })
    }

    return (
        <div className='flex flex-col space-y-4 rounded-md border bg-card text-card-foreground shadow-sm'>
            <div className='flex items-center justify-between border-b p-4'>
                <div className='flex items-center space-x-4'>
                    <h2 className='text-lg font-semibold capitalize'>
                        {format(currentDate, 'MMMM yyyy', { locale: id })}
                    </h2>
                </div>
                <div className='flex items-center space-x-2'>
                    <Button variant='outline' size='sm' onClick={goToToday}>
                        Hari Ini
                    </Button>
                    <Button variant='outline' size='icon' onClick={prevMonth}>
                        <ChevronLeft className='size-4' />
                    </Button>
                    <Button variant='outline' size='icon' onClick={nextMonth}>
                        <ChevronRight className='size-4' />
                    </Button>
                </div>
            </div>

            <div className='p-4 pt-0'>
                <div className='grid grid-cols-7 gap-px rounded-md border bg-border'>
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className='bg-muted/50 py-2 text-center text-sm font-medium text-muted-foreground'
                        >
                            {day}
                        </div>
                    ))}

                    {days.map((day) => {
                        const dayEvents = getEventsForDay(day)
                        const isCurrentMonth = isSameMonth(day, monthStart)
                        const isCurrentDay = isToday(day)

                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    'min-h-[120px] bg-background p-2 transition-colors hover:bg-muted/50',
                                    !isCurrentMonth && 'bg-muted/30 text-muted-foreground'
                                )}
                            >
                                <div className='flex items-center justify-between'>
                                    <span
                                        className={cn(
                                            'flex size-7 items-center justify-center rounded-full text-sm',
                                            isCurrentDay &&
                                            'bg-primary font-semibold text-primary-foreground'
                                        )}
                                    >
                                        {format(day, dateFormat)}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <span className='text-[10px] font-medium text-muted-foreground xl:hidden'>
                                            {dayEvents.length} kegiatan
                                        </span>
                                    )}
                                </div>

                                <div className='mt-2 flex flex-col gap-1'>
                                    {dayEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            title={event.title}
                                            className={cn(
                                                'truncate rounded border px-1.5 py-0.5 text-xs',
                                                categoryColorMap.get(event.category)
                                            )}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

import { Download, ExternalLink, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type CalendarEvent } from '../data/schema'
import { format } from 'date-fns'

interface CalendarExportProps {
    events: CalendarEvent[]
}

export function CalendarExport({ events }: CalendarExportProps) {
    // Generate iCal format (.ics)
    const generateICS = () => {
        let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UI-MS//Kalender Kegiatan//ID\n'

        events.forEach((event) => {
            const start = format(event.startDate, "yyyyMMdd'T'HHmmss'Z'")
            // Default to 1 hour later if no end date
            const end = event.endDate
                ? format(event.endDate, "yyyyMMdd'T'HHmmss'Z'")
                : format(
                    new Date(event.startDate.getTime() + 60 * 60 * 1000),
                    "yyyyMMdd'T'HHmmss'Z'"
                )

            icsContent += 'BEGIN:VEVENT\n'
            icsContent += `UID:${event.id}@ui-ms.local\n`
            icsContent += `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}\n`
            icsContent += `DTSTART:${start}\n`
            icsContent += `DTEND:${end}\n`
            icsContent += `SUMMARY:${event.title}\n`
            icsContent += `DESCRIPTION:${event.description || ''}\n`
            if (event.location) icsContent += `LOCATION:${event.location}\n`
            icsContent += 'END:VEVENT\n'
        })

        icsContent += 'END:VCALENDAR'

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'kalender-kegiatan-madrasah.ics')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Open Google Calendar event creation link (just for first upcoming event as demo, or link to GCal import)
    const syncGoogleCalendar = () => {
        // In a real app, this might use Google Calendar API for bulk insert
        // Or just link to Google Calendar import settings page
        window.open(
            'https://calendar.google.com/calendar/u/0/r/settings/export',
            '_blank'
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant='outline' className='gap-2'>
                    <CalendarIcon className='h-4 w-4' />
                    <span>Sinkronisasi</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuLabel>Eksternal Kalender</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={generateICS} className='cursor-pointer'>
                    <Download className='mr-2 h-4 w-4' />
                    <span>Download .ics</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={syncGoogleCalendar} className='cursor-pointer'>
                    <ExternalLink className='mr-2 h-4 w-4' />
                    <span>Google Calendar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

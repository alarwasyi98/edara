import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, CalendarPlus, List } from 'lucide-react'
import { KalenderTable } from './components/events-table'
import { EventCalendar } from './components/event-calendar'
import { CalendarExport } from './components/events-export'
import { events } from './data/events'
import { categoryOptions } from './data/data'

const route = getRouteApi('/_authenticated/events/')

export function KalenderActivities() {
    const search = route.useSearch()
    const navigate = route.useNavigate()

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
                <PageHeader
                    title='Kalender Kegiatan'
                    description='Jadwal kegiatan dan acara madrasah.'
                >
                    <Button className='gap-1.5' onClick={() => {/* handle dialog here */}}>
                        <CalendarPlus size={16} /> Tambah
                    </Button>
                    <CalendarExport events={events} />
                </PageHeader>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    {categoryOptions.map((config) => {
                        const count = events.filter((e) => e.category === config.value).length
                        return (
                            <Card key={config.value}>
                                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                    <CardTitle className='text-sm font-medium'>
                                        {config.label}
                                    </CardTitle>
                                    <config.icon className='h-4 w-4 text-muted-foreground' />
                                </CardHeader>
                                <CardContent>
                                    <div className='text-2xl font-bold'>{count}</div>
                                    <p className='text-xs text-muted-foreground'>kegiatan</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <Tabs defaultValue='list' className='flex flex-1 flex-col gap-4'>
                    <div className='flex items-center justify-between'>
                        <TabsList variant='line'>
                            <TabsTrigger value='list' className='gap-2'>
                                <List className='h-4 w-4' /> Daftar
                            </TabsTrigger>
                            <TabsTrigger value='calendar' className='gap-2'>
                                <CalendarDays className='h-4 w-4' /> Kalender
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value='list' className='m-0 flex-1'>
                        <KalenderTable data={events} search={search} navigate={navigate} />
                    </TabsContent>
                    <TabsContent value='calendar' className='m-0 flex-1'>
                        <EventCalendar events={events} />
                    </TabsContent>
                </Tabs>
            </Main>
        </>
    )
}
import { School, ChevronsUpDown } from 'lucide-react'
import { useTenant } from '@/hooks/use-tenant'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function TenantSwitcher() {
  const { isMobile } = useSidebar()
  const { activeAssignment, assignments, setActiveAssignmentId } = useTenant()

  if (!activeAssignment) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-muted'>
              <School className='size-4' />
            </div>
            <div className='grid flex-1 text-start text-sm leading-tight'>
              <span className='truncate font-semibold text-muted-foreground'>
                No assignment
              </span>
              <span className='truncate text-xs text-muted-foreground'>
                Contact admin
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <School className='size-4' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeAssignment.schoolName}
                </span>
                <span className='truncate text-xs'>
                  {activeAssignment.unitName ?? 'All units'}
                </span>
              </div>
              {assignments.length > 1 && (
                <ChevronsUpDown className='ms-auto' />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {assignments.length > 1 && (
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-xs text-muted-foreground'>
                Assignments
              </DropdownMenuLabel>
              {assignments.map((assignment) => (
                <DropdownMenuItem
                  key={assignment.assignmentId}
                  onClick={() =>
                    setActiveAssignmentId(assignment.assignmentId)
                  }
                  className='gap-2 p-2'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <School className='size-4 shrink-0' />
                  </div>
                  <div className='flex flex-col'>
                    <span>{assignment.schoolName}</span>
                    <span className='text-xs text-muted-foreground'>
                      {assignment.unitName ?? 'All units'}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

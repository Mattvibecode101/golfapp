import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Clock, CalendarCheck, UserCog, Flag } from 'lucide-react'
import { useClubManager } from '@/hooks/useClubManager'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/club', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/club/tee-times', label: 'Tee Times', icon: Clock, end: false },
  { to: '/club/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { to: '/club/profile', label: 'My Profile', icon: UserCog, end: false },
]

export function ClubLayout() {
  const { course } = useClubManager()

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Flag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">{course?.name ?? 'Club Portal'}</h1>
          <p className="text-xs text-muted-foreground">{course?.city}, {course?.country}</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="w-48 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 mb-4 overflow-x-auto w-full pb-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap shrink-0',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </NavLink>
          ))}
        </div>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

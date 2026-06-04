import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, MapPin, Clock, CalendarCheck, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: MapPin, end: false },
  { to: '/admin/tee-times', label: 'Tee Times', icon: Clock, end: false },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
]

export function AdminLayout() {
  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      <div className="flex gap-8">
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

        {/* Mobile tab bar */}
        <div className="md:hidden flex gap-1 mb-4 overflow-x-auto w-full">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap',
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

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, CalendarCheck, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Stats {
  courses: number
  activeTeeTimesToday: number
  totalBookings: number
  confirmedBookings: number
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      supabase.from('golf_courses').select('id', { count: 'exact', head: true }),
      supabase.from('tee_times').select('id', { count: 'exact', head: true }).eq('date', today).eq('is_active', true),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    ]).then(([c, t, b, bc]) => {
      setStats({
        courses: c.count ?? 0,
        activeTeeTimesToday: t.count ?? 0,
        totalBookings: b.count ?? 0,
        confirmedBookings: bc.count ?? 0,
      })
    })
  }, [])

  const cards = stats
    ? [
        { label: 'Golf Courses', value: stats.courses, icon: MapPin, link: '/admin/courses' },
        { label: "Tee Times Today", value: stats.activeTeeTimesToday, icon: Clock, link: '/admin/tee-times' },
        { label: 'Total Bookings', value: stats.totalBookings, icon: CalendarCheck, link: '/admin/bookings' },
        { label: 'Confirmed', value: stats.confirmedBookings, icon: Users, link: '/admin/bookings' },
      ]
    : null

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards
          ? cards.map(({ label, value, icon: Icon, link }) => (
              <Link key={label} to={link}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-3xl font-bold">{value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          : Array.from({ length: 4 }, (_, i) => (
              <Card key={i}><CardContent className="pt-5 pb-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
      </div>
    </div>
  )
}

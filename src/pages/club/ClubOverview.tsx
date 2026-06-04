import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, Clock, DollarSign, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useClubManager } from '@/hooks/useClubManager'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingStatusBadge } from '@/components/dashboard/BookingStatusBadge'
import { formatCurrency, formatDate, formatTime, getTodayString } from '@/lib/utils'
import type { Booking } from '@/types/app.types'

interface Stats {
  bookingsToday: number
  revenueToday: number
  slotsAvailableToday: number
  totalBookings: number
}

export function ClubOverview() {
  const { course } = useClubManager()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])

  useEffect(() => {
    if (!course) return
    const today = getTodayString()

    Promise.all([
      supabase.from('bookings')
        .select('id, total_price', { count: 'exact' })
        .in('tee_time_id', supabase.from('tee_times').select('id').eq('course_id', course.id).eq('date', today) as unknown as string[])
        .eq('status', 'confirmed'),
      supabase.from('tee_times')
        .select('available_slots')
        .eq('course_id', course.id)
        .eq('date', today)
        .eq('is_active', true),
      supabase.from('bookings')
        .select('*, tee_times(date, time, golf_courses(name))')
        .in('tee_time_id', supabase.from('tee_times').select('id').eq('course_id', course.id) as unknown as string[])
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(async () => {
      // Simpler approach — direct queries
      const [slots, recent, total] = await Promise.all([
        supabase.from('tee_times').select('available_slots').eq('course_id', course.id).eq('date', today).eq('is_active', true),
        supabase.from('bookings').select('*, tee_times(*, golf_courses(*))').in(
          'tee_time_id',
          (await supabase.from('tee_times').select('id').eq('course_id', course.id)).data?.map(t => t.id) ?? []
        ).order('created_at', { ascending: false }).limit(6),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).in(
          'tee_time_id',
          (await supabase.from('tee_times').select('id').eq('course_id', course.id)).data?.map(t => t.id) ?? []
        ).eq('status', 'confirmed'),
      ])

      const todayTeeTimeIds = (await supabase.from('tee_times').select('id').eq('course_id', course.id).eq('date', today)).data?.map(t => t.id) ?? []
      const todayBookingRes = await supabase.from('bookings').select('id, total_price').in('tee_time_id', todayTeeTimeIds).eq('status', 'confirmed')

      setStats({
        bookingsToday: todayBookingRes.data?.length ?? 0,
        revenueToday: todayBookingRes.data?.reduce((sum, b) => sum + Number(b.total_price), 0) ?? 0,
        slotsAvailableToday: slots.data?.reduce((sum, t) => sum + t.available_slots, 0) ?? 0,
        totalBookings: total.count ?? 0,
      })
      setRecentBookings((recent.data ?? []) as unknown as Booking[])
    })
  }, [course])

  if (!course) return null

  const statCards = stats ? [
    { label: "Today's Bookings", value: stats.bookingsToday, icon: CalendarCheck, suffix: '' },
    { label: "Today's Revenue", value: formatCurrency(stats.revenueToday), icon: DollarSign, suffix: '' },
    { label: 'Slots Available Today', value: stats.slotsAvailableToday, icon: Clock, suffix: '' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: Users, suffix: '' },
  ] : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Overview</h2>
        <Button size="sm" asChild>
          <Link to="/club/tee-times">Manage Tee Times</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards ? statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        )) : Array.from({ length: 4 }, (_, i) => (
          <Card key={i}><CardContent className="pt-5 pb-5"><Skeleton className="h-14 w-full" /></CardContent></Card>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recent Bookings</h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/club/bookings">View all</Link>
          </Button>
        </div>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date / Time</th>
                  <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Players</th>
                  <th className="text-left px-4 py-2 font-medium">Total</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2 text-muted-foreground">
                      {b.tee_times ? `${formatDate(b.tee_times.date)} ${formatTime(b.tee_times.time)}` : '—'}
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell">{b.players}</td>
                    <td className="px-4 py-2 font-medium">{formatCurrency(b.total_price)}</td>
                    <td className="px-4 py-2"><BookingStatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

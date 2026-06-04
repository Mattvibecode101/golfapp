import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Calendar, Clock, Users, DollarSign, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Booking } from '@/types/app.types'

export function BookingSuccessPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId) return
    supabase
      .from('bookings')
      .select('*, tee_times(*, golf_courses(*))')
      .eq('id', bookingId)
      .single()
      .then(({ data }) => {
        setBooking(data as unknown as Booking)
        setLoading(false)
      })
  }, [bookingId])

  const teeTime = booking?.tee_times
  const course = teeTime?.golf_courses

  return (
    <div className="container py-12 max-w-lg text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
      <p className="text-muted-foreground mt-2">
        Your tee time is booked. See you on the course!
      </p>

      <Card className="mt-8 text-left">
        <CardContent className="pt-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </div>
          ) : (
            <>
              <div>
                <p className="font-bold text-lg">{course?.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{course?.city}, {course?.country}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{teeTime ? formatDate(teeTime.date) : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{teeTime ? formatTime(teeTime.time) : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{booking?.players} player{booking?.players !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Paid</span>
                </div>
                <span>{booking ? formatCurrency(booking.total_price) : ''}</span>
              </div>
              <div className="text-xs text-muted-foreground text-center pt-1">
                Booking ref: <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{booking?.id.slice(0, 8).toUpperCase()}</code>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" className="flex-1" asChild>
          <Link to="/courses">Find More</Link>
        </Button>
        <Button className="flex-1" asChild>
          <Link to="/dashboard">My Bookings</Link>
        </Button>
      </div>
    </div>
  )
}

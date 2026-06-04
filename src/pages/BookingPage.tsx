import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useBookings } from '@/hooks/useBookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { TeeTime, GolfCourse } from '@/types/app.types'

export function BookingPage() {
  const { teeTimeId } = useParams<{ teeTimeId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { createBooking } = useBookings()

  const initialPlayers = Number(searchParams.get('players') ?? 2)
  const [players, setPlayers] = useState(Math.min(Math.max(initialPlayers, 1), 4))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [teeTime, setTeeTime] = useState<TeeTime | null>(null)
  const [course, setCourse] = useState<GolfCourse | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!teeTimeId) return
    supabase
      .from('tee_times')
      .select('*, golf_courses(*)')
      .eq('id', teeTimeId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error('Tee time not found')
          navigate('/courses')
          return
        }
        setTeeTime(data as unknown as TeeTime)
        setCourse((data as unknown as { golf_courses: GolfCourse }).golf_courses)
        setDataLoading(false)
      })
  }, [teeTimeId, navigate])

  const totalPrice = teeTime ? teeTime.price_per_player * players : 0

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teeTime) return
    if (players > teeTime.available_slots) {
      toast.error(`Only ${teeTime.available_slots} slot(s) available`)
      return
    }
    setLoading(true)
    const { data, error } = await createBooking(teeTime.id, players, totalPrice, notes)
    setLoading(false)
    if (error) {
      toast.error('Booking failed. Please try again.')
    } else if (data) {
      navigate(`/booking-success/${data.id}`)
    }
  }

  if (dataLoading) {
    return (
      <div className="container py-8 max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6">
        <Link to={`/courses/${course?.id}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />Back to course
        </Link>
      </Button>

      <h1 className="text-2xl font-bold mb-6">Confirm Your Booking</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-base">{course?.name}</p>
              <p className="text-muted-foreground">{course?.city}, {course?.country}</p>
            </div>
            <Separator />
            <div className="space-y-2">
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
                <span>{players} player{players !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between font-semibold">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>Total</span>
              </div>
              <span className="text-lg">{formatCurrency(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(teeTime?.price_per_player ?? 0)} × {players} player{players !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleBook} className="space-y-5">
          <div className="space-y-2">
            <Label>Number of Players</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={players === n ? 'default' : 'outline'}
                  onClick={() => setPlayers(n)}
                  disabled={teeTime ? n > teeTime.available_slots : false}
                  className="flex-1"
                >
                  {n}
                </Button>
              ))}
            </div>
            {teeTime && teeTime.available_slots < 4 && (
              <p className="text-xs text-amber-600">{teeTime.available_slots} slots remaining</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests (optional)</Label>
            <Input
              id="notes"
              placeholder="e.g. Golf cart, early start..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Confirming...' : `Confirm Booking — ${formatCurrency(totalPrice)}`}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Free cancellation up to 24 hours before your tee time
          </p>
        </form>
      </div>
    </div>
  )
}

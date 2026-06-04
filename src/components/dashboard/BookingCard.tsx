import { Calendar, Clock, Users, DollarSign, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BookingStatusBadge } from './BookingStatusBadge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Booking } from '@/types/app.types'

interface BookingCardProps {
  booking: Booking
  onCancel?: (id: string) => void
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  const teeTime = booking.tee_times
  const course = teeTime?.golf_courses
  const isPast = teeTime ? new Date(`${teeTime.date}T${teeTime.time}`) < new Date() : false
  const canCancel = booking.status === 'confirmed' && !isPast

  return (
    <Card>
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{course?.name ?? 'Unknown Course'}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{course?.city}, {course?.country}</span>
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{teeTime ? formatDate(teeTime.date) : '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{teeTime ? formatTime(teeTime.time) : '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{booking.players} player{booking.players !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>{formatCurrency(booking.total_price)}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Ref: <code className="font-mono bg-muted px-1 py-0.5 rounded">{booking.id.slice(0, 8).toUpperCase()}</code>
        </div>

        {canCancel && onCancel && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => onCancel(booking.id)}
          >
            Cancel Booking
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

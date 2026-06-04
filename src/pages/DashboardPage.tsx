import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useBookings } from '@/hooks/useBookings'
import { BookingCard } from '@/components/dashboard/BookingCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Booking } from '@/types/app.types'

function BookingListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-lg border p-5 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-3">⛳</p>
      <h3 className="font-semibold text-lg">No {tab} bookings</h3>
      {tab === 'upcoming' && (
        <Button asChild className="mt-4">
          <Link to="/courses">Find a Tee Time</Link>
        </Button>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { bookings, loading, cancelBooking } = useBookings()
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const now = new Date()

  const upcoming = bookings.filter(b =>
    b.status === 'confirmed' &&
    b.tee_times &&
    new Date(`${b.tee_times.date}T${b.tee_times.time}`) >= now
  )
  const past = bookings.filter(b =>
    b.status === 'confirmed' &&
    b.tee_times &&
    new Date(`${b.tee_times.date}T${b.tee_times.time}`) < now
  )
  const cancelled = bookings.filter((b): b is Booking => b.status === 'cancelled')

  const handleCancelConfirm = async () => {
    if (!cancelId) return
    setCancelling(true)
    const { error } = await cancelBooking(cancelId)
    setCancelling(false)
    setCancelId(null)
    if (error) {
      toast.error('Failed to cancel booking')
    } else {
      toast.success('Booking cancelled')
    }
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="container py-8 space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user?.user_metadata?.full_name ?? 'My Bookings'}</h1>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming {!loading && upcoming.length > 0 && `(${upcoming.length})`}
          </TabsTrigger>
          <TabsTrigger value="past">Past {!loading && past.length > 0 && `(${past.length})`}</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled {!loading && cancelled.length > 0 && `(${cancelled.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? <BookingListSkeleton /> : upcoming.length === 0 ? (
            <EmptyState tab="upcoming" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map(b => (
                <BookingCard key={b.id} booking={b} onCancel={setCancelId} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {loading ? <BookingListSkeleton /> : past.length === 0 ? (
            <EmptyState tab="past" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {loading ? <BookingListSkeleton /> : cancelled.length === 0 ? (
            <EmptyState tab="cancelled" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cancelled.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelId} onOpenChange={open => !open && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? The tee time will be released and your slot returned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)} disabled={cancelling}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useClubManager } from '@/hooks/useClubManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingStatusBadge } from '@/components/dashboard/BookingStatusBadge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Booking } from '@/types/app.types'

export function ClubBookings() {
  const { course } = useClubManager()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!course) return
    supabase
      .from('tee_times')
      .select('id')
      .eq('course_id', course.id)
      .then(async ({ data: ttData }) => {
        const ids = ttData?.map(t => t.id) ?? []
        if (!ids.length) { setLoading(false); return }
        const { data } = await supabase
          .from('bookings')
          .select('*, tee_times(*, golf_courses(name, city))')
          .in('tee_time_id', ids)
          .order('created_at', { ascending: false })
        setBookings((data ?? []) as unknown as Booking[])
        setLoading(false)
      })
  }, [course])

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', cancelId)
    setCancelling(false)
    setCancelId(null)
    if (error) { toast.error(error.message); return }
    setBookings(prev => prev.map(b => b.id === cancelId ? { ...b, status: 'cancelled' } : b))
    toast.success('Booking cancelled')
  }

  const filtered = bookings.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return b.id.toLowerCase().includes(q) || b.tee_times?.golf_courses?.name?.toLowerCase().includes(q)
  })

  const confirmed = filtered.filter(b => b.status === 'confirmed')
  const cancelled = filtered.filter(b => b.status === 'cancelled')

  if (!course) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold flex-1">Bookings ({bookings.length})</h2>
        <Input
          placeholder="Search by ref..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-44 h-8"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12">No bookings yet</p>
      ) : (
        <div className="space-y-6">
          {confirmed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Confirmed ({confirmed.length})</h3>
              <BookingTable bookings={confirmed} onCancel={setCancelId} />
            </div>
          )}
          {cancelled.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cancelled ({cancelled.length})</h3>
              <BookingTable bookings={cancelled} />
            </div>
          )}
        </div>
      )}

      <Dialog open={!!cancelId} onOpenChange={open => !open && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>Cancel this booking? The tee time slot will be freed up for other golfers.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BookingTable({ bookings, onCancel }: { bookings: Booking[], onCancel?: (id: string) => void }) {
  return (
    <div className="rounded-lg border overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Ref</th>
            <th className="text-left px-4 py-2 font-medium">Date / Time</th>
            <th className="text-left px-4 py-2 font-medium">Players</th>
            <th className="text-left px-4 py-2 font-medium">Total</th>
            <th className="text-left px-4 py-2 font-medium">Status</th>
            {onCancel && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id} className="border-b last:border-0 hover:bg-muted/20">
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{b.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {b.tee_times ? `${formatDate(b.tee_times.date)} ${formatTime(b.tee_times.time)}` : '—'}
              </td>
              <td className="px-4 py-2">{b.players}</td>
              <td className="px-4 py-2 font-medium">{formatCurrency(b.total_price)}</td>
              <td className="px-4 py-2"><BookingStatusBadge status={b.status} /></td>
              {onCancel && (
                <td className="px-4 py-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => onCancel(b.id)}>
                    Cancel
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

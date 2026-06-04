import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingStatusBadge } from '@/components/dashboard/BookingStatusBadge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import type { Booking } from '@/types/app.types'

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    supabase
      .from('bookings')
      .select('*, tee_times(*, golf_courses(name, city))')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBookings((data ?? []) as unknown as Booking[]); setLoading(false) })
  }, [])

  const cancelBooking = async () => {
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
    return (
      b.id.toLowerCase().includes(q) ||
      b.tee_times?.golf_courses?.name.toLowerCase().includes(q) ||
      b.tee_times?.golf_courses?.city.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Bookings ({bookings.length})</h2>
        <Input
          placeholder="Search by course or ref..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-56 h-8"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-12">No bookings found</p>
      ) : (
        <div className="rounded-lg border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Ref</th>
                <th className="text-left px-4 py-2 font-medium">Course</th>
                <th className="text-left px-4 py-2 font-medium">Date / Time</th>
                <th className="text-left px-4 py-2 font-medium">Players</th>
                <th className="text-left px-4 py-2 font-medium">Total</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const tt = b.tee_times
                return (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                      {b.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-2 font-medium">
                      {tt?.golf_courses?.name ?? '—'}
                      <span className="text-muted-foreground font-normal"> · {tt?.golf_courses?.city}</span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {tt ? `${formatDate(tt.date)} ${formatTime(tt.time)}` : '—'}
                    </td>
                    <td className="px-4 py-2">{b.players}</td>
                    <td className="px-4 py-2 font-medium">{formatCurrency(b.total_price)}</td>
                    <td className="px-4 py-2">
                      <BookingStatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-2">
                      {b.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-destructive border-destructive/30"
                          onClick={() => setCancelId(b.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!cancelId} onOpenChange={open => !open && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>Cancel this booking on behalf of the user?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep</Button>
            <Button variant="destructive" onClick={cancelBooking} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

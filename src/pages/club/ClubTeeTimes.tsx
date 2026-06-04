import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useClubManager } from '@/hooks/useClubManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatTime, getTomorrowString } from '@/lib/utils'
import type { TeeTime } from '@/types/app.types'

export function ClubTeeTimes() {
  const { course } = useClubManager()
  const [date, setDate] = useState(getTomorrowString())
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [newSlot, setNewSlot] = useState({ time: '07:00', price: '', max_players: '4', slots: '4' })
  const [bulk, setBulk] = useState({ from: '07:00', to: '17:00', interval: '10', price: '', days: '30' })
  const [generating, setGenerating] = useState(false)

  const fetchTeeTimes = useCallback(async () => {
    if (!course) return
    setLoading(true)
    const { data } = await supabase
      .from('tee_times')
      .select('*')
      .eq('course_id', course.id)
      .eq('date', date)
      .order('time')
    setTeeTimes((data ?? []) as TeeTime[])
    setLoading(false)
  }, [course, date])

  useEffect(() => { fetchTeeTimes() }, [fetchTeeTimes])

  // Realtime subscription — show live updates in the manager's own view too
  useEffect(() => {
    if (!course) return
    const channel = supabase
      .channel(`club_tee_times_${course.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tee_times', filter: `course_id=eq.${course.id}` },
        () => fetchTeeTimes()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [course, fetchTeeTimes])

  const addSlot = async () => {
    if (!course || !newSlot.price) { toast.error('Enter a price'); return }
    const { error } = await supabase.from('tee_times').insert({
      course_id: course.id, date, time: newSlot.time + ':00',
      max_players: Number(newSlot.max_players),
      available_slots: Number(newSlot.slots),
      price_per_player: Number(newSlot.price),
      is_active: true,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Tee time added — visible to golfers now')
    setAddOpen(false)
  }

  const toggleActive = async (tt: TeeTime) => {
    await supabase.from('tee_times').update({ is_active: !tt.is_active }).eq('id', tt.id)
    toast.success(tt.is_active ? 'Slot hidden' : 'Slot visible')
  }

  const deleteSlot = async (id: string) => {
    await supabase.from('tee_times').delete().eq('id', id)
    setTeeTimes(prev => prev.filter(t => t.id !== id))
    toast.success('Slot removed')
  }

  const generateBulk = async () => {
    if (!course || !bulk.price) { toast.error('Enter a price per player'); return }
    setGenerating(true)
    const slots = []
    const [fh, fm] = bulk.from.split(':').map(Number)
    const [th, tm] = bulk.to.split(':').map(Number)
    const interval = Number(bulk.interval)
    const days = Number(bulk.days)

    for (let d = 1; d <= days; d++) {
      const dt = new Date()
      dt.setDate(dt.getDate() + d)
      const dateStr = dt.toISOString().split('T')[0]
      let h = fh, m = fm
      while (h * 60 + m <= th * 60 + tm) {
        slots.push({
          course_id: course.id,
          date: dateStr,
          time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
          max_players: 4,
          available_slots: 4,
          price_per_player: Number(bulk.price),
          is_active: true,
        })
        m += interval
        if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
      }
    }

    for (let i = 0; i < slots.length; i += 500) {
      await supabase.from('tee_times').upsert(slots.slice(i, i + 500), { onConflict: 'course_id,date,time', ignoreDuplicates: true })
    }
    setGenerating(false)
    toast.success(`${slots.length} tee time slots created across ${days} days — golfers can book now`)
    setBulkOpen(false)
    fetchTeeTimes()
  }

  if (!course) return null

  const maxDate = (() => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().split('T')[0] })()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold flex-1">Tee Times</h2>
        <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />Bulk Setup
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add Slot
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Viewing date</Label>
          <Input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            max={maxDate}
            onChange={e => setDate(e.target.value)}
            className="h-8 w-44"
          />
        </div>
        <div className="flex items-end">
          <Button size="sm" variant="ghost" onClick={fetchTeeTimes} className="h-8">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-end ml-auto">
          <p className="text-sm text-muted-foreground">{teeTimes.length} slots</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}
        </div>
      ) : teeTimes.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-2xl mb-2">⛳</p>
          <p className="font-medium">No tee times for this date</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Use Bulk Setup to quickly fill in your availability</p>
          <Button onClick={() => setBulkOpen(true)}><RefreshCw className="mr-2 h-4 w-4" />Bulk Setup</Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {teeTimes.map(tt => (
            <div
              key={tt.id}
              className={`relative group rounded-lg border p-2.5 text-xs text-center transition-colors ${
                tt.is_active ? 'bg-background hover:border-primary/50' : 'bg-muted/50 opacity-60'
              }`}
            >
              <p className="font-semibold text-sm">{formatTime(tt.time)}</p>
              <p className="text-muted-foreground mt-0.5">{tt.available_slots}/{tt.max_players} slots</p>
              <p className="text-primary font-medium">{formatCurrency(tt.price_per_player)}</p>
              {!tt.is_active && <Badge variant="secondary" className="text-[10px] px-1 py-0 mt-1">Hidden</Badge>}

              {/* Hover actions */}
              <div className="absolute inset-x-0 bottom-0 hidden group-hover:flex bg-background/95 border-t rounded-b-lg">
                <button
                  onClick={() => toggleActive(tt)}
                  className="flex-1 py-1 hover:bg-muted transition-colors"
                  title={tt.is_active ? 'Hide slot' : 'Show slot'}
                >
                  {tt.is_active
                    ? <ToggleRight className="h-3.5 w-3.5 text-green-600 mx-auto" />
                    : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                  }
                </button>
                <button
                  onClick={() => deleteSlot(tt.id)}
                  className="flex-1 py-1 hover:bg-destructive/10 transition-colors"
                  title="Delete slot"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add single slot */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Tee Time Slot</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} disabled className="opacity-70" />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input type="time" value={newSlot.time} onChange={e => setNewSlot(p => ({ ...p, time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Price per Player (ZAR)</Label>
              <Input type="number" placeholder="750" value={newSlot.price} onChange={e => setNewSlot(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Players</Label>
              <Input type="number" min={1} max={4} value={newSlot.max_players} onChange={e => setNewSlot(p => ({ ...p, max_players: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Available Slots</Label>
              <Input type="number" min={1} max={4} value={newSlot.slots} onChange={e => setNewSlot(p => ({ ...p, slots: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addSlot}>Add & Go Live</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk generate */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bulk Setup Tee Times</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">Creates slots for the next N days. Skips any that already exist.</p>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label>First tee time</Label>
              <Input type="time" value={bulk.from} onChange={e => setBulk(p => ({ ...p, from: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Last tee time</Label>
              <Input type="time" value={bulk.to} onChange={e => setBulk(p => ({ ...p, to: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Interval (minutes)</Label>
              <Input type="number" value={bulk.interval} onChange={e => setBulk(p => ({ ...p, interval: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Days ahead</Label>
              <Input type="number" min={1} max={90} value={bulk.days} onChange={e => setBulk(p => ({ ...p, days: e.target.value }))} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Price per Player (ZAR) <span className="text-destructive">*</span></Label>
              <Input type="number" placeholder="e.g. 750" value={bulk.price} onChange={e => setBulk(p => ({ ...p, price: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={generateBulk} disabled={generating || !bulk.price}>
              {generating ? 'Creating...' : 'Create Slots'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

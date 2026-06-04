import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency, formatTime, getTomorrowString } from '@/lib/utils'
import type { GolfCourse, TeeTime } from '@/types/app.types'

export function AdminTeeTimes() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState<GolfCourse[]>([])
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const selectedCourse = searchParams.get('course') ?? ''
  const [date, setDate] = useState(getTomorrowString())

  const [newSlot, setNewSlot] = useState({ time: '07:00', price: '', max_players: '4', slots: '4' })
  const [bulk, setBulk] = useState({ from: '07:00', to: '16:00', interval: '10', price: '', days: '14' })

  useEffect(() => {
    supabase.from('golf_courses').select('id,name,city').order('name')
      .then(({ data }) => setCourses((data ?? []) as GolfCourse[]))
  }, [])

  useEffect(() => {
    if (!selectedCourse || !date) return
    setLoading(true)
    supabase.from('tee_times').select('*')
      .eq('course_id', selectedCourse).eq('date', date)
      .order('time')
      .then(({ data }) => { setTeeTimes((data ?? []) as TeeTime[]); setLoading(false) })
  }, [selectedCourse, date])

  const addSlot = async () => {
    if (!selectedCourse || !date || !newSlot.price) { toast.error('Fill all fields'); return }
    const { error } = await supabase.from('tee_times').insert({
      course_id: selectedCourse, date, time: newSlot.time + ':00',
      max_players: Number(newSlot.max_players), available_slots: Number(newSlot.slots),
      price_per_player: Number(newSlot.price), is_active: true,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Tee time added')
    setAddOpen(false)
    refetchTeeTimes()
  }

  const deleteSlot = async (id: string) => {
    await supabase.from('tee_times').delete().eq('id', id)
    setTeeTimes(prev => prev.filter(t => t.id !== id))
    toast.success('Deleted')
  }

  const refetchTeeTimes = () => {
    if (!selectedCourse || !date) return
    setLoading(true)
    supabase.from('tee_times').select('*').eq('course_id', selectedCourse).eq('date', date).order('time')
      .then(({ data }) => { setTeeTimes((data ?? []) as TeeTime[]); setLoading(false) })
  }

  const generateBulk = async () => {
    if (!selectedCourse || !bulk.price) { toast.error('Select a course and enter price'); return }
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
          course_id: selectedCourse, date: dateStr,
          time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`,
          max_players: 4, available_slots: 4,
          price_per_player: Number(bulk.price), is_active: true,
        })
        m += interval
        if (m >= 60) { h += Math.floor(m / 60); m = m % 60 }
      }
    }
    // Insert in batches of 500
    for (let i = 0; i < slots.length; i += 500) {
      await supabase.from('tee_times').upsert(slots.slice(i, i + 500), { onConflict: 'course_id,date,time', ignoreDuplicates: true })
    }
    setGenerating(false)
    toast.success(`Generated ${slots.length} tee time slots across ${days} days`)
    setBulkOpen(false)
    refetchTeeTimes()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tee Times</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setBulkOpen(true)} disabled={!selectedCourse}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />Bulk Generate
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)} disabled={!selectedCourse}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Slot
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs">Course</Label>
          <select
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedCourse}
            onChange={e => setSearchParams({ course: e.target.value })}
          >
            <option value="">Select a course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex items-end">
          <Button size="sm" variant="outline" onClick={refetchTeeTimes} disabled={!selectedCourse}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!selectedCourse ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Select a course to manage its tee times</p>
      ) : loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {Array.from({ length: 18 }, (_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : teeTimes.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No tee times for this date. Use Bulk Generate to create slots.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {teeTimes.map(t => (
            <div key={t.id} className="relative group rounded-md border p-2 text-xs text-center bg-background hover:border-destructive/50">
              <p className="font-medium">{formatTime(t.time)}</p>
              <p className="text-muted-foreground">{t.available_slots}/{t.max_players} slots</p>
              <p className="text-primary">{formatCurrency(t.price_per_player)}</p>
              <button
                onClick={() => deleteSlot(t.id)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 items-center justify-center hidden group-hover:flex text-[10px]"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Add single slot */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Tee Time</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={newSlot.time} onChange={e => setNewSlot(p => ({ ...p, time: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price (ZAR)</Label>
              <Input type="number" placeholder="750" value={newSlot.price} onChange={e => setNewSlot(p => ({ ...p, price: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Players</Label>
              <Input type="number" min={1} max={4} value={newSlot.max_players} onChange={e => setNewSlot(p => ({ ...p, max_players: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Available Slots</Label>
              <Input type="number" min={1} max={4} value={newSlot.slots} onChange={e => setNewSlot(p => ({ ...p, slots: e.target.value }))} className="h-8" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addSlot}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk generate */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Generate Tee Times</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">From time</Label>
              <Input type="time" value={bulk.from} onChange={e => setBulk(p => ({ ...p, from: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To time</Label>
              <Input type="time" value={bulk.to} onChange={e => setBulk(p => ({ ...p, to: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Interval (mins)</Label>
              <Input type="number" value={bulk.interval} onChange={e => setBulk(p => ({ ...p, interval: e.target.value }))} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Days ahead</Label>
              <Input type="number" value={bulk.days} onChange={e => setBulk(p => ({ ...p, days: e.target.value }))} className="h-8" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Price per player (ZAR) *</Label>
              <Input type="number" placeholder="750" value={bulk.price} onChange={e => setBulk(p => ({ ...p, price: e.target.value }))} className="h-8" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={generateBulk} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeeTimes } from '@/hooks/useTeeTimes'
import { TeeTimeSlot } from './TeeTimeSlot'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getTomorrowString } from '@/lib/utils'

interface TeeTimePickerProps {
  courseId: string
  players: number
}

export function TeeTimePicker({ courseId, players }: TeeTimePickerProps) {
  const [date, setDate] = useState(getTomorrowString())
  const [selected, setSelected] = useState<string | null>(null)
  const { teeTimes, loading } = useTeeTimes(courseId, date)
  const navigate = useNavigate()

  const handleSelect = (id: string) => {
    setSelected(id)
    navigate(`/book/${id}?players=${players}`)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tee-date">Select Date</Label>
        <Input
          id="tee-date"
          type="date"
          value={date}
          min={getTomorrowString()}
          max={(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0] })()}
          onChange={e => { setDate(e.target.value); setSelected(null) }}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {Array.from({ length: 15 }, (_, i) => <Skeleton key={i} className="h-14 rounded-md" />)}
        </div>
      ) : teeTimes.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">No available tee times for this date.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {teeTimes.map(tt => (
            <TeeTimeSlot
              key={tt.id}
              teeTime={tt}
              selected={selected === tt.id}
              onClick={() => handleSelect(tt.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

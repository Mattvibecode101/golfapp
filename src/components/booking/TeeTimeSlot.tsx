import { formatTime } from '@/lib/utils'
import type { TeeTime } from '@/types/app.types'
import { cn } from '@/lib/utils'

interface TeeTimeSlotProps {
  teeTime: TeeTime
  selected?: boolean
  onClick: () => void
}

export function TeeTimeSlot({ teeTime, selected, onClick }: TeeTimeSlotProps) {
  const available = teeTime.available_slots > 0

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!available}
      className={cn(
        'rounded-md border px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        available
          ? selected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background hover:border-primary hover:bg-primary/5'
          : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
      )}
    >
      <span className="block">{formatTime(teeTime.time)}</span>
      <span className="block text-xs opacity-75">
        {available ? `${teeTime.available_slots} left` : 'Full'}
      </span>
    </button>
  )
}

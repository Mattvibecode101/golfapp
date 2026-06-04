import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types/app.types'

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <Badge variant={status === 'confirmed' ? 'success' : 'secondary'}>
      {status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
    </Badge>
  )
}

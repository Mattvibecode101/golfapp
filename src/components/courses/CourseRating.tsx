import { Star } from 'lucide-react'

interface CourseRatingProps {
  rating: number | null
  showCount?: boolean
}

export function CourseRating({ rating, showCount = true }: CourseRatingProps) {
  if (!rating) return null
  const filled = Math.floor(rating)
  const partial = rating - filled > 0.4

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < filled
                ? 'fill-amber-400 text-amber-400'
                : i === filled && partial
                ? 'fill-amber-200 text-amber-400'
                : 'fill-transparent text-gray-300'
            }`}
          />
        ))}
      </div>
      {showCount && <span className="text-sm font-medium text-muted-foreground">{rating.toFixed(1)}</span>}
    </div>
  )
}

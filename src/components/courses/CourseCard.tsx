import { Link } from 'react-router-dom'
import { MapPin, Trophy, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CourseRating } from './CourseRating'
import { formatCurrency } from '@/lib/utils'
import type { GolfCourse } from '@/types/app.types'

interface CourseCardProps {
  course: GolfCourse
}

export function CourseCard({ course }: CourseCardProps) {
  const fallbackImg = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&auto=format&fit=crop'

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={course.image_url ?? fallbackImg}
          alt={course.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = fallbackImg }}
        />
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-foreground font-medium">
            {course.holes} holes • Par {course.par}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{course.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{course.city}, {course.country}</span>
          </div>
        </div>

        {course.rating && (
          <CourseRating rating={course.rating} />
        )}

        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="font-medium">{formatCurrency(course.green_fee_min)}</span>
            {course.green_fee_max !== course.green_fee_min && (
              <span className="text-muted-foreground">– {formatCurrency(course.green_fee_max)}</span>
            )}
          </div>
          {course.rating && course.rating >= 4.8 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Trophy className="h-3.5 w-3.5" />
              <span>Top Rated</span>
            </div>
          )}
        </div>

        <Button className="w-full" asChild>
          <Link to={`/courses/${course.id}`}>View Tee Times</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

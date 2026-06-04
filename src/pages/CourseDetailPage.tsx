import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Phone, Globe, Users, ArrowLeft } from 'lucide-react'
import { useCourse } from '@/hooks/useCourses'
import { TeeTimePicker } from '@/components/booking/TeeTimePicker'
import { CourseRating } from '@/components/courses/CourseRating'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { course, loading, error } = useCourse(id ?? '')
  const [players, setPlayers] = useState(2)

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container py-16 text-center">
        <p className="text-2xl mb-2">⛳</p>
        <h2 className="text-xl font-semibold">Course not found</h2>
        <Button asChild className="mt-4" variant="outline"><Link to="/courses">Back to courses</Link></Button>
      </div>
    )
  }

  const fallbackImg = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1200&auto=format&fit=crop'

  return (
    <div className="container py-8 space-y-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/courses"><ArrowLeft className="mr-1 h-4 w-4" />All Courses</Link>
      </Button>

      {/* Hero image */}
      <div className="relative h-72 md:h-96 rounded-xl overflow-hidden">
        <img
          src={course.image_url ?? fallbackImg}
          alt={course.name}
          className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = fallbackImg }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <Badge className="bg-white/20 text-white border-white/30 mb-2">
            {course.holes} holes • Par {course.par}
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold">{course.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-white/80 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span>{course.address ? `${course.address}, ` : ''}{course.city}, {course.country}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {course.rating && <CourseRating rating={course.rating} />}

          {course.description && (
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-muted-foreground">Green fee:</span>
              <span>{formatCurrency(course.green_fee_min)} – {formatCurrency(course.green_fee_max)}</span>
            </div>
            {course.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <a href={`tel:${course.phone}`} className="hover:text-foreground">{course.phone}</a>
              </div>
            )}
            {course.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <a href={course.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground truncate">
                  {course.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Players selector */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Number of Players</h2>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <Button
                key={n}
                size="sm"
                variant={players === n ? 'default' : 'outline'}
                onClick={() => setPlayers(n)}
                className="flex-1"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Tee time picker */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Available Tee Times</h2>
        <TeeTimePicker courseId={course.id} players={players} />
      </div>
    </div>
  )
}

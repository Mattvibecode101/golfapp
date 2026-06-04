import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useCourses } from '@/hooks/useCourses'
import { CourseGrid } from '@/components/courses/CourseGrid'
import { CourseFilters } from '@/components/courses/CourseFilters'
import type { CourseSearchParams } from '@/types/app.types'

export function CoursesPage() {
  const [searchParams] = useSearchParams()

  const params: CourseSearchParams = {
    query: searchParams.get('q') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    holes: searchParams.get('holes') ? Number(searchParams.get('holes')) : undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  }

  const { courses, loading } = useCourses(params)

  const hasQuery = searchParams.get('q')

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {hasQuery ? `Results for "${hasQuery}"` : 'Browse Golf Courses'}
        </h1>
        {!loading && (
          <p className="text-muted-foreground mt-1">
            {courses.length} course{courses.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      <div className="flex gap-8">
        <div className="hidden lg:block w-64 shrink-0">
          <CourseFilters />
        </div>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters</span>
          </div>
          <div className="lg:hidden mb-4">
            <CourseFilters />
          </div>
          <CourseGrid courses={courses} loading={loading} />
        </div>
      </div>
    </div>
  )
}

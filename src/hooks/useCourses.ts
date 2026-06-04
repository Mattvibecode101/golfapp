import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { GolfCourse, CourseSearchParams } from '@/types/app.types'

export function useCourses(params?: CourseSearchParams) {
  const [courses, setCourses] = useState<GolfCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('golf_courses')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })

    if (params?.city) query = query.ilike('city', `%${params.city}%`)
    if (params?.minPrice) query = query.gte('green_fee_min', params.minPrice)
    if (params?.maxPrice) query = query.lte('green_fee_max', params.maxPrice)
    if (params?.holes) query = query.eq('holes', params.holes)
    if (params?.query) {
      query = query.or(
        `name.ilike.%${params.query}%,city.ilike.%${params.query}%,description.ilike.%${params.query}%`
      )
    }

    const { data, error } = await query
    if (error) setError(error.message)
    else setCourses((data ?? []) as GolfCourse[])
    setLoading(false)
  }, [params?.query, params?.city, params?.minPrice, params?.maxPrice, params?.holes]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCourses() }, [fetchCourses])

  return { courses, loading, error, refetch: fetchCourses }
}

export function useCourse(id: string) {
  const [course, setCourse] = useState<GolfCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('golf_courses')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCourse(data as GolfCourse)
        setLoading(false)
      })
  }, [id])

  return { course, loading, error }
}

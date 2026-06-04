import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { TeeTime } from '@/types/app.types'

export function useTeeTimes(courseId: string, date: string) {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !date) return
    setLoading(true)
    setError(null)

    supabase
      .from('tee_times')
      .select('*')
      .eq('course_id', courseId)
      .eq('date', date)
      .eq('is_active', true)
      .gt('available_slots', 0)
      .order('time', { ascending: true })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setTeeTimes((data ?? []) as TeeTime[])
        setLoading(false)
      })
  }, [courseId, date])

  return { teeTimes, loading, error }
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { TeeTime } from '@/types/app.types'

export function useTeeTimes(courseId: string, date: string) {
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeeTimes = useCallback(async () => {
    if (!courseId || !date) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('tee_times')
      .select('*')
      .eq('course_id', courseId)
      .eq('date', date)
      .eq('is_active', true)
      .gt('available_slots', 0)
      .order('time', { ascending: true })
    if (error) setError(error.message)
    else setTeeTimes((data ?? []) as TeeTime[])
    setLoading(false)
  }, [courseId, date])

  useEffect(() => {
    fetchTeeTimes()
  }, [fetchTeeTimes])

  // Supabase Realtime — when club manager changes tee times, users see it instantly
  useEffect(() => {
    if (!courseId || !date) return

    const channel = supabase
      .channel(`tee_times_${courseId}_${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tee_times',
          filter: `course_id=eq.${courseId}`,
        },
        () => {
          // Re-fetch whenever any tee time for this course changes
          fetchTeeTimes()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [courseId, date, fetchTeeTimes])

  return { teeTimes, loading, error, refetch: fetchTeeTimes }
}

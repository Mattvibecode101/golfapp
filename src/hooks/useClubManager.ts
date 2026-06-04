import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { GolfCourse } from '@/types/app.types'

export function useClubManager() {
  const { user, loading: authLoading } = useAuth()
  const [isClubManager, setIsClubManager] = useState(false)
  const [course, setCourse] = useState<GolfCourse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setIsClubManager(false); setLoading(false); return }

    supabase
      .from('profiles')
      .select('is_club_manager, managed_course_id')
      .eq('id', user.id)
      .single()
      .then(async ({ data }) => {
        if (data?.is_club_manager && data.managed_course_id) {
          setIsClubManager(true)
          const { data: courseData } = await supabase
            .from('golf_courses')
            .select('*')
            .eq('id', data.managed_course_id)
            .single()
          setCourse(courseData as GolfCourse)
        } else {
          setIsClubManager(false)
        }
        setLoading(false)
      })
  }, [user, authLoading])

  return { isClubManager, course, loading }
}

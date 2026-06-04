import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/types/app.types'
import { useAuth } from './useAuth'

export function useBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        tee_times (
          *,
          golf_courses (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setBookings((data ?? []) as unknown as Booking[])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const createBooking = async (
    teeTimeId: string,
    players: number,
    totalPrice: number,
    notes?: string
  ) => {
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        tee_time_id: teeTimeId,
        players,
        total_price: totalPrice,
        status: 'confirmed',
        notes: notes ?? null,
      })
      .select()
      .single()
    if (!error) await fetchBookings()
    return { data, error }
  }

  const cancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
    if (!error) await fetchBookings()
    return { error }
  }

  return { bookings, loading, error, createBooking, cancelBooking, refetch: fetchBookings }
}

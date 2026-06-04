export interface GolfCourse {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  country: string
  holes: number
  par: number
  green_fee_min: number
  green_fee_max: number
  phone: string | null
  website: string | null
  image_url: string | null
  rating: number | null
  is_active: boolean
  created_at: string
}

export interface TeeTime {
  id: string
  course_id: string
  date: string
  time: string
  max_players: number
  available_slots: number
  price_per_player: number
  is_active: boolean
}

export type BookingStatus = 'confirmed' | 'cancelled'

export interface Booking {
  id: string
  user_id: string
  tee_time_id: string
  players: number
  total_price: number
  status: BookingStatus
  notes: string | null
  created_at: string
  tee_times?: TeeTime & { golf_courses?: GolfCourse }
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
}

export interface CourseSearchParams {
  query?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  holes?: number
}

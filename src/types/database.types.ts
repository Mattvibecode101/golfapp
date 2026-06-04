export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          players: number
          status: Database["public"]["Enums"]["booking_status"]
          tee_time_id: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          players: number
          status?: Database["public"]["Enums"]["booking_status"]
          tee_time_id: string
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          players?: number
          status?: Database["public"]["Enums"]["booking_status"]
          tee_time_id?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_tee_time_id_fkey"
            columns: ["tee_time_id"]
            isOneToOne: false
            referencedRelation: "tee_times"
            referencedColumns: ["id"]
          },
        ]
      }
      golf_courses: {
        Row: {
          address: string | null
          city: string
          country: string
          created_at: string
          description: string | null
          green_fee_max: number
          green_fee_min: number
          holes: number
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          par: number
          phone: string | null
          rating: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city: string
          country?: string
          created_at?: string
          description?: string | null
          green_fee_max: number
          green_fee_min: number
          holes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          par: number
          phone?: string | null
          rating?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string
          country?: string
          created_at?: string
          description?: string | null
          green_fee_max?: number
          green_fee_min?: number
          holes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          par?: number
          phone?: string | null
          rating?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          is_club_manager: boolean
          managed_course_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          is_club_manager?: boolean
          managed_course_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          is_club_manager?: boolean
          managed_course_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tee_times: {
        Row: {
          available_slots: number
          course_id: string
          created_at: string
          date: string
          id: string
          is_active: boolean
          max_players: number
          price_per_player: number
          time: string
          updated_at: string
        }
        Insert: {
          available_slots: number
          course_id: string
          created_at?: string
          date: string
          id?: string
          is_active?: boolean
          max_players?: number
          price_per_player: number
          time: string
          updated_at?: string
        }
        Update: {
          available_slots?: number
          course_id?: string
          created_at?: string
          date?: string
          id?: string
          is_active?: boolean
          max_players?: number
          price_per_player?: number
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tee_times_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "golf_courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: "confirmed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Auto-generated types from Supabase
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          is_admin: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          is_admin?: boolean
          avatar_url?: string | null
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
        }
      }
      leaderboard_entries: {
        Row: {
          id: string
          user_id: string | null
          driver_name: string
          game: string
          track: string
          car: string
          lap_time_ms: number
          lap_time_display: string
          screenshot_url: string | null
          video_url: string | null
          status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          driver_name: string
          game: string
          track: string
          car: string
          lap_time_ms: number
          lap_time_display: string
          screenshot_url?: string | null
          video_url?: string | null
          status?: 'pending' | 'approved' | 'rejected'
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          verified_by?: string | null
          verified_at?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_type: 'race' | 'tournament' | 'time_trial' | 'special' | 'maintenance'
          game: string
          track: string
          car_class: string | null
          start_date: string
          end_date: string
          prize: string | null
          entry_fee: number
          max_participants: number | null
          current_participants: number
          is_active: boolean
          banner_image_url: string | null
          images: string[] | null
          rules: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          description?: string | null
          event_type: 'race' | 'tournament' | 'time_trial' | 'special' | 'maintenance'
          game: string
          track: string
          car_class?: string | null
          start_date: string
          end_date: string
          prize?: string | null
          entry_fee?: number
          max_participants?: number | null
          is_active?: boolean
          banner_image_url?: string | null
          images?: string[] | null
          rules?: string | null
          created_by?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          event_type?: 'race' | 'tournament' | 'time_trial' | 'special' | 'maintenance'
          game?: string
          track?: string
          car_class?: string | null
          start_date?: string
          end_date?: string
          prize?: string | null
          entry_fee?: number
          max_participants?: number | null
          is_active?: boolean
          banner_image_url?: string | null
          images?: string[] | null
          rules?: string | null
          current_participants?: number
        }
      }
      discounts: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'percentage' | 'fixed_amount'
          discount_value: number
          min_purchase: number
          max_uses: number | null
          current_uses: number
          valid_from: string
          valid_until: string | null
          is_active: boolean
          applies_to: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          description?: string | null
          discount_type: 'percentage' | 'fixed_amount'
          discount_value: number
          min_purchase?: number
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          applies_to?: string[]
          created_by?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed_amount'
          discount_value?: number
          min_purchase?: number
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
          is_active?: boolean
          applies_to?: string[]
        }
      }
      founders_passes: {
        Row: {
          id: string
          user_id: string | null
          pass_number: number
          email: string
          full_name: string
          payment_method: 'paypal' | 'venmo' | 'stripe' | 'other'
          payment_id: string | null
          amount_paid: number
          discount_code: string | null
          status: 'reserved' | 'paid' | 'active' | 'cancelled'
          plaque_name: string
          merch_size: string | null
          shipping_address: string | null
          notes: string | null
          purchased_at: string
          activated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          pass_number: number
          email: string
          full_name: string
          payment_method: 'paypal' | 'venmo' | 'stripe' | 'other'
          payment_id?: string | null
          amount_paid: number
          discount_code?: string | null
          status?: 'reserved' | 'paid' | 'active' | 'cancelled'
          plaque_name: string
          merch_size?: string | null
          shipping_address?: string | null
          notes?: string | null
        }
        Update: {
          status?: 'reserved' | 'paid' | 'active' | 'cancelled'
          activated_at?: string | null
        }
      }
    }
  }
}

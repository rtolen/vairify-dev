export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_vai_context: {
        Row: {
          active_business_id: string | null
          active_vai_number: string
          active_vai_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_business_id?: string | null
          active_vai_number: string
          active_vai_type?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_business_id?: string | null
          active_vai_number?: string
          active_vai_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_vai_context_active_business_id_fkey"
            columns: ["active_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type: string | null
          client_id: string
          created_at: string
          end_time: string
          id: string
          location: string | null
          notes: string | null
          provider_id: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_type?: string | null
          client_id: string
          created_at?: string
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          provider_id: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_type?: string | null
          client_id?: string
          created_at?: string
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          provider_id?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          post_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          post_type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          post_type?: string
          user_id?: string
        }
        Relationships: []
      }
      business_employees: {
        Row: {
          availability_status: string
          business_guardian_group_id: string | null
          business_id: string
          business_vai_number: string
          created_at: string
          employee_user_id: string
          feature_permissions: Json
          fired_at: string | null
          hired_at: string
          id: string
          is_visible_in_directory: boolean
          status: string
          updated_at: string
        }
        Insert: {
          availability_status?: string
          business_guardian_group_id?: string | null
          business_id: string
          business_vai_number: string
          created_at?: string
          employee_user_id: string
          feature_permissions?: Json
          fired_at?: string | null
          hired_at?: string
          id?: string
          is_visible_in_directory?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          availability_status?: string
          business_guardian_group_id?: string | null
          business_id?: string
          business_vai_number?: string
          created_at?: string
          employee_user_id?: string
          feature_permissions?: Json
          fired_at?: string | null
          hired_at?: string
          id?: string
          is_visible_in_directory?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_employees_business_guardian_group_id_fkey"
            columns: ["business_guardian_group_id"]
            isOneToOne: false
            referencedRelation: "guardian_group_counts"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "business_employees_business_guardian_group_id_fkey"
            columns: ["business_guardian_group_id"]
            isOneToOne: false
            referencedRelation: "guardian_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          display_order: number
          duration_minutes: number
          id: string
          is_active: boolean
          price: number
          service_name: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          duration_minutes: number
          id?: string
          is_active?: boolean
          price: number
          service_name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          duration_minutes?: number
          id?: string
          is_active?: boolean
          price?: number
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_vai_coupons: {
        Row: {
          business_id: string
          coupon_code: string
          created_at: string
          id: string
          redeemed_at: string | null
          redeemed_by_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          coupon_code: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          coupon_code?: string
          created_at?: string
          id?: string
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_vai_coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          created_at: string
          description: string | null
          email: string | null
          id: string
          owner_id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type: Database["public"]["Enums"]["business_type"]
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          owner_id: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: Database["public"]["Enums"]["business_type"]
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      calendar_settings: {
        Row: {
          advance_notice_hours: number
          allow_same_day_booking: boolean
          auto_confirm_appointments: boolean
          buffer_time_minutes: number
          cancellation_notice_hours: number
          created_at: string
          id: string
          max_advance_days: number
          max_appointment_duration_minutes: number
          min_appointment_duration_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_notice_hours?: number
          allow_same_day_booking?: boolean
          auto_confirm_appointments?: boolean
          buffer_time_minutes?: number
          cancellation_notice_hours?: number
          created_at?: string
          id?: string
          max_advance_days?: number
          max_appointment_duration_minutes?: number
          min_appointment_duration_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_notice_hours?: number
          allow_same_day_booking?: boolean
          auto_confirm_appointments?: boolean
          buffer_time_minutes?: number
          cancellation_notice_hours?: number
          created_at?: string
          id?: string
          max_advance_days?: number
          max_appointment_duration_minutes?: number
          min_appointment_duration_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_invitations: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          location: Json | null
          preferences: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          location?: Json | null
          preferences?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          location?: Json | null
          preferences?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_representative_competitions: {
        Row: {
          competition_end_date: string
          competition_start_date: string
          country_code: string
          country_name: string
          created_at: string
          id: string
          status: string
          updated_at: string
          winner_announced_at: string | null
          winner_user_id: string | null
        }
        Insert: {
          competition_end_date: string
          competition_start_date?: string
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          winner_announced_at?: string | null
          winner_user_id?: string | null
        }
        Update: {
          competition_end_date?: string
          competition_start_date?: string
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          winner_announced_at?: string | null
          winner_user_id?: string | null
        }
        Relationships: []
      }
      dateguard_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          metadata: Json | null
          sender_id: string | null
          sender_name: string
          sender_type: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_name: string
          sender_type: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string | null
          sender_name?: string
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dateguard_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dateguard_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dateguard_sessions: {
        Row: {
          alarm_delay_minutes: number | null
          created_at: string
          duration_minutes: number
          encounter_id: string | null
          ends_at: string
          guardian_group_id: string | null
          id: string
          last_checkin_at: string | null
          location_address: string
          location_gps: string
          location_name: string
          memo: string
          photo_url: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alarm_delay_minutes?: number | null
          created_at?: string
          duration_minutes: number
          encounter_id?: string | null
          ends_at: string
          guardian_group_id?: string | null
          id?: string
          last_checkin_at?: string | null
          location_address: string
          location_gps: string
          location_name: string
          memo: string
          photo_url?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alarm_delay_minutes?: number | null
          created_at?: string
          duration_minutes?: number
          encounter_id?: string | null
          ends_at?: string
          guardian_group_id?: string | null
          id?: string
          last_checkin_at?: string | null
          location_address?: string
          location_gps?: string
          location_name?: string
          memo?: string
          photo_url?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dateguard_sessions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dateguard_sessions_guardian_group_id_fkey"
            columns: ["guardian_group_id"]
            isOneToOne: false
            referencedRelation: "guardian_group_counts"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "dateguard_sessions_guardian_group_id_fkey"
            columns: ["guardian_group_id"]
            isOneToOne: false
            referencedRelation: "guardian_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_boosts: {
        Row: {
          boost_bid_amount: number
          boost_expires_at: string | null
          boost_position: number | null
          boost_type: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          boost_bid_amount?: number
          boost_expires_at?: string | null
          boost_position?: number | null
          boost_type: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          boost_bid_amount?: number
          boost_expires_at?: string | null
          boost_position?: number | null
          boost_type?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          attempts: number | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          otp_code: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          otp_code: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      emergency_events: {
        Row: {
          created_at: string
          guardians_notified: Json | null
          id: string
          location_address: string | null
          location_gps: string | null
          resolution_notes: string | null
          resolved_at: string | null
          session_id: string | null
          status: string
          trigger_type: string
          triggered_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guardians_notified?: Json | null
          id?: string
          location_address?: string | null
          location_gps?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          session_id?: string | null
          status?: string
          trigger_type: string
          triggered_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guardians_notified?: Json | null
          id?: string
          location_address?: string | null
          location_gps?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          session_id?: string | null
          status?: string
          trigger_type?: string
          triggered_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dateguard_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_tasks: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          claimed_by_name: string | null
          created_at: string
          id: string
          session_id: string
          task_type: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          claimed_by_name?: string | null
          created_at?: string
          id?: string
          session_id: string
          task_type: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          claimed_by_name?: string | null
          created_at?: string
          id?: string
          session_id?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dateguard_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          accepted_at: string
          both_reviews_submitted_at: string | null
          client_id: string
          client_review_submitted: boolean | null
          closed_at: string | null
          completed_at: string | null
          created_at: string
          dateguard_window_closed_at: string | null
          dateguard_window_open: boolean
          id: string
          provider_id: string
          provider_review_submitted: boolean | null
          reviews_publish_scheduled_for: string | null
          reviews_published: boolean | null
          reviews_published_at: string | null
          reviews_window_closed_at: string | null
          reviews_window_closed_reason: string | null
          reviews_window_open: boolean
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string
          both_reviews_submitted_at?: string | null
          client_id: string
          client_review_submitted?: boolean | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          dateguard_window_closed_at?: string | null
          dateguard_window_open?: boolean
          id?: string
          provider_id: string
          provider_review_submitted?: boolean | null
          reviews_publish_scheduled_for?: string | null
          reviews_published?: boolean | null
          reviews_published_at?: string | null
          reviews_window_closed_at?: string | null
          reviews_window_closed_reason?: string | null
          reviews_window_open?: boolean
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string
          both_reviews_submitted_at?: string | null
          client_id?: string
          client_review_submitted?: boolean | null
          closed_at?: string | null
          completed_at?: string | null
          created_at?: string
          dateguard_window_closed_at?: string | null
          dateguard_window_open?: boolean
          id?: string
          provider_id?: string
          provider_review_submitted?: boolean | null
          reviews_publish_scheduled_for?: string | null
          reviews_published?: boolean | null
          reviews_published_at?: string | null
          reviews_window_closed_at?: string | null
          reviews_window_closed_reason?: string | null
          reviews_window_open?: boolean
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          favorited_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorited_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorited_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      founding_council_members: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      golden_roses_balance: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          lifetime_earned: number | null
          lifetime_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      golden_roses_bundles: {
        Row: {
          bundle_name: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          price_usd: number
          roses_amount: number
          updated_at: string
        }
        Insert: {
          bundle_name: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price_usd: number
          roses_amount: number
          updated_at?: string
        }
        Update: {
          bundle_name?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          price_usd?: number
          roses_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      golden_roses_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          related_post_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_post_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          related_post_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "golden_roses_transactions_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "marketplace_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_group_members: {
        Row: {
          created_at: string
          group_id: string
          guardian_id: string
          id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          guardian_id: string
          id?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          guardian_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "guardian_group_counts"
            referencedColumns: ["group_id"]
          },
          {
            foreignKeyName: "guardian_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "guardian_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_group_members_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_groups: {
        Row: {
          business_id: string | null
          created_at: string
          group_name: string
          id: string
          is_default: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          group_name: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          group_name?: string
          id?: string
          is_default?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_groups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          last_resent_at: string | null
          name: string
          phone: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          last_resent_at?: string | null
          name: string
          phone: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          last_resent_at?: string | null
          name?: string
          phone?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influencer_applications: {
        Row: {
          admin_notes: string | null
          application_notes: string | null
          application_type: string
          applied_at: string
          audience_size: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          social_handles: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          application_notes?: string | null
          application_type: string
          applied_at?: string
          audience_size?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_handles?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          application_notes?: string | null
          application_type?: string
          applied_at?: string
          audience_size?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_handles?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invitation_responses: {
        Row: {
          created_at: string
          id: string
          invitation_id: string
          provider_id: string
          responded_at: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_id: string
          provider_id: string
          responded_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_id?: string
          provider_id?: string
          responded_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_responses_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "client_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_post_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          id: string
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          id?: string
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          id?: string
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketplace_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketplace_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_posts: {
        Row: {
          available_now: boolean | null
          boost_bid_amount: number | null
          boost_expires_at: string | null
          boost_position: number | null
          boost_type: string | null
          caption: string | null
          comments_count: number | null
          created_at: string | null
          id: string
          likes_count: number | null
          location_city: string | null
          location_state: string | null
          media_urls: Json
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          available_now?: boolean | null
          boost_bid_amount?: number | null
          boost_expires_at?: string | null
          boost_position?: number | null
          boost_type?: string | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          location_city?: string | null
          location_state?: string | null
          media_urls?: Json
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          available_now?: boolean | null
          boost_bid_amount?: number | null
          boost_expires_at?: string | null
          boost_position?: number | null
          boost_type?: string | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          location_city?: string | null
          location_state?: string | null
          media_urls?: Json
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_apps: {
        Row: {
          app_category: string
          app_name: string
          app_region: string
          created_at: string | null
          download_url_android: string | null
          download_url_ios: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          app_category: string
          app_name: string
          app_region: string
          created_at?: string | null
          download_url_android?: string | null
          download_url_ios?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          app_category?: string
          app_name?: string
          app_region?: string
          created_at?: string | null
          download_url_android?: string | null
          download_url_ios?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allow_messages_from: string
          allow_screenshots: boolean
          created_at: string | null
          id: string
          location_visibility: string
          online_status_visible: boolean
          profile_visibility: string
          show_in_search: boolean
          show_last_active: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_messages_from?: string
          allow_screenshots?: boolean
          created_at?: string | null
          id?: string
          location_visibility?: string
          online_status_visible?: boolean
          profile_visibility?: string
          show_in_search?: boolean
          show_last_active?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_messages_from?: string
          allow_screenshots?: boolean
          created_at?: string | null
          id?: string
          location_visibility?: string
          online_status_visible?: boolean
          profile_visibility?: string
          show_in_search?: boolean
          show_last_active?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          profile_links: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          profile_links?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          profile_links?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      provider_availability_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_enabled: boolean
          start_time: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_enabled?: boolean
          start_time: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_enabled?: boolean
          start_time?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          accept_invitations: boolean | null
          add_ons: Json | null
          age_range: string | null
          auto_availability_enabled: boolean | null
          availability: Json | null
          available_now: boolean | null
          available_now_location: Json | null
          available_now_started_at: string | null
          avatar_url: string | null
          body_type: string | null
          created_at: string
          ethnicity: string | null
          eye_color: string | null
          hair_color: string | null
          hair_length: string | null
          height: string | null
          id: string
          is_verified: boolean | null
          members_gallery: Json | null
          profile_completion_percentage: number | null
          profile_settings: Json | null
          public_gallery: Json | null
          services_offered: Json | null
          updated_at: string
          user_id: string
          username: string
          weight: string | null
        }
        Insert: {
          accept_invitations?: boolean | null
          add_ons?: Json | null
          age_range?: string | null
          auto_availability_enabled?: boolean | null
          availability?: Json | null
          available_now?: boolean | null
          available_now_location?: Json | null
          available_now_started_at?: string | null
          avatar_url?: string | null
          body_type?: string | null
          created_at?: string
          ethnicity?: string | null
          eye_color?: string | null
          hair_color?: string | null
          hair_length?: string | null
          height?: string | null
          id?: string
          is_verified?: boolean | null
          members_gallery?: Json | null
          profile_completion_percentage?: number | null
          profile_settings?: Json | null
          public_gallery?: Json | null
          services_offered?: Json | null
          updated_at?: string
          user_id: string
          username: string
          weight?: string | null
        }
        Update: {
          accept_invitations?: boolean | null
          add_ons?: Json | null
          age_range?: string | null
          auto_availability_enabled?: boolean | null
          availability?: Json | null
          available_now?: boolean | null
          available_now_location?: Json | null
          available_now_started_at?: string | null
          avatar_url?: string | null
          body_type?: string | null
          created_at?: string
          ethnicity?: string | null
          eye_color?: string | null
          hair_color?: string | null
          hair_length?: string | null
          height?: string | null
          id?: string
          is_verified?: boolean | null
          members_gallery?: Json | null
          profile_completion_percentage?: number | null
          profile_settings?: Json | null
          public_gallery?: Json | null
          services_offered?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
          weight?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          commission_rate: number
          created_at: string
          early_access_date: string | null
          id: string
          referral_code: string
          registered_at: string | null
          tier: Database["public"]["Enums"]["referral_tier"]
          tier_benefits_active: boolean | null
          updated_at: string
          user_id: string
          vai_completed_at: string | null
          vai_completion_deadline: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          early_access_date?: string | null
          id?: string
          referral_code: string
          registered_at?: string | null
          tier?: Database["public"]["Enums"]["referral_tier"]
          tier_benefits_active?: boolean | null
          updated_at?: string
          user_id: string
          vai_completed_at?: string | null
          vai_completion_deadline?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          early_access_date?: string | null
          id?: string
          referral_code?: string
          registered_at?: string | null
          tier?: Database["public"]["Enums"]["referral_tier"]
          tier_benefits_active?: boolean | null
          updated_at?: string
          user_id?: string
          vai_completed_at?: string | null
          vai_completion_deadline?: string | null
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          month_year: string
          referral_id: string
          referrer_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month_year: string
          referral_id: string
          referrer_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month_year?: string
          referral_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invite_method: string
          invite_target: string
          invited_at: string
          last_resent_at: string | null
          message: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invite_method: string
          invite_target: string
          invited_at?: string
          last_resent_at?: string | null
          message?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invite_method?: string
          invite_target?: string
          invited_at?: string
          last_resent_at?: string | null
          message?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      referral_payouts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          id: string
          payment_method: string
          payment_reference: string | null
          payout_date: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          payout_date: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          payment_reference?: string | null
          payout_date?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          cancelled_at: string | null
          created_at: string
          id: string
          invitation_id: string | null
          monthly_subscription_amount: number | null
          referred_user_id: string
          referrer_id: string
          subscription_status: string
          updated_at: string
          upgraded_to_premium_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          monthly_subscription_amount?: number | null
          referred_user_id: string
          referrer_id: string
          subscription_status?: string
          updated_at?: string
          upgraded_to_premium_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          monthly_subscription_amount?: number | null
          referred_user_id?: string
          referrer_id?: string
          subscription_status?: string
          updated_at?: string
          upgraded_to_premium_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "referral_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          accuracy_rating: number | null
          attitude_rating: number | null
          communication_rating: number | null
          created_at: string
          encounter_id: string
          id: string
          notes: string | null
          overall_rating: number | null
          published: boolean | null
          published_at: string | null
          punctuality_rating: number | null
          respectfulness_rating: number | null
          reviewed_user_id: string
          reviewer_id: string
          safety_rating: number | null
          submitted: boolean | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          accuracy_rating?: number | null
          attitude_rating?: number | null
          communication_rating?: number | null
          created_at?: string
          encounter_id: string
          id?: string
          notes?: string | null
          overall_rating?: number | null
          published?: boolean | null
          published_at?: string | null
          punctuality_rating?: number | null
          respectfulness_rating?: number | null
          reviewed_user_id: string
          reviewer_id: string
          safety_rating?: number | null
          submitted?: boolean | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          accuracy_rating?: number | null
          attitude_rating?: number | null
          communication_rating?: number | null
          created_at?: string
          encounter_id?: string
          id?: string
          notes?: string | null
          overall_rating?: number | null
          published?: boolean | null
          published_at?: string | null
          punctuality_rating?: number | null
          respectfulness_rating?: number | null
          reviewed_user_id?: string
          reviewer_id?: string
          safety_rating?: number | null
          submitted?: boolean | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_codes: {
        Row: {
          created_at: string
          deactivation_code: string
          decoy_code: string
          face_verification_url: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivation_code: string
          decoy_code: string
          face_verification_url?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deactivation_code?: string
          decoy_code?: string
          face_verification_url?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedule_time_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          template_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          template_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_time_slots_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_connect_accounts: {
        Row: {
          created_at: string | null
          id: string
          onboarding_complete: boolean | null
          stripe_account_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          onboarding_complete?: boolean | null
          stripe_account_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          onboarding_complete?: boolean | null
          stripe_account_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          business_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          payment_app_id: string
          preference_order: number
          qr_code_image_url: string | null
          updated_at: string | null
          user_id: string
          username_handle: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_app_id: string
          preference_order?: number
          qr_code_image_url?: string | null
          updated_at?: string | null
          user_id: string
          username_handle?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_app_id?: string
          preference_order?: number
          qr_code_image_url?: string | null
          updated_at?: string | null
          user_id?: string
          username_handle?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_methods_payment_app_id_fkey"
            columns: ["payment_app_id"]
            isOneToOne: false
            referencedRelation: "payment_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          application_status_emails: boolean | null
          created_at: string
          email_notifications: boolean | null
          emergency_alerts: boolean | null
          id: string
          marketing_emails: boolean | null
          push_notifications: boolean | null
          referral_updates: boolean | null
          sms_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_status_emails?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          emergency_alerts?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          referral_updates?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_status_emails?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          emergency_alerts?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          referral_updates?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vai_check_sessions: {
        Row: {
          client_decision: string | null
          client_face_url: string | null
          client_face_verified: boolean | null
          client_final_face_url: string | null
          client_final_verified: boolean | null
          client_id: string | null
          client_signature: string | null
          client_verified: boolean | null
          completed_at: string | null
          contract_data: Json | null
          contract_signed_client: boolean | null
          contract_signed_provider: boolean | null
          created_at: string | null
          encounter_id: string | null
          final_verification_client: boolean | null
          final_verification_provider: boolean | null
          id: string
          metadata: Json | null
          provider_decision: string | null
          provider_face_url: string | null
          provider_face_verified: boolean | null
          provider_final_face_url: string | null
          provider_final_verified: boolean | null
          provider_id: string
          provider_signature: string | null
          provider_verified: boolean | null
          qr_data: string | null
          qr_expires_at: string | null
          session_code: string
          status: string | null
        }
        Insert: {
          client_decision?: string | null
          client_face_url?: string | null
          client_face_verified?: boolean | null
          client_final_face_url?: string | null
          client_final_verified?: boolean | null
          client_id?: string | null
          client_signature?: string | null
          client_verified?: boolean | null
          completed_at?: string | null
          contract_data?: Json | null
          contract_signed_client?: boolean | null
          contract_signed_provider?: boolean | null
          created_at?: string | null
          encounter_id?: string | null
          final_verification_client?: boolean | null
          final_verification_provider?: boolean | null
          id?: string
          metadata?: Json | null
          provider_decision?: string | null
          provider_face_url?: string | null
          provider_face_verified?: boolean | null
          provider_final_face_url?: string | null
          provider_final_verified?: boolean | null
          provider_id: string
          provider_signature?: string | null
          provider_verified?: boolean | null
          qr_data?: string | null
          qr_expires_at?: string | null
          session_code: string
          status?: string | null
        }
        Update: {
          client_decision?: string | null
          client_face_url?: string | null
          client_face_verified?: boolean | null
          client_final_face_url?: string | null
          client_final_verified?: boolean | null
          client_id?: string | null
          client_signature?: string | null
          client_verified?: boolean | null
          completed_at?: string | null
          contract_data?: Json | null
          contract_signed_client?: boolean | null
          contract_signed_provider?: boolean | null
          created_at?: string | null
          encounter_id?: string | null
          final_verification_client?: boolean | null
          final_verification_provider?: boolean | null
          id?: string
          metadata?: Json | null
          provider_decision?: string | null
          provider_face_url?: string | null
          provider_face_verified?: boolean | null
          provider_final_face_url?: string | null
          provider_final_verified?: boolean | null
          provider_id?: string
          provider_signature?: string | null
          provider_verified?: boolean | null
          qr_data?: string | null
          qr_expires_at?: string | null
          session_code?: string
          status?: string | null
        }
        Relationships: []
      }
      vai_identity_access_logs: {
        Row: {
          access_notes: string | null
          access_reason: string
          accessed_at: string
          accessed_by_name: string | null
          accessed_by_user_id: string
          authorization_reference: string | null
          created_at: string
          id: string
          requesting_entity: string | null
          transaction_number: string
          vai_number: string
        }
        Insert: {
          access_notes?: string | null
          access_reason: string
          accessed_at?: string
          accessed_by_name?: string | null
          accessed_by_user_id: string
          authorization_reference?: string | null
          created_at?: string
          id?: string
          requesting_entity?: string | null
          transaction_number: string
          vai_number: string
        }
        Update: {
          access_notes?: string | null
          access_reason?: string
          accessed_at?: string
          accessed_by_name?: string | null
          accessed_by_user_id?: string
          authorization_reference?: string | null
          created_at?: string
          id?: string
          requesting_entity?: string | null
          transaction_number?: string
          vai_number?: string
        }
        Relationships: []
      }
      vai_verifications: {
        Row: {
          biometric_photo_url: string
          business_id: string | null
          complycube_transaction_number: string
          created_at: string
          id: string
          is_business_vai: boolean
          le_disclosure_accepted: boolean
          signature_agreement_accepted: boolean
          updated_at: string
          user_id: string
          vai_number: string
        }
        Insert: {
          biometric_photo_url: string
          business_id?: string | null
          complycube_transaction_number: string
          created_at?: string
          id?: string
          is_business_vai?: boolean
          le_disclosure_accepted?: boolean
          signature_agreement_accepted?: boolean
          updated_at?: string
          user_id: string
          vai_number: string
        }
        Update: {
          biometric_photo_url?: string
          business_id?: string | null
          complycube_transaction_number?: string
          created_at?: string
          id?: string
          is_business_vai?: boolean
          le_disclosure_accepted?: boolean
          signature_agreement_accepted?: boolean
          updated_at?: string
          user_id?: string
          vai_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "vai_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_sessions: {
        Row: {
          chainpass_response: Json | null
          coupon_code: string | null
          created_at: string
          email: string
          expires_at: string
          existing_vai_number: string | null
          has_existing_vai: boolean | null
          id: string
          password_hash: string | null
          payment_expiration: string | null
          referral_vai: string | null
          requirements_status: Json | null
          session_id: string
          vai_status: string | null
        }
        Insert: {
          chainpass_response?: Json | null
          coupon_code?: string | null
          created_at?: string
          email: string
          expires_at?: string
          existing_vai_number?: string | null
          has_existing_vai?: boolean | null
          id?: string
          password_hash?: string | null
          payment_expiration?: string | null
          referral_vai?: string | null
          requirements_status?: Json | null
          session_id?: string
          vai_status?: string | null
        }
        Update: {
          chainpass_response?: Json | null
          coupon_code?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          existing_vai_number?: string | null
          has_existing_vai?: boolean | null
          id?: string
          password_hash?: string | null
          payment_expiration?: string | null
          referral_vai?: string | null
          requirements_status?: Json | null
          session_id?: string
          vai_status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      guardian_group_counts: {
        Row: {
          active_count: number | null
          group_id: string | null
          group_name: string | null
          is_default: boolean | null
          pending_count: number | null
          total_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
      referral_leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          full_name: string | null
          last_referral_date: string | null
          provider_referrals: number | null
          total_referrals: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_activate_dateguard: {
        Args: { p_encounter_id: string }
        Returns: {
          can_activate: boolean
          days_remaining: number
          reason: string
        }[]
      }
      check_appointment_conflict: {
        Args: {
          p_appointment_id?: string
          p_end_time: string
          p_provider_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      generate_business_vai_number: { Args: never; Returns: string }
      generate_session_code: { Args: never; Returns: string }
      generate_vai_coupon_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "influencer" | "affiliate"
      business_type: "service" | "non_service"
      referral_tier:
        | "founding_council"
        | "first_movers"
        | "standard"
        | "early_access"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "influencer", "affiliate"],
      business_type: ["service", "non_service"],
      referral_tier: [
        "founding_council",
        "first_movers",
        "standard",
        "early_access",
      ],
    },
  },
} as const

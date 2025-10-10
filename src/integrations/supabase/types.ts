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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          age_group: string | null
          created_at: string
          event_id: string
          gender: string | null
          id: string
          status: string
          ticket_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          event_id: string
          gender?: string | null
          id?: string
          status?: string
          ticket_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          event_id?: string
          gender?: string | null
          id?: string
          status?: string
          ticket_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_analytics: {
        Row: {
          action_type: string
          created_at: string
          event_id: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          event_id: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          event_id?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          assigned_vendors: Json | null
          available_seats: number | null
          created_at: string | null
          date: string | null
          description: string | null
          event_sponsors: Json | null
          event_type: string | null
          id: string
          image_url: string | null
          location: string | null
          organizer_id: string
          popularity_score: number | null
          price: number | null
          time: string | null
          title: string
          venue: string | null
        }
        Insert: {
          assigned_vendors?: Json | null
          available_seats?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          event_sponsors?: Json | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          organizer_id: string
          popularity_score?: number | null
          price?: number | null
          time?: string | null
          title: string
          venue?: string | null
        }
        Update: {
          assigned_vendors?: Json | null
          available_seats?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          event_sponsors?: Json | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          organizer_id?: string
          popularity_score?: number | null
          price?: number | null
          time?: string | null
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      organizers: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          org_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_usage_log: {
        Row: {
          created_at: string
          email: string
          id: string
          used_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          used_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          used_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_last_four: string
          card_type: string
          created_at: string
          expires_at: string
          id: string
          is_default: boolean | null
          user_id: string
        }
        Insert: {
          card_last_four: string
          card_type: string
          created_at?: string
          expires_at: string
          id?: string
          is_default?: boolean | null
          user_id: string
        }
        Update: {
          card_last_four?: string
          card_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_default?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_group: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          gender: string | null
          id: string
          notification_settings: Json | null
          phone: string | null
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          notification_settings?: Json | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          notification_settings?: Json | null
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsor_requests: {
        Row: {
          approved_amount: number | null
          benefits_offered: string | null
          created_at: string
          event_description: string | null
          event_id: string
          expected_attendance: number | null
          id: string
          organizer_id: string
          requested_amount: number | null
          sponsor_id: string
          sponsor_response: string | null
          sponsorship_tier: string | null
          status: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          benefits_offered?: string | null
          created_at?: string
          event_description?: string | null
          event_id: string
          expected_attendance?: number | null
          id?: string
          organizer_id: string
          requested_amount?: number | null
          sponsor_id: string
          sponsor_response?: string | null
          sponsorship_tier?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          benefits_offered?: string | null
          created_at?: string
          event_description?: string | null
          event_id?: string
          expected_attendance?: number | null
          id?: string
          organizer_id?: string
          requested_amount?: number | null
          sponsor_id?: string
          sponsor_response?: string | null
          sponsorship_tier?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_requests_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          business_type: string
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          preferred_event_types: string[] | null
          sponsorship_tiers: Json | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          business_type: string
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          preferred_event_types?: string[] | null
          sponsorship_tiers?: Json | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          business_type?: string
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          preferred_event_types?: string[] | null
          sponsorship_tiers?: Json | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          badges: Json | null
          created_at: string
          id: string
          points: number
          total_events_attended: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: Json | null
          created_at?: string
          id?: string
          points?: number
          total_events_attended?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: Json | null
          created_at?: string
          id?: string
          points?: number
          total_events_attended?: number
          updated_at?: string
          user_id?: string
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
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      vendor_requests: {
        Row: {
          budget_range: string | null
          created_at: string
          event_date: string | null
          event_id: string
          id: string
          message: string | null
          organizer_id: string
          service_category: string
          status: string
          updated_at: string
          vendor_id: string
          vendor_response: string | null
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          event_date?: string | null
          event_id: string
          id?: string
          message?: string | null
          organizer_id: string
          service_category: string
          status?: string
          updated_at?: string
          vendor_id: string
          vendor_response?: string | null
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          event_date?: string | null
          event_id?: string
          id?: string
          message?: string | null
          organizer_id?: string
          service_category?: string
          status?: string
          updated_at?: string
          vendor_id?: string
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          availability: boolean | null
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          portfolio_images: Json | null
          price_range: string | null
          rating: number | null
          service_category: string
          total_reviews: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: boolean | null
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          portfolio_images?: Json | null
          price_range?: string | null
          rating?: number | null
          service_category: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: boolean | null
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          portfolio_images?: Json | null
          price_range?: string | null
          rating?: number | null
          service_category?: string
          total_reviews?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_event_popularity: {
        Args: { event_uuid: string }
        Returns: number
      }
      generate_ticket_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_organizer_info: {
        Args: { organizer_uuid: string }
        Returns: {
          created_at: string
          description: string
          id: string
          org_name: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_all_popularity_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "organizer" | "admin" | "vendor" | "sponsor"
      user_role: "student" | "organizer" | "vendor" | "sponsor"
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
      app_role: ["user", "organizer", "admin", "vendor", "sponsor"],
      user_role: ["student", "organizer", "vendor", "sponsor"],
    },
  },
} as const

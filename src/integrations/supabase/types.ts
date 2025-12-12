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
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address: string
          booking_fee_paid: boolean | null
          created_at: string | null
          customer_name: string
          email: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          id: string
          matched_supplier_contact: string | null
          matched_supplier_id: string | null
          matched_supplier_name: string | null
          notes: string | null
          payment_intent_id: string | null
          phone: string
          selected_option_ids: string[] | null
          status: Database["public"]["Enums"]["booking_status"] | null
          user_id: string | null
        }
        Insert: {
          address: string
          booking_fee_paid?: boolean | null
          created_at?: string | null
          customer_name: string
          email?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          matched_supplier_contact?: string | null
          matched_supplier_id?: string | null
          matched_supplier_name?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          phone: string
          selected_option_ids?: string[] | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          user_id?: string | null
        }
        Update: {
          address?: string
          booking_fee_paid?: boolean | null
          created_at?: string | null
          customer_name?: string
          email?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          id?: string
          matched_supplier_contact?: string | null
          matched_supplier_id?: string | null
          matched_supplier_name?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          phone?: string
          selected_option_ids?: string[] | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_matched_supplier_id_fkey"
            columns: ["matched_supplier_id"]
            isOneToOne: false
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_matched_supplier_id_fkey"
            columns: ["matched_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          customer_id: string
          customer_unread_count: number | null
          id: string
          last_message_at: string | null
          quote_id: string | null
          request_id: string | null
          supplier_id: string
          supplier_unread_count: number | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_unread_count?: number | null
          id?: string
          last_message_at?: string | null
          quote_id?: string | null
          request_id?: string | null
          supplier_id: string
          supplier_unread_count?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_unread_count?: number | null
          id?: string
          last_message_at?: string | null
          quote_id?: string | null
          request_id?: string | null
          supplier_id?: string
          supplier_unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_guides: {
        Row: {
          avg_price_max: number
          avg_price_min: number
          category: string
          created_at: string
          description: string | null
          id: string
          price_factors: Json | null
          tips: string[] | null
          typical_duration: string | null
          updated_at: string
        }
        Insert: {
          avg_price_max: number
          avg_price_min: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          price_factors?: Json | null
          tips?: string[] | null
          typical_duration?: string | null
          updated_at?: string
        }
        Update: {
          avg_price_max?: number
          avg_price_min?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          price_factors?: Json | null
          tips?: string[] | null
          typical_duration?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          bonus_credits: number | null
          created_at: string
          credits: number
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_cents: number
        }
        Insert: {
          bonus_credits?: number | null
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_cents: number
        }
        Update: {
          bonus_credits?: number | null
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          payment_reference: string | null
          pro_account_id: string
          quote_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          payment_reference?: string | null
          pro_account_id: string
          quote_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_reference?: string | null
          pro_account_id?: string
          quote_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_pro_account_id_fkey"
            columns: ["pro_account_id"]
            isOneToOne: false
            referencedRelation: "pro_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_match_settings: {
        Row: {
          auto_quote_message: string | null
          auto_quote_price_max: number | null
          auto_quote_price_min: number | null
          category: string
          created_at: string
          id: string
          is_enabled: boolean | null
          max_distance_km: number | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          auto_quote_message?: string | null
          auto_quote_price_max?: number | null
          auto_quote_price_min?: number | null
          category: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          max_distance_km?: number | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          auto_quote_message?: string | null
          auto_quote_price_max?: number | null
          auto_quote_price_min?: number | null
          category?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          max_distance_km?: number | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instant_match_settings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_match_settings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      pro_accounts: {
        Row: {
          avg_response_time_hours: number | null
          background_check_completed: boolean | null
          created_at: string
          credits: number
          id: string
          license_verified: boolean | null
          response_rate: number | null
          subscription_expires_at: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          supplier_id: string
          total_hires: number | null
          total_leads_purchased: number | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avg_response_time_hours?: number | null
          background_check_completed?: boolean | null
          created_at?: string
          credits?: number
          id?: string
          license_verified?: boolean | null
          response_rate?: number | null
          subscription_expires_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          supplier_id: string
          total_hires?: number | null
          total_leads_purchased?: number | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avg_response_time_hours?: number | null
          background_check_completed?: boolean | null
          created_at?: string
          credits?: number
          id?: string
          license_verified?: boolean | null
          response_rate?: number | null
          subscription_expires_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          supplier_id?: string
          total_hires?: number | null
          total_leads_purchased?: number | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pro_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pro_accounts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          avatar_url: string | null
          city: string
          created_at: string | null
          full_name: string
          id: string
          phone: string
          province: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          avatar_url?: string | null
          city: string
          created_at?: string | null
          full_name: string
          id: string
          phone: string
          province?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          avatar_url?: string | null
          city?: string
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string
          province?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string
          created_at: string
          description: string
          id: string
          lead_cost_credits: number | null
          location: string
          preferred_date: string | null
          preferred_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category: string
          created_at?: string
          description: string
          id?: string
          lead_cost_credits?: number | null
          location: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          lead_cost_credits?: number | null
          location?: string
          preferred_date?: string | null
          preferred_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string
          credits_spent: number | null
          estimated_duration: string | null
          id: string
          is_read: boolean | null
          message: string
          price: number
          request_id: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_spent?: number | null
          estimated_duration?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          price: number
          request_id: string
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_spent?: number | null
          estimated_duration?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          price?: number
          request_id?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "project_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          id: string
          rating: number
          supplier_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          id?: string
          rating: number
          supplier_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          id?: string
          rating?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_options: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          location_area: string | null
          price: number
          supplier_id: string | null
          time_frame: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_area?: string | null
          price: number
          supplier_id?: string | null
          time_frame?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_area?: string | null
          price?: number
          supplier_id?: string | null
          time_frame?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_options_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "public_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_options_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          leads_per_month: number | null
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_cents_monthly: number
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          leads_per_month?: number | null
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          price_cents_monthly: number
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          leads_per_month?: number | null
          name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          price_cents_monthly?: number
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          business_name: string
          category: string
          contact_name: string
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          location: string | null
          phone: string
          price: number | null
          status: Database["public"]["Enums"]["supplier_status"] | null
          time_frame: string | null
          title: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          business_name: string
          category: string
          contact_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          phone: string
          price?: number | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          time_frame?: string | null
          title: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          business_name?: string
          category?: string
          contact_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          phone?: string
          price?: number | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          time_frame?: string | null
          title?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_service_options: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          location_area: string | null
          price: number | null
          time_frame: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          location_area?: string | null
          price?: number | null
          time_frame?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          location_area?: string | null
          price?: number | null
          time_frame?: string | null
          title?: string | null
        }
        Relationships: []
      }
      public_suppliers: {
        Row: {
          business_name: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          location: string | null
          price: number | null
          status: Database["public"]["Enums"]["supplier_status"] | null
          time_frame: string | null
          title: string | null
        }
        Insert: {
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          location?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          time_frame?: string | null
          title?: string | null
        }
        Update: {
          business_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          location?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          time_frame?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      create_admin_user: {
        Args: { user_email: string; user_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "New"
        | "InProgress"
        | "Matched"
        | "Completed"
        | "Cancelled"
      subscription_plan: "free" | "basic" | "pro" | "unlimited"
      supplier_status: "Pending" | "Active" | "Inactive"
      verification_status: "none" | "pending" | "verified" | "top_pro"
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
      booking_status: [
        "New",
        "InProgress",
        "Matched",
        "Completed",
        "Cancelled",
      ],
      subscription_plan: ["free", "basic", "pro", "unlimited"],
      supplier_status: ["Pending", "Active", "Inactive"],
      verification_status: ["none", "pending", "verified", "top_pro"],
    },
  },
} as const

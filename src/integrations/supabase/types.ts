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
      supplier_status: "Pending" | "Active" | "Inactive"
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
      supplier_status: ["Pending", "Active", "Inactive"],
    },
  },
} as const

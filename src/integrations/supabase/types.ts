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
      addresses: {
        Row: {
          address_id: string
          city: string | null
          country: string | null
          is_default: boolean | null
          latitude: number
          longitude: number
          postal_code: string | null
          state: string | null
          street_address: string | null
          user_id: string
        }
        Insert: {
          address_id?: string
          city?: string | null
          country?: string | null
          is_default?: boolean | null
          latitude: number
          longitude: number
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          user_id: string
        }
        Update: {
          address_id?: string
          city?: string | null
          country?: string | null
          is_default?: boolean | null
          latitude?: number
          longitude?: number
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action_id: string
          action_type: string
          admin_id: string
          created_at: string | null
          details: string | null
          target_user_id: string | null
        }
        Insert: {
          action_id?: string
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_id?: string
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      booking_recurrence: {
        Row: {
          booking_id: string
          day_of_week: number | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          recurrence_id: string
          start_date: string
        }
        Insert: {
          booking_id: string
          day_of_week?: number | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          recurrence_id?: string
          start_date: string
        }
        Update: {
          booking_id?: string
          day_of_week?: number | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          recurrence_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_recurrence_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_id: string
          client_id: string
          created_at: string | null
          end_time: string | null
          final_cost: number
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          task_id: string
          tasker_id: string
        }
        Insert: {
          booking_id?: string
          client_id: string
          created_at?: string | null
          end_time?: string | null
          final_cost: number
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          task_id: string
          tasker_id: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          created_at?: string | null
          end_time?: string | null
          final_cost?: number
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          task_id?: string
          tasker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "bookings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "bookings_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "taskers"
            referencedColumns: ["tasker_id"]
          },
        ]
      }
      categories: {
        Row: {
          base_price: number | null
          category_id: string
          description: string | null
          duration_minutes: number | null
          kyc_required: boolean | null
          name: string
          pricing_type: Database["public"]["Enums"]["pricing_type"] | null
        }
        Insert: {
          base_price?: number | null
          category_id?: string
          description?: string | null
          duration_minutes?: number | null
          kyc_required?: boolean | null
          name: string
          pricing_type?: Database["public"]["Enums"]["pricing_type"] | null
        }
        Update: {
          base_price?: number | null
          category_id?: string
          description?: string | null
          duration_minutes?: number | null
          kyc_required?: boolean | null
          name?: string
          pricing_type?: Database["public"]["Enums"]["pricing_type"] | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          client_id: string
          userid: string
        }
        Insert: {
          client_id?: string
          userid: string
        }
        Update: {
          client_id?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_userid_fkey"
            columns: ["userid"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      offers: {
        Row: {
          created_at: string | null
          message: string | null
          offer_details: Json | null
          offer_id: string
          offered_price: number
          status: Database["public"]["Enums"]["offer_status"] | null
          task_id: string
          tasker_id: string
        }
        Insert: {
          created_at?: string | null
          message?: string | null
          offer_details?: Json | null
          offer_id?: string
          offered_price: number
          status?: Database["public"]["Enums"]["offer_status"] | null
          task_id: string
          tasker_id: string
        }
        Update: {
          created_at?: string | null
          message?: string | null
          offer_details?: Json | null
          offer_id?: string
          offered_price?: number
          status?: Database["public"]["Enums"]["offer_status"] | null
          task_id?: string
          tasker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "offers_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "taskers"
            referencedColumns: ["tasker_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          payment_id: string
          paypal_authorization_id: string | null
          paypal_capture_id: string | null
          paypal_payout_id: string | null
          platform_fee: number | null
          tasker_payout: number | null
          transaction_status:
            | Database["public"]["Enums"]["transaction_status"]
            | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          payment_id?: string
          paypal_authorization_id?: string | null
          paypal_capture_id?: string | null
          paypal_payout_id?: string | null
          platform_fee?: number | null
          tasker_payout?: number | null
          transaction_status?:
            | Database["public"]["Enums"]["transaction_status"]
            | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          payment_id?: string
          paypal_authorization_id?: string | null
          paypal_capture_id?: string | null
          paypal_payout_id?: string | null
          platform_fee?: number | null
          tasker_payout?: number | null
          transaction_status?:
            | Database["public"]["Enums"]["transaction_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          rating: number
          review_id: string
          reviewed_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          rating: number
          review_id?: string
          reviewed_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          rating?: number
          review_id?: string
          reviewed_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      task_messages: {
        Row: {
          content: string
          created_at: string | null
          message_id: string
          metadata: Json | null
          sender_user_id: string
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          message_id?: string
          metadata?: Json | null
          sender_user_id: string
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          message_id?: string
          metadata?: Json | null
          sender_user_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
          {
            foreignKeyName: "task_messages_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["task_id"]
          },
        ]
      }
      tasker_kyc: {
        Row: {
          document_back_url: string | null
          document_front_url: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          kyc_id: string
          tasker_id: string
          verification_date: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          document_back_url?: string | null
          document_front_url?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          kyc_id?: string
          tasker_id: string
          verification_date?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          document_back_url?: string | null
          document_front_url?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          kyc_id?: string
          tasker_id?: string
          verification_date?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "tasker_kyc_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: true
            referencedRelation: "taskers"
            referencedColumns: ["tasker_id"]
          },
        ]
      }
      tasker_skills: {
        Row: {
          category_id: string
          tasker_id: string
        }
        Insert: {
          category_id: string
          tasker_id: string
        }
        Update: {
          category_id?: string
          tasker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasker_skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "tasker_skills_tasker_id_fkey"
            columns: ["tasker_id"]
            isOneToOne: false
            referencedRelation: "taskers"
            referencedColumns: ["tasker_id"]
          },
        ]
      }
      taskers: {
        Row: {
          background_check_status:
            | Database["public"]["Enums"]["background_check_status"]
            | null
          bio: string | null
          hourly_rate: number | null
          is_active: boolean | null
          service_radius_km: number | null
          tasker_id: string
          userid: string
        }
        Insert: {
          background_check_status?:
            | Database["public"]["Enums"]["background_check_status"]
            | null
          bio?: string | null
          hourly_rate?: number | null
          is_active?: boolean | null
          service_radius_km?: number | null
          tasker_id?: string
          userid: string
        }
        Update: {
          background_check_status?:
            | Database["public"]["Enums"]["background_check_status"]
            | null
          bio?: string | null
          hourly_rate?: number | null
          is_active?: boolean | null
          service_radius_km?: number | null
          tasker_id?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "taskers_userid_fkey"
            columns: ["userid"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["userid"]
          },
        ]
      }
      tasks: {
        Row: {
          address_id: string
          budget: number | null
          category_id: string
          client_id: string
          created_at: string | null
          description: string
          is_repeat: boolean | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_id: string
          title: string
        }
        Insert: {
          address_id: string
          budget?: number | null
          category_id: string
          client_id: string
          created_at?: string | null
          description: string
          is_repeat?: boolean | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
          title: string
        }
        Update: {
          address_id?: string
          budget?: number | null
          category_id?: string
          client_id?: string
          created_at?: string | null
          description?: string
          is_repeat?: boolean | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["address_id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          name: string
          password_hash: string
          phone_number: string | null
          registration_date: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          surname: string
          userid: string
        }
        Insert: {
          email: string
          name: string
          password_hash: string
          phone_number?: string | null
          registration_date?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          surname: string
          userid?: string
        }
        Update: {
          email?: string
          name?: string
          password_hash?: string
          phone_number?: string | null
          registration_date?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          surname?: string
          userid?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          log_id: string
          payload: Json
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          log_id?: string
          payload: Json
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          log_id?: string
          payload?: Json
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      background_check_status: "Pending" | "Cleared" | "Rejected"
      booking_status: "Scheduled" | "InProgress" | "Completed" | "Cancelled"
      document_type: "ID" | "Passport"
      offer_status: "Pending" | "Accepted" | "Rejected"
      pricing_type: "Fixed" | "Flexible"
      recurrence_frequency: "Weekly" | "Biweekly" | "Monthly"
      task_status:
        | "Open"
        | "Assigned"
        | "InProgress"
        | "Completed"
        | "Cancelled"
      transaction_status:
        | "Authorized"
        | "Captured"
        | "Refunded"
        | "Failed"
        | "Voided"
      user_role: "User" | "Admin"
      verification_status: "NotSubmitted" | "Pending" | "Cleared" | "Rejected"
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
      background_check_status: ["Pending", "Cleared", "Rejected"],
      booking_status: ["Scheduled", "InProgress", "Completed", "Cancelled"],
      document_type: ["ID", "Passport"],
      offer_status: ["Pending", "Accepted", "Rejected"],
      pricing_type: ["Fixed", "Flexible"],
      recurrence_frequency: ["Weekly", "Biweekly", "Monthly"],
      task_status: ["Open", "Assigned", "InProgress", "Completed", "Cancelled"],
      transaction_status: [
        "Authorized",
        "Captured",
        "Refunded",
        "Failed",
        "Voided",
      ],
      user_role: ["User", "Admin"],
      verification_status: ["NotSubmitted", "Pending", "Cleared", "Rejected"],
    },
  },
} as const

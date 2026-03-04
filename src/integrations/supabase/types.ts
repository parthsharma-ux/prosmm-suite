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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          status: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: boolean
        }
        Relationships: []
      }
      orders: {
        Row: {
          charge: number
          created_at: string
          id: string
          link: string
          provider_id: string | null
          provider_order_id: string | null
          public_service_id: string | null
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Insert: {
          charge?: number
          created_at?: string
          id?: string
          link: string
          provider_id?: string | null
          provider_order_id?: string | null
          public_service_id?: string | null
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          user_id: string
        }
        Update: {
          charge?: number
          created_at?: string
          id?: string
          link?: string
          provider_id?: string | null
          provider_order_id?: string | null
          public_service_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_public_service_id_fkey"
            columns: ["public_service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          reference: string
          reject_reason: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          reference: string
          reject_reason?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          reference?: string
          reject_reason?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          status: Database["public"]["Enums"]["user_status"]
          user_id: string
          wallet_balance: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["user_status"]
          user_id: string
          wallet_balance?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["user_status"]
          user_id?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      provider_services: {
        Row: {
          created_at: string
          description: string | null
          external_service_id: string
          id: string
          max: number
          min: number
          name: string
          provider_id: string
          rate: number
          status: boolean
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_service_id: string
          id?: string
          max?: number
          min?: number
          name: string
          provider_id: string
          rate?: number
          status?: boolean
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          external_service_id?: string
          id?: string
          max?: number
          min?: number
          name?: string
          provider_id?: string
          rate?: number
          status?: boolean
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          api_key: string
          api_url: string
          created_at: string
          currency: string
          id: string
          name: string
          priority: number
          status: boolean
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string
          currency?: string
          id?: string
          name: string
          priority?: number
          status?: boolean
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string
          currency?: string
          id?: string
          name?: string
          priority?: number
          status?: boolean
        }
        Relationships: []
      }
      public_services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          max: number
          min: number
          name: string
          retail_rate: number
          status: boolean
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max?: number
          min?: number
          name: string
          retail_rate?: number
          status?: boolean
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max?: number
          min?: number
          name?: string
          retail_rate?: number
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "public_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_map: {
        Row: {
          custom_margin: number | null
          failover_enabled: boolean
          id: string
          priority: number
          provider_service_id: string
          public_service_id: string
        }
        Insert: {
          custom_margin?: number | null
          failover_enabled?: boolean
          id?: string
          priority?: number
          provider_service_id: string
          public_service_id: string
        }
        Update: {
          custom_margin?: number | null
          failover_enabled?: boolean
          id?: string
          priority?: number
          provider_service_id?: string
          public_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_map_provider_service_id_fkey"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_map_public_service_id_fkey"
            columns: ["public_service_id"]
            isOneToOne: false
            referencedRelation: "public_services"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "partial"
        | "cancelled"
        | "failed"
      payment_method: "upi" | "usdt"
      payment_status: "pending" | "approved" | "rejected"
      transaction_type: "credit" | "debit" | "refund" | "adjustment"
      user_status: "active" | "suspended"
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
      app_role: ["admin", "user"],
      order_status: [
        "pending",
        "processing",
        "completed",
        "partial",
        "cancelled",
        "failed",
      ],
      payment_method: ["upi", "usdt"],
      payment_status: ["pending", "approved", "rejected"],
      transaction_type: ["credit", "debit", "refund", "adjustment"],
      user_status: ["active", "suspended"],
    },
  },
} as const

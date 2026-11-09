export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_email: string;
          actor_id: string | null;
          company_id: string | null;
          created_at: string;
          details: Json;
          entity: string;
          entity_id: string;
          id: string;
        };
        Insert: {
          action: string;
          actor_email?: string;
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          details?: Json;
          entity?: string;
          entity_id?: string;
          id?: string;
        };
        Update: {
          action?: string;
          actor_email?: string;
          actor_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          details?: Json;
          entity?: string;
          entity_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      action_items: {
        Row: {
          assigned_to: string | null;
          company_id: string;
          data: Json;
          id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          company_id: string;
          data?: Json;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          assigned_to?: string | null;
          company_id?: string;
          data?: Json;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "action_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_items: {
        Row: {
          company_id: string;
          data: Json;
          id: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          data?: Json;
          id?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          data?: Json;
          id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      compliance_items: {
        Row: {
          category: string;
          company_id: string;
          created_by: string | null;
          data: Json;
          id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          company_id: string;
          created_by?: string | null;
          data?: Json;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          company_id?: string;
          created_by?: string | null;
          data?: Json;
          id?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "compliance_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      executive_reports: {
        Row: {
          company_id: string;
          data: Json;
          id: string;
          month_key: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          data?: Json;
          id?: string;
          month_key?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          data?: Json;
          id?: string;
          month_key?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "executive_reports_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      repository_matters: {
        Row: {
          company_id: string;
          data: Json;
          id: string;
          matter_type: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          data?: Json;
          id?: string;
          matter_type?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          data?: Json;
          id?: string;
          matter_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "repository_matters_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          cfo_firm: string;
          cfo_name: string;
          cin: string;
          company_name: string;
          created_at: string;
          financial_year: string;
          gstin: string;
          id: string;
          is_active: boolean;
          legal_entity: string;
          pan: string;
          sector: string;
        };
        Insert: {
          cfo_firm?: string;
          cfo_name?: string;
          cin?: string;
          company_name: string;
          created_at?: string;
          financial_year?: string;
          gstin?: string;
          id: string;
          is_active?: boolean;
          legal_entity?: string;
          pan?: string;
          sector?: string;
        };
        Update: {
          cfo_firm?: string;
          cfo_name?: string;
          cin?: string;
          company_name?: string;
          created_at?: string;
          financial_year?: string;
          gstin?: string;
          id?: string;
          is_active?: boolean;
          legal_entity?: string;
          pan?: string;
          sector?: string;
        };
        Relationships: [];
      };
      mis_remarks: {
        Row: {
          author_id: string;
          author_name: string;
          author_role: Database["public"]["Enums"]["app_role"];
          cfo_response: string | null;
          cfo_response_at: string | null;
          company_id: string;
          created_at: string;
          id: string;
          line_ref: string;
          page_key: string;
          period: string;
          reason_category: string;
          remark: string;
        };
        Insert: {
          author_id: string;
          author_name?: string;
          author_role?: Database["public"]["Enums"]["app_role"];
          cfo_response?: string | null;
          cfo_response_at?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          line_ref?: string;
          page_key: string;
          period?: string;
          reason_category?: string;
          remark: string;
        };
        Update: {
          author_id?: string;
          author_name?: string;
          author_role?: Database["public"]["Enums"]["app_role"];
          cfo_response?: string | null;
          cfo_response_at?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          line_ref?: string;
          page_key?: string;
          period?: string;
          reason_category?: string;
          remark?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mis_remarks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      mis_uploads: {
        Row: {
          company_id: string;
          created_at: string;
          file_name: string;
          id: string;
          period: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          row_count: number;
          rows: Json;
          statement_type: string;
          status: string;
          uploaded_by: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          file_name?: string;
          id?: string;
          period: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          row_count?: number;
          rows?: Json;
          statement_type: string;
          status?: string;
          uploaded_by: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          file_name?: string;
          id?: string;
          period?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          row_count?: number;
          rows?: Json;
          statement_type?: string;
          status?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mis_uploads_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          designation: string;
          email: string;
          full_name: string;
          id: string;
          is_active: boolean;
        };
        Insert: {
          created_at?: string;
          designation?: string;
          email: string;
          full_name?: string;
          id: string;
          is_active?: boolean;
        };
        Update: {
          created_at?: string;
          designation?: string;
          email?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };
      user_company_access: {
        Row: {
          can_edit: boolean;
          company_id: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          can_edit?: boolean;
          company_id: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          can_edit?: boolean;
          company_id?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_company_access_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_edit_company: {
        Args: { _company_id: string; _user_id: string };
        Returns: boolean;
      };
      can_view_company: {
        Args: { _company_id: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "cfo" | "client_team" | "client";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "cfo", "client_team", "client"],
    },
  },
} as const;

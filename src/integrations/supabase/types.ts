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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_detection_results: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          detected_features: Json | null
          detection_type: string
          error_message: string | null
          geojson_output: Json | null
          id: string
          image_url: string
          metadata: Json | null
          processing_status: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          detected_features?: Json | null
          detection_type: string
          error_message?: string | null
          geojson_output?: Json | null
          id?: string
          image_url: string
          metadata?: Json | null
          processing_status?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          detected_features?: Json | null
          detection_type?: string
          error_message?: string | null
          geojson_output?: Json | null
          id?: string
          image_url?: string
          metadata?: Json | null
          processing_status?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_detection_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_results: {
        Row: {
          analysis_type: string
          created_at: string
          dataset_id: string | null
          explanations: Json | null
          id: string
          project_id: string
          results: Json
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          dataset_id?: string | null
          explanations?: Json | null
          id?: string
          project_id: string
          results: Json
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          dataset_id?: string | null
          explanations?: Json | null
          id?: string
          project_id?: string
          results?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      corridor_designs: {
        Row: {
          created_at: string
          geojson_data: Json
          id: string
          metadata: Json | null
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          geojson_data: Json
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          geojson_data?: Json
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corridor_designs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      corridor_observations: {
        Row: {
          connectivity_notes: string | null
          corridor_type: string | null
          created_at: string | null
          description: string | null
          geojson_data: Json
          id: string
          metadata: Json | null
          name: string
          priority: string | null
          project_id: string
          risk_factors: string[] | null
          status: string | null
          target_species: string[] | null
          updated_at: string | null
          user_id: string
          width_meters: number | null
        }
        Insert: {
          connectivity_notes?: string | null
          corridor_type?: string | null
          created_at?: string | null
          description?: string | null
          geojson_data: Json
          id?: string
          metadata?: Json | null
          name: string
          priority?: string | null
          project_id: string
          risk_factors?: string[] | null
          status?: string | null
          target_species?: string[] | null
          updated_at?: string | null
          user_id: string
          width_meters?: number | null
        }
        Update: {
          connectivity_notes?: string | null
          corridor_type?: string | null
          created_at?: string | null
          description?: string | null
          geojson_data?: Json
          id?: string
          metadata?: Json | null
          name?: string
          priority?: string | null
          project_id?: string
          risk_factors?: string[] | null
          status?: string | null
          target_species?: string[] | null
          updated_at?: string | null
          user_id?: string
          width_meters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "corridor_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string
          file_type: string
          file_url: string | null
          geojson_data: Json | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url?: string | null
          geojson_data?: Json | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string | null
          geojson_data?: Json | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "datasets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      field_observations: {
        Row: {
          created_at: string | null
          description: string | null
          habitat_type: string | null
          id: string
          infrastructure_type: string | null
          latitude: number
          longitude: number
          metadata: Json | null
          observation_type: string
          photo_urls: string[] | null
          project_id: string
          risk_level: string | null
          species_observed: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          habitat_type?: string | null
          id?: string
          infrastructure_type?: string | null
          latitude: number
          longitude: number
          metadata?: Json | null
          observation_type: string
          photo_urls?: string[] | null
          project_id: string
          risk_level?: string | null
          species_observed?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          habitat_type?: string | null
          id?: string
          infrastructure_type?: string | null
          latitude?: number
          longitude?: number
          metadata?: Json | null
          observation_type?: string
          photo_urls?: string[] | null
          project_id?: string
          risk_level?: string | null
          species_observed?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      google_form_imports: {
        Row: {
          created_at: string | null
          error_log: Json | null
          failed_count: number | null
          form_type: string
          id: string
          import_source: string
          processed_count: number | null
          project_id: string
          raw_data: Json
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_log?: Json | null
          failed_count?: number | null
          form_type: string
          id?: string
          import_source: string
          processed_count?: number | null
          project_id: string
          raw_data: Json
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_log?: Json | null
          failed_count?: number | null
          form_type?: string
          id?: string
          import_source?: string
          processed_count?: number | null
          project_id?: string
          raw_data?: Json
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_form_imports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          organization: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          organization?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          region: string | null
          species: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          region?: string | null
          species?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          region?: string | null
          species?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          pdf_url: string | null
          project_id: string
          report_data: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_url?: string | null
          project_id: string
          report_data: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pdf_url?: string | null
          project_id?: string
          report_data?: Json
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_analysis_results: {
        Row: {
          affected_geojson: Json | null
          affected_trees: number
          buffer_meters: number
          created_at: string
          development_dataset_id: string | null
          id: string
          project_id: string
          safe_geojson: Json | null
          safe_trees: number
          summary: Json | null
          total_trees: number
          tree_loss_percentage: number
          trees_dataset_id: string | null
          user_id: string
        }
        Insert: {
          affected_geojson?: Json | null
          affected_trees: number
          buffer_meters?: number
          created_at?: string
          development_dataset_id?: string | null
          id?: string
          project_id: string
          safe_geojson?: Json | null
          safe_trees: number
          summary?: Json | null
          total_trees: number
          tree_loss_percentage: number
          trees_dataset_id?: string | null
          user_id: string
        }
        Update: {
          affected_geojson?: Json | null
          affected_trees?: number
          buffer_meters?: number
          created_at?: string
          development_dataset_id?: string | null
          id?: string
          project_id?: string
          safe_geojson?: Json | null
          safe_trees?: number
          summary?: Json | null
          total_trees?: number
          tree_loss_percentage?: number
          trees_dataset_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_analysis_results_development_dataset_id_fkey"
            columns: ["development_dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_analysis_results_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_analysis_results_trees_dataset_id_fkey"
            columns: ["trees_dataset_id"]
            isOneToOne: false
            referencedRelation: "tree_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_datasets: {
        Row: {
          created_at: string
          dataset_type: string
          geojson_data: Json
          id: string
          metadata: Json | null
          name: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset_type: string
          geojson_data: Json
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dataset_type?: string
          geojson_data?: Json
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_datasets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_observations: {
        Row: {
          age_years: number | null
          canopy_diameter_meters: number | null
          created_at: string | null
          health_status: string | null
          height_meters: number | null
          id: string
          impact_reason: string | null
          impact_status: string | null
          latitude: number
          longitude: number
          metadata: Json | null
          notes: string | null
          observation_date: string | null
          photo_urls: string[] | null
          project_id: string
          species: string | null
          tree_id: string | null
          trunk_diameter_cm: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age_years?: number | null
          canopy_diameter_meters?: number | null
          created_at?: string | null
          health_status?: string | null
          height_meters?: number | null
          id?: string
          impact_reason?: string | null
          impact_status?: string | null
          latitude: number
          longitude: number
          metadata?: Json | null
          notes?: string | null
          observation_date?: string | null
          photo_urls?: string[] | null
          project_id: string
          species?: string | null
          tree_id?: string | null
          trunk_diameter_cm?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age_years?: number | null
          canopy_diameter_meters?: number | null
          created_at?: string | null
          health_status?: string | null
          height_meters?: number | null
          id?: string
          impact_reason?: string | null
          impact_status?: string | null
          latitude?: number
          longitude?: number
          metadata?: Json | null
          notes?: string | null
          observation_date?: string | null
          photo_urls?: string[] | null
          project_id?: string
          species?: string | null
          tree_id?: string | null
          trunk_diameter_cm?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_observations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "planner" | "ngo" | "researcher" | "admin"
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
      app_role: ["planner", "ngo", "researcher", "admin"],
    },
  },
} as const

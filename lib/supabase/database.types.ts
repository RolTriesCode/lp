/**
 * Generated-style public schema definitions for the foundation migration.
 * Regenerate from the database after every migration; see docs/supabase.md.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          preferences: Json;
          preferred_grade_level: string | null;
          preferred_subjects: string[];
          role_title: string;
          schema_version: string;
          school_logo_path: string | null;
          school_name: string | null;
          status: Database["public"]["Enums"]["profile_status"];
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          preferences?: Json;
          preferred_grade_level?: string | null;
          preferred_subjects?: string[];
          role_title?: string;
          schema_version?: string;
          school_logo_path?: string | null;
          school_name?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          preferences?: Json;
          preferred_grade_level?: string | null;
          preferred_subjects?: string[];
          role_title?: string;
          schema_version?: string;
          school_logo_path?: string | null;
          school_name?: string | null;
          status?: Database["public"]["Enums"]["profile_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_plans: {
        Row: {
          content: Json;
          created_at: string;
          curriculum: Database["public"]["Enums"]["curriculum_code"];
          grade_level: string;
          id: string;
          lesson_type: Database["public"]["Enums"]["lesson_plan_type"];
          prototype_source_id: string | null;
          quarter: string;
          revision: number;
          schema_version: string;
          status: Database["public"]["Enums"]["record_status"];
          subject: string;
          title: string;
          topic: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          curriculum: Database["public"]["Enums"]["curriculum_code"];
          grade_level: string;
          id?: string;
          lesson_type: Database["public"]["Enums"]["lesson_plan_type"];
          prototype_source_id?: string | null;
          quarter: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          subject: string;
          title: string;
          topic: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          curriculum?: Database["public"]["Enums"]["curriculum_code"];
          grade_level?: string;
          id?: string;
          lesson_type?: Database["public"]["Enums"]["lesson_plan_type"];
          prototype_source_id?: string | null;
          quarter?: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          subject?: string;
          title?: string;
          topic?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      presentations: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          lesson_plan_id: string;
          revision: number;
          schema_version: string;
          slide_count: number;
          status: Database["public"]["Enums"]["record_status"];
          theme: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          id?: string;
          lesson_plan_id: string;
          revision?: number;
          schema_version?: string;
          slide_count?: number;
          status?: Database["public"]["Enums"]["record_status"];
          theme: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          lesson_plan_id?: string;
          revision?: number;
          schema_version?: string;
          slide_count?: number;
          status?: Database["public"]["Enums"]["record_status"];
          theme?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "presentations_lesson_owner_fk";
            columns: ["lesson_plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lesson_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      assessments: {
        Row: {
          content: Json;
          created_at: string;
          difficulty: string;
          id: string;
          item_count: number;
          lesson_plan_id: string;
          revision: number;
          schema_version: string;
          status: Database["public"]["Enums"]["record_status"];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          difficulty: string;
          id?: string;
          item_count?: number;
          lesson_plan_id: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          difficulty?: string;
          id?: string;
          item_count?: number;
          lesson_plan_id?: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_lesson_owner_fk";
            columns: ["lesson_plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lesson_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      worksheets: {
        Row: {
          content: Json;
          created_at: string;
          difficulty: string;
          id: string;
          item_count: number;
          lesson_plan_id: string;
          revision: number;
          schema_version: string;
          status: Database["public"]["Enums"]["record_status"];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          difficulty: string;
          id?: string;
          item_count?: number;
          lesson_plan_id: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          difficulty?: string;
          id?: string;
          item_count?: number;
          lesson_plan_id?: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "worksheets_lesson_owner_fk";
            columns: ["lesson_plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lesson_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      templates: {
        Row: {
          content: Json;
          created_at: string;
          curriculum: Database["public"]["Enums"]["curriculum_code"];
          description: string;
          grade_level: string;
          id: string;
          name: string;
          revision: number;
          schema_version: string;
          source_lesson_id: string | null;
          status: Database["public"]["Enums"]["record_status"];
          subject: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          curriculum: Database["public"]["Enums"]["curriculum_code"];
          description?: string;
          grade_level: string;
          id?: string;
          name: string;
          revision?: number;
          schema_version?: string;
          source_lesson_id?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          subject: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: Json;
          created_at?: string;
          curriculum?: Database["public"]["Enums"]["curriculum_code"];
          description?: string;
          grade_level?: string;
          id?: string;
          name?: string;
          revision?: number;
          schema_version?: string;
          source_lesson_id?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          subject?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "templates_source_lesson_owner_fk";
            columns: ["source_lesson_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lesson_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      uploaded_resources: {
        Row: {
          byte_size: number;
          content: Json;
          created_at: string;
          extraction_status: Database["public"]["Enums"]["resource_extraction_status"];
          id: string;
          mime_type: string;
          name: string;
          revision: number;
          schema_version: string;
          status: Database["public"]["Enums"]["record_status"];
          storage_bucket: string | null;
          storage_path: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          byte_size: number;
          content?: Json;
          created_at?: string;
          extraction_status?: Database["public"]["Enums"]["resource_extraction_status"];
          id?: string;
          mime_type: string;
          name: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          storage_bucket?: string | null;
          storage_path?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          byte_size?: number;
          content?: Json;
          created_at?: string;
          extraction_status?: Database["public"]["Enums"]["resource_extraction_status"];
          id?: string;
          mime_type?: string;
          name?: string;
          revision?: number;
          schema_version?: string;
          status?: Database["public"]["Enums"]["record_status"];
          storage_bucket?: string | null;
          storage_path?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      schedule_entries: {
        Row: {
          assessment_id: string | null;
          created_at: string;
          ends_at: string;
          id: string;
          kind: Database["public"]["Enums"]["schedule_entry_kind"];
          lesson_plan_id: string | null;
          notes: string;
          revision: number;
          schema_version: string;
          starts_at: string;
          status: Database["public"]["Enums"]["schedule_entry_status"];
          subject: string | null;
          teaching_pack_lesson_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          assessment_id?: string | null;
          created_at?: string;
          ends_at: string;
          id?: string;
          kind: Database["public"]["Enums"]["schedule_entry_kind"];
          lesson_plan_id?: string | null;
          notes?: string;
          revision?: number;
          schema_version?: string;
          starts_at: string;
          status?: Database["public"]["Enums"]["schedule_entry_status"];
          subject?: string | null;
          teaching_pack_lesson_id?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          assessment_id?: string | null;
          created_at?: string;
          ends_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["schedule_entry_kind"];
          lesson_plan_id?: string | null;
          notes?: string;
          revision?: number;
          schema_version?: string;
          starts_at?: string;
          status?: Database["public"]["Enums"]["schedule_entry_status"];
          subject?: string | null;
          teaching_pack_lesson_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_entries_lesson_owner_fk";
            columns: ["lesson_plan_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lesson_plans";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "schedule_entries_assessment_owner_fk";
            columns: ["assessment_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "schedule_entries_pack_lesson_owner_fk";
            columns: ["teaching_pack_lesson_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "lesson_plans";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      classroom_contexts: {
        Row: {
          available_resources: string[];
          class_size: string;
          created_at: string;
          language: string;
          learner_needs: string[];
          preferred_duration: string;
          revision: number;
          schema_version: string;
          teacher_notes: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          available_resources?: string[];
          class_size?: string;
          created_at?: string;
          language?: string;
          learner_needs?: string[];
          preferred_duration?: string;
          revision?: number;
          schema_version?: string;
          teacher_notes?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          available_resources?: string[];
          class_size?: string;
          created_at?: string;
          language?: string;
          learner_needs?: string[];
          preferred_duration?: string;
          revision?: number;
          schema_version?: string;
          teacher_notes?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      curriculum_code: "MATATAG" | "ILAW";
      lesson_plan_type: "DETAILED" | "SEMI_DETAILED" | "DAILY_LOG";
      profile_status: "active" | "suspended";
      record_status: "draft" | "ready" | "archived" | "error";
      resource_extraction_status: "pending" | "processing" | "complete" | "truncated" | "failed";
      schedule_entry_kind: "lesson" | "assessment" | "teaching_pack" | "other";
      schedule_entry_status: "planned" | "completed" | "cancelled";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];

export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Insert"];

export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Update"];

export type Enums<EnumName extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][EnumName];

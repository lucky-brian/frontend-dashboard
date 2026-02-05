/**
 * Types สำหรับตารางใน Supabase
 * สอดคล้องกับ supabase/migrations/20250203000000_initial_tables.sql
 */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface Database {
  public: {
    Tables: {
      frontend_member: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      convention_type: {
        Row: {
          id: string;
          value: string;
          label: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          value: string;
          label: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          value?: string;
          label?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      topic_convention_option: {
        Row: {
          id: string;
          title: string;
          type_id: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type_id: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type_id?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      convention_rules: {
        Row: {
          id: string;
          topic_id: string;
          rule_text: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          rule_text: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          rule_text?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      action_rules: {
        Row: {
          id: string;
          topic_id: string;
          label: string;
          value: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          label: string;
          value: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic_id?: string;
          label?: string;
          value?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      convention_logs: {
        Row: {
          id: string;
          log_date: string;
          member_id: string;
          type: string;
          topic_id: string;
          action_rule_id: string;
          sprint: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          log_date: string;
          member_id: string;
          type: string;
          topic_id: string;
          action_rule_id: string;
          sprint?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          log_date?: string;
          member_id?: string;
          type?: string;
          topic_id?: string;
          action_rule_id?: string;
          sprint?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
      };
      member_convention_summary: {
        Row: {
          member_id: string;
          violation_count: number;
          updated_at: string;
        };
        Insert: {
          member_id: string;
          violation_count?: number;
          updated_at?: string;
        };
        Update: {
          member_id?: string;
          violation_count?: number;
          updated_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          actor_name: string;
          action_type: string;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_name: string;
          action_type: string;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_name?: string;
          action_type?: string;
          description?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}

/** Row types สำหรับใช้ใน component */
export type FrontendMember = Database["public"]["Tables"]["frontend_member"]["Row"];
export type ConventionType = Database["public"]["Tables"]["convention_type"]["Row"];
export type TopicConventionOption =
  Database["public"]["Tables"]["topic_convention_option"]["Row"];
export type ConventionRule = Database["public"]["Tables"]["convention_rules"]["Row"];
export type ActionRule = Database["public"]["Tables"]["action_rules"]["Row"];
export type ConventionLog = Database["public"]["Tables"]["convention_logs"]["Row"];
export type MemberConventionSummary =
  Database["public"]["Tables"]["member_convention_summary"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];

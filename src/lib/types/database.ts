export type Role = "viewer" | "editor" | "admin" | "super_admin";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          settings?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          role: Role;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          role?: Role;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string | null;
          role?: Role;
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      content: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          type: string;
          data: Record<string, unknown>;
          is_published: boolean;
          sort_order: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          type?: string;
          data?: Record<string, unknown>;
          is_published?: boolean;
          sort_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          type?: string;
          data?: Record<string, unknown>;
          is_published?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: Role;
      };
      get_user_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ContentItem = Database["public"]["Tables"]["content"]["Row"];

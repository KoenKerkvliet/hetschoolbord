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
      pages: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          slug: string;
          hero_enabled: boolean;
          hero_title: string | null;
          hero_subtitle: string | null;
          hero_image_url: string | null;
          hero_full_width: boolean;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          slug: string;
          hero_enabled?: boolean;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          hero_image_url?: string | null;
          hero_full_width?: boolean;
          is_published?: boolean;
          sort_order?: number;
        };
        Update: {
          title?: string;
          slug?: string;
          hero_enabled?: boolean;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          hero_image_url?: string | null;
          hero_full_width?: boolean;
          is_published?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      page_rows: {
        Row: {
          id: string;
          page_id: string;
          layout: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          layout?: string;
          sort_order?: number;
        };
        Update: {
          layout?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          type: string;
        };
        Update: {
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      section_items: {
        Row: {
          id: string;
          section_id: string;
          title: string;
          data: Record<string, unknown>;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          title: string;
          data?: Record<string, unknown>;
          sort_order?: number;
          is_published?: boolean;
        };
        Update: {
          title?: string;
          data?: Record<string, unknown>;
          sort_order?: number;
          is_published?: boolean;
        };
        Relationships: [];
      };
      page_row_sections: {
        Row: {
          id: string;
          page_row_id: string;
          section_id: string;
          position: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          page_row_id: string;
          section_id: string;
          position?: string;
          sort_order?: number;
        };
        Update: {
          section_id?: string;
          position?: string;
          sort_order?: number;
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

// Pages & Sections types
export type Page = {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  hero_enabled: boolean;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_full_width: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PageRow = {
  id: string;
  page_id: string;
  layout: string;
  sort_order: number;
  created_at: string;
};

export type SectionType = "snelkoppelingen" | "mededelingen";

export type Section = {
  id: string;
  organization_id: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
};

export type SectionItem = {
  id: string;
  section_id: string;
  title: string;
  data: Record<string, unknown>;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type PageRowSection = {
  id: string;
  page_row_id: string;
  section_id: string;
  position: string;
  sort_order: number;
};

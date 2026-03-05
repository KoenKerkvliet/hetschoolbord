-- ============================================
-- Het Schoolbord - Pages & Sections Migration
-- ============================================

-- Pages (frontend pagina's)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  hero_enabled BOOLEAN DEFAULT false,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_full_width BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Page rows (rijen binnen een pagina)
CREATE TABLE page_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  layout TEXT NOT NULL DEFAULT 'full' CHECK (layout IN ('full', 'half')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sections (herbruikbare contentblokken)
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('snelkoppelingen', 'mededelingen')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Section items (items binnen een sectie)
CREATE TABLE section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Page row sections (koppeltabel: sectie in een rij-slot)
CREATE TABLE page_row_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_row_id UUID NOT NULL REFERENCES page_rows(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT 'full' CHECK (position IN ('full', 'left', 'right')),
  sort_order INT DEFAULT 0
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_pages_organization ON pages(organization_id);
CREATE INDEX idx_pages_published ON pages(organization_id, is_published);
CREATE INDEX idx_page_rows_page ON page_rows(page_id);
CREATE INDEX idx_sections_organization ON sections(organization_id);
CREATE INDEX idx_section_items_section ON section_items(section_id);
CREATE INDEX idx_page_row_sections_row ON page_row_sections(page_row_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_row_sections ENABLE ROW LEVEL SECURITY;

-- Pages policies
CREATE POLICY "Users can view pages in their organization"
  ON pages FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "Admins can insert pages"
  ON pages FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update pages in their organization"
  ON pages FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can delete pages in their organization"
  ON pages FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

-- Page rows policies (via page -> organization)
CREATE POLICY "Users can view page rows"
  ON page_rows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_rows.page_id
      AND (pages.organization_id = get_user_organization_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "Admins can insert page rows"
  ON page_rows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_rows.page_id
      AND pages.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update page rows"
  ON page_rows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_rows.page_id
      AND pages.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete page rows"
  ON page_rows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = page_rows.page_id
      AND pages.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

-- Sections policies
CREATE POLICY "Users can view sections in their organization"
  ON sections FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "Admins can insert sections"
  ON sections FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update sections in their organization"
  ON sections FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can delete sections in their organization"
  ON sections FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

-- Section items policies (via section -> organization)
CREATE POLICY "Users can view section items"
  ON section_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND (sections.organization_id = get_user_organization_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "Admins can insert section items"
  ON section_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND sections.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update section items"
  ON section_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND sections.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete section items"
  ON section_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND sections.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

-- Page row sections policies (via page_row -> page -> organization)
CREATE POLICY "Users can view page row sections"
  ON page_row_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM page_rows
      JOIN pages ON pages.id = page_rows.page_id
      WHERE page_rows.id = page_row_sections.page_row_id
      AND (pages.organization_id = get_user_organization_id() OR get_user_role() = 'super_admin')
    )
  );

CREATE POLICY "Admins can insert page row sections"
  ON page_row_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM page_rows
      JOIN pages ON pages.id = page_rows.page_id
      WHERE page_rows.id = page_row_sections.page_row_id
      AND pages.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update page row sections"
  ON page_row_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM page_rows
      JOIN pages ON pages.id = page_rows.page_id
      WHERE page_rows.id = page_row_sections.page_row_id
      AND pages.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete page row sections"
  ON page_row_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM page_rows
      JOIN pages ON pages.id = page_rows.page_id
      WHERE page_rows.id = page_row_sections.page_row_id
      AND pages.organization_id = get_user_organization_id()
      AND get_user_role() IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- Updated_at triggers
-- ============================================

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_section_items_updated_at
  BEFORE UPDATE ON section_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Enable Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE pages;
ALTER PUBLICATION supabase_realtime ADD TABLE sections;
ALTER PUBLICATION supabase_realtime ADD TABLE section_items;

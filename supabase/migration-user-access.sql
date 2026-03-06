-- ============================================
-- Het Schoolbord - User Section Access Migration
-- ============================================

-- Tabel: user_section_access (per-user zichtbaarheid per blok)
CREATE TABLE user_section_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, section_id)
);

CREATE INDEX idx_user_section_access_profile ON user_section_access(profile_id);
CREATE INDEX idx_user_section_access_section ON user_section_access(section_id);

ALTER TABLE user_section_access ENABLE ROW LEVEL SECURITY;

-- Gebruikers kunnen hun eigen access zien + admins kunnen alles in de org zien
CREATE POLICY "Users can view section access in their organization"
  ON user_section_access FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_section_access.profile_id
      AND p.organization_id = get_user_organization_id()
    )
    OR get_user_role() = 'super_admin'
  );

-- Admins kunnen access toewijzen
CREATE POLICY "Admins can insert section access"
  ON user_section_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_section_access.profile_id
      AND p.organization_id = get_user_organization_id()
    )
    AND get_user_role() IN ('admin', 'super_admin')
  );

-- Admins kunnen access verwijderen
CREATE POLICY "Admins can delete section access"
  ON user_section_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = user_section_access.profile_id
      AND p.organization_id = get_user_organization_id()
    )
    AND get_user_role() IN ('admin', 'super_admin')
  );

-- ============================================
-- Update section_items RLS: editors mogen ook items beheren
-- ============================================

DROP POLICY IF EXISTS "Admins can insert section items" ON section_items;
DROP POLICY IF EXISTS "Admins can update section items" ON section_items;
DROP POLICY IF EXISTS "Admins can delete section items" ON section_items;

CREATE POLICY "Editors can insert section items"
  ON section_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND sections.organization_id = get_user_organization_id()
      AND get_user_role() IN ('editor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can update section items"
  ON section_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND sections.organization_id = get_user_organization_id()
      AND get_user_role() IN ('editor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can delete section items"
  ON section_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sections
      WHERE sections.id = section_items.section_id
      AND sections.organization_id = get_user_organization_id()
      AND get_user_role() IN ('editor', 'admin', 'super_admin')
    )
  );

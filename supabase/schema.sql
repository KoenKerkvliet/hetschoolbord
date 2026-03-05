-- ============================================
-- Het Schoolbord - Database Schema
-- ============================================

-- Organizations (schools)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin', 'super_admin')),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content (narrowcasting items)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  data JSONB DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_content_organization ON content(organization_id);
CREATE INDEX idx_content_published ON content(organization_id, is_published);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's profile
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Organizations Policies
-- ============================================

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (
    id = get_user_organization_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "Super admins can insert organizations"
  ON organizations FOR INSERT
  WITH CHECK (get_user_role() = 'super_admin');

CREATE POLICY "Super admins can update organizations"
  ON organizations FOR UPDATE
  USING (get_user_role() = 'super_admin');

CREATE POLICY "Super admins can delete organizations"
  ON organizations FOR DELETE
  USING (get_user_role() = 'super_admin');

-- ============================================
-- Profiles Policies
-- ============================================

CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    OR get_user_role() = 'super_admin'
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their organization"
  ON profiles FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

CREATE POLICY "Super admins can manage all profiles"
  ON profiles FOR ALL
  USING (get_user_role() = 'super_admin');

-- ============================================
-- Content Policies
-- ============================================

CREATE POLICY "Users can view content in their organization"
  ON content FOR SELECT
  USING (
    organization_id = get_user_organization_id()
    OR get_user_role() = 'super_admin'
  );

CREATE POLICY "Editors can insert content"
  ON content FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('editor', 'admin', 'super_admin')
  );

CREATE POLICY "Editors can update content in their organization"
  ON content FOR UPDATE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('editor', 'admin', 'super_admin')
  );

CREATE POLICY "Editors can delete content in their organization"
  ON content FOR DELETE
  USING (
    organization_id = get_user_organization_id()
    AND get_user_role() IN ('editor', 'admin', 'super_admin')
  );

-- ============================================
-- Auto-create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- Updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Enable Realtime for content
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE content;

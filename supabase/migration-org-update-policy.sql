-- ==========================================================
-- Migratie: Admins mogen hun eigen organisatie updaten
-- ==========================================================
-- Huidige situatie: alleen super_admin kan organizations updaten.
-- Na deze migratie: admin + super_admin kunnen hun eigen organisatie updaten.

-- Verwijder de bestaande restrictieve policy
DROP POLICY IF EXISTS "Super admins can update organizations" ON organizations;

-- Nieuwe policy: admins en super_admins kunnen hun eigen organisatie updaten
CREATE POLICY "Admins can update their own organization"
  ON organizations FOR UPDATE
  USING (
    id = get_user_organization_id()
    AND get_user_role() IN ('admin', 'super_admin')
  );

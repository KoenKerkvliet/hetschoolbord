-- ============================================
-- Het Schoolbord - Seed Data
-- ============================================
-- Run this AFTER creating the super admin user via Supabase Auth
-- (sign up koen.kerkvliet@movare.nl first, then run this)

-- Create default organization
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Movare',
  'movare',
  '{"theme": "default"}'
) ON CONFLICT (slug) DO NOTHING;

-- Note: After signing up koen.kerkvliet@movare.nl, update the profile:
-- UPDATE profiles
-- SET role = 'super_admin',
--     organization_id = 'a0000000-0000-0000-0000-000000000001',
--     display_name = 'Koen Kerkvliet'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'koen.kerkvliet@movare.nl');

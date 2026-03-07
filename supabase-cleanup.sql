-- ============================================
-- Het Schoolbord - Database Cleanup
-- Voer dit uit in Supabase SQL Editor
-- ============================================
-- Dit script verwijdert ALLE tabellen, functies,
-- triggers en policies. Auth users blijven behouden.
-- ============================================

-- Stap 1: Verwijder tabellen uit realtime publicatie
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS content;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS sections;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS section_items;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS pages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS page_rows;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS page_row_sections;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS user_section_access;

-- Stap 2: Drop alle tabellen (CASCADE verwijdert ook policies en indexes)
DROP TABLE IF EXISTS user_section_access CASCADE;
DROP TABLE IF EXISTS page_row_sections CASCADE;
DROP TABLE IF EXISTS page_rows CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS section_items CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Stap 3: Drop triggers op auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Stap 4: Drop functies
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS get_user_role();
DROP FUNCTION IF EXISTS get_user_organization_id();

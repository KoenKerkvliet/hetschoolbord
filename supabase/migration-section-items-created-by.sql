-- ==========================================================
-- Migratie: created_by kolom voor section_items
-- ==========================================================
-- Voegt een 'created_by' kolom toe die verwijst naar profiles.
-- Hiermee kan per mededeling worden bijgehouden welke gebruiker
-- het item heeft aangemaakt (auteur weergave op frontend).

ALTER TABLE section_items ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

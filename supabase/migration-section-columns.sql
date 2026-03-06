-- ==========================================================
-- Migratie: Kolommen-instelling voor secties
-- ==========================================================
-- Voegt een 'columns' kolom toe aan de sections tabel.
-- Hiermee kan per sectie worden ingesteld hoeveel cards
-- naast elkaar worden getoond op de frontend.

ALTER TABLE sections ADD COLUMN IF NOT EXISTS columns INT DEFAULT 4;

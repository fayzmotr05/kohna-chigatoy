-- Add multilingual name/description columns to categories and menu_items.
-- Existing `name` column becomes the Uzbek default (renamed to name_uz).
-- Russian and English columns are nullable — fallback to Uzbek when empty.

-- ============================================================
-- Categories: add name_ru, name_en
-- ============================================================
ALTER TABLE categories RENAME COLUMN name TO name_uz;
ALTER TABLE categories ADD COLUMN name_ru TEXT;
ALTER TABLE categories ADD COLUMN name_en TEXT;

-- ============================================================
-- Menu items: add name_ru, name_en, description_uz (rename), description_ru, description_en
-- ============================================================
ALTER TABLE menu_items RENAME COLUMN name TO name_uz;
ALTER TABLE menu_items ADD COLUMN name_ru TEXT;
ALTER TABLE menu_items ADD COLUMN name_en TEXT;

ALTER TABLE menu_items RENAME COLUMN description TO description_uz;
ALTER TABLE menu_items ADD COLUMN description_ru TEXT;
ALTER TABLE menu_items ADD COLUMN description_en TEXT;

-- ============================================================
-- Backward-compatible views so existing queries still work
-- These expose `name` and `description` as aliases for the _uz columns.
-- ============================================================
-- (Not using views — we'll update the app code instead to be explicit.)

# Supabase Debug — Run these in SQL Editor

## Step 1: Check what columns exist

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'categories' ORDER BY ordinal_position;
```

```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'menu_items' ORDER BY ordinal_position;
```

## Step 2: Check if data exists

```sql
SELECT * FROM categories LIMIT 5;
```

```sql
SELECT * FROM menu_items LIMIT 5;
```

## Step 3: If columns are still "name" and "description" (rename didn't work), run this:

```sql
ALTER TABLE categories RENAME COLUMN name TO name_uz;
ALTER TABLE categories ADD COLUMN name_ru TEXT;
ALTER TABLE categories ADD COLUMN name_en TEXT;

ALTER TABLE menu_items RENAME COLUMN name TO name_uz;
ALTER TABLE menu_items ADD COLUMN name_ru TEXT;
ALTER TABLE menu_items ADD COLUMN name_en TEXT;

ALTER TABLE menu_items RENAME COLUMN description TO description_uz;
ALTER TABLE menu_items ADD COLUMN description_ru TEXT;
ALTER TABLE menu_items ADD COLUMN description_en TEXT;
```

## Step 4: If columns are "name_uz" but data is empty, your data was lost. Re-seed:

```sql
INSERT INTO categories (id, name_uz, name_ru, name_en, display_order, icon) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Uyg''ur taomlar', 'Уйгурские блюда', 'Uyghur Dishes', 1, '🍜'),
  ('a1000000-0000-0000-0000-000000000002', 'Milliy taomlar', 'Национальные блюда', 'National Dishes', 2, '🍚'),
  ('a1000000-0000-0000-0000-000000000003', 'Salatlar', 'Салаты', 'Salads', 3, '🥗'),
  ('a1000000-0000-0000-0000-000000000004', 'Shirinliklar', 'Десерты', 'Desserts', 4, '🍰')
ON CONFLICT (id) DO UPDATE SET
  name_uz = EXCLUDED.name_uz,
  name_ru = EXCLUDED.name_ru,
  name_en = EXCLUDED.name_en;
```

## Step 5: Verify everything works

```sql
SELECT id, name_uz, name_ru, name_en FROM categories;
```

```sql
SELECT id, name_uz, name_ru, name_en, description_uz FROM menu_items WHERE is_available = true;
```

# Deployment Guide — Multilingual + Bug Fixes

## STEP 1: Run Migration on Supabase (DO THIS FIRST)

Go to **Supabase Dashboard** > **SQL Editor** and run this:

```sql
-- ============================================================
-- Step 1: Rename existing columns to _uz
-- ============================================================
ALTER TABLE categories RENAME COLUMN name TO name_uz;
ALTER TABLE menu_items RENAME COLUMN name TO name_uz;
ALTER TABLE menu_items RENAME COLUMN description TO description_uz;

-- ============================================================
-- Step 2: Add Russian and English columns
-- ============================================================
ALTER TABLE categories ADD COLUMN name_ru TEXT;
ALTER TABLE categories ADD COLUMN name_en TEXT;

ALTER TABLE menu_items ADD COLUMN name_ru TEXT;
ALTER TABLE menu_items ADD COLUMN name_en TEXT;
ALTER TABLE menu_items ADD COLUMN description_ru TEXT;
ALTER TABLE menu_items ADD COLUMN description_en TEXT;
```

### After running, verify it worked:

```sql
SELECT id, name_uz, name_ru, name_en FROM categories LIMIT 5;
SELECT id, name_uz, name_ru, name_en, description_uz FROM menu_items LIMIT 5;
```

You should see your existing data in the `name_uz` and `description_uz` columns.
`name_ru` and `name_en` will be NULL (that's expected — the app falls back to Uzbek).

---

## STEP 2: (Optional) Add Russian/English translations to existing items

Run this to add translations for your seed data categories:

```sql
UPDATE categories SET name_ru = 'Уйгурские блюда', name_en = 'Uyghur Dishes' WHERE name_uz = 'Uyg''ur taomlar';
UPDATE categories SET name_ru = 'Национальные блюда', name_en = 'National Dishes' WHERE name_uz = 'Milliy taomlar';
UPDATE categories SET name_ru = 'Салаты', name_en = 'Salads' WHERE name_uz = 'Salatlar';
UPDATE categories SET name_ru = 'Десерты', name_en = 'Desserts' WHERE name_uz = 'Shirinliklar';
```

And for menu items (example for a few — do the rest as needed):

```sql
UPDATE menu_items SET name_ru = 'Лагман', name_en = 'Lagman', description_ru = 'Лагман ручной вытяжки с мясом и овощами', description_en = 'Hand-pulled noodles with meat and vegetables' WHERE name_uz = 'Lag''mon';
UPDATE menu_items SET name_ru = 'Манты', name_en = 'Manti', description_ru = 'Уйгурские манты с бараниной и луком', description_en = 'Uyghur steamed dumplings with lamb and onion' WHERE name_uz = 'Manti';
UPDATE menu_items SET name_ru = 'Ташкентский плов', name_en = 'Tashkent Plov', description_ru = 'Традиционный ташкентский плов с бараниной, морковью и специями', description_en = 'Traditional Tashkent plov with lamb, carrots, and spices' WHERE name_uz = 'Toshkent Palovi';
UPDATE menu_items SET name_ru = 'Тандыр кабоб', name_en = 'Tandoor Kabob', description_ru = 'Баранина, приготовленная в тандыре, мягкая и ароматная', description_en = 'Tender lamb cooked in a tandoor oven' WHERE name_uz = 'Tandir Kabob';
UPDATE menu_items SET name_ru = 'Чучвара', name_en = 'Chuchvara', description_ru = 'Чучвара в уйгурском стиле с бульоном', description_en = 'Uyghur-style dumplings with broth' WHERE name_uz = 'Chuchvara';
UPDATE menu_items SET name_ru = 'Гошнан', name_en = 'Goshnan', description_ru = 'Уйгурский гошнан, приготовленный в тандыре', description_en = 'Uyghur meat pie baked in a tandoor' WHERE name_uz = 'Go''shnan';
UPDATE menu_items SET name_ru = 'Самса тандырная', name_en = 'Tandoor Samsa', description_ru = 'Самса из тандыра с бараниной', description_en = 'Tandoor-baked pastry with lamb filling' WHERE name_uz = 'Tandirda Somsa';
UPDATE menu_items SET name_ru = 'Шурпа', name_en = 'Shorva', description_ru = 'Традиционный суп из баранины с овощами', description_en = 'Traditional lamb soup with vegetables' WHERE name_uz = 'Sho''rva';
UPDATE menu_items SET name_ru = 'Нарын', name_en = 'Norin', description_ru = 'Тонко нарезанное тесто с отварным мясом', description_en = 'Thin-cut noodles with boiled meat' WHERE name_uz = 'Norin';
UPDATE menu_items SET name_ru = 'Ачичук', name_en = 'Achichuk', description_ru = 'Салат из помидоров, лука и перца', description_en = 'Tomato, onion, and pepper salad' WHERE name_uz = 'Achichuk';
UPDATE menu_items SET name_ru = 'Шакароб', name_en = 'Shakarob', description_ru = 'Салат из помидоров с луком и зеленью', description_en = 'Tomato salad with onion and herbs' WHERE name_uz = 'Shakarob';
UPDATE menu_items SET name_ru = 'Чак-чак', name_en = 'Chak-chak', description_ru = 'Традиционное сладкое блюдо с мёдом', description_en = 'Traditional sweet pastry with honey' WHERE name_uz = 'Chak-chak';
UPDATE menu_items SET name_ru = 'Халвайтар', name_en = 'Halvaitar', description_ru = 'Традиционная узбекская халва из масла и муки', description_en = 'Traditional Uzbek halva with butter and flour' WHERE name_uz = 'Halvaitar';
UPDATE menu_items SET name_ru = 'Нишолда', name_en = 'Nisholda', description_ru = 'Белое воздушное сладкое блюдо, весенний деликатес', description_en = 'White fluffy sweet, a spring delicacy' WHERE name_uz = 'Nisholda';
```

---

## STEP 3: Deploy Frontend (Vercel)

Push to GitHub — Vercel auto-deploys from `main`:

```bash
git add -A
git commit -m "feat: multilingual menu + fix registration hash + fix API error handling"
git push origin main
```

Or if Vercel is not connected to GitHub, deploy manually:

```bash
vercel --prod
```

---

## STEP 4: Deploy Bot (Railway)

If Railway is connected to GitHub, it auto-deploys on push.

If not, deploy manually from the `bot/` directory:

```bash
cd bot
railway up
```

---

## What was fixed

| Fix | Description |
|-----|-------------|
| Registration "Invalid hash" | Rewrote HMAC validation to use URLSearchParams (correct decoding) |
| Menu translations | Added name_uz/name_ru/name_en columns, helper functions, updated all components |
| API error handling | Added try-catch around request.json() in all 4 API routes |
| USDZ→GLB conversion | Improved Python script with 3 fallback strategies, longer timeout, better error messages |
| Cart quantity limit | Capped at 99 per item |
| Error response parsing | Wrapped res.json() in catch blocks in CheckoutSheet and BookingForm |
| Debug logging removed | Removed sensitive log in register route |

---

## IMPORTANT: Order matters!

1. Supabase migration FIRST
2. Then frontend deploy
3. Then bot deploy

If you deploy code before the migration, the app will break (looking for `name_uz` but column is still `name`).

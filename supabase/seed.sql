-- Ko'hna Chig'atoy — Seed Data for Development
-- 4 categories + 14 sample menu items

-- Categories
INSERT INTO categories (id, name, display_order, icon) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Uyg''ur taomlar', 1, '🍜'),
  ('a1000000-0000-0000-0000-000000000002', 'Milliy taomlar', 2, '🍚'),
  ('a1000000-0000-0000-0000-000000000003', 'Salatlar', 3, '🥗'),
  ('a1000000-0000-0000-0000-000000000004', 'Shirinliklar', 4, '🍰');

-- Menu Items
-- Uyg'ur taomlar
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Lag''mon', 'Qo''lda cho''zilgan lag''mon, mol go''shtli va sabzavotli', 42000, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Chuchvara', 'Uyg''ur uslubidagi chuchvara, bulyon bilan', 35000, false, true),
  ('a1000000-0000-0000-0000-000000000001', 'Manti', 'Uyg''ur mantisi, qo''y go''shti va piyoz bilan', 38000, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Go''shnan', 'Uyg''ur go''shnani, tandirda pishirilgan', 25000, false, true);

-- Milliy taomlar
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Toshkent Palovi', 'An''anaviy toshkent palovi, qo''y go''shti, sabzi, ziravori bilan', 55000, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'Tandir Kabob', 'Tandirda pishirilgan qo''y go''shti, yumshoq va mazali', 75000, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'Tandirda Somsa', 'Tandirda pishirilgan somsa, qo''y go''shti bilan', 12000, false, true),
  ('a1000000-0000-0000-0000-000000000002', 'Sho''rva', 'An''anaviy qo''y go''shtli sho''rva, sabzavotlar bilan', 40000, false, true),
  ('a1000000-0000-0000-0000-000000000002', 'Norin', 'Yupqa kesimli xamir va qaynatilgan go''sht', 48000, false, true);

-- Salatlar
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Achichuk', 'Pomidor, piyoz va qalampir salati', 18000, false, true),
  ('a1000000-0000-0000-0000-000000000003', 'Shakarob', 'Pomidor salati, piyoz va o''t bilan', 15000, false, true);

-- Shirinliklar
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'Chak-chak', 'An''anaviy shirin taom, asal bilan', 20000, false, true),
  ('a1000000-0000-0000-0000-000000000004', 'Halvaitar', 'An''anaviy o''zbek halvaitari, yog'' va un bilan', 15000, false, true),
  ('a1000000-0000-0000-0000-000000000004', 'Nisholda', 'Oq ko''pikli shirin taom, bahor uchun maxsus', 18000, false, true);

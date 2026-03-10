-- Ko'hna Chig'atoy — Seed Data for Development
-- 6 categories + 18 sample menu items

-- Categories
INSERT INTO categories (id, name, display_order, icon) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Palov', 1, '🍚'),
  ('a1000000-0000-0000-0000-000000000002', 'Sho''rva va Lag''mon', 2, '🍜'),
  ('a1000000-0000-0000-0000-000000000003', 'Kabob', 3, '🥩'),
  ('a1000000-0000-0000-0000-000000000004', 'Somsa va Non', 4, '🥟'),
  ('a1000000-0000-0000-0000-000000000005', 'Salat', 5, '🥗'),
  ('a1000000-0000-0000-0000-000000000006', 'Ichimlik', 6, '🍵');

-- Menu Items
-- Palov
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Toshkent Palovi', 'An''anaviy toshkent palovi, qo''y go''shti, sabzi, ziravori bilan', 55000, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Samarqand Palovi', 'Samarqand uslubida tayyorlangan palov, katta porsiya', 60000, false, true),
  ('a1000000-0000-0000-0000-000000000001', 'Buxoro Palovi', 'Buxoro an''analari bo''yicha tayyorlangan maxsus palov', 65000, true, true);

-- Sho'rva va Lag'mon
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Lag''mon', 'Qo''lda cho''zilgan lag''mon, mol go''shtli va sabzavotli', 42000, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'Mastava', 'An''anaviy o''zbek sho''rvasi, guruch va sabzavotlar bilan', 38000, false, true),
  ('a1000000-0000-0000-0000-000000000002', 'Norin', 'Yupqa kesimli xamir va qaynatilgan go''sht', 48000, false, true);

-- Kabob
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Tandir Kabob', 'Tandirda pishirilgan qo''y go''shti, yumshoq va mazali', 75000, true, true),
  ('a1000000-0000-0000-0000-000000000003', 'Lyulya Kabob', 'Qiyma kabobi, piyoz va ziravorlar bilan', 45000, false, true),
  ('a1000000-0000-0000-0000-000000000003', 'Jiz', 'Qovurilgan qo''y go''shti bo''laklari', 55000, false, true);

-- Somsa va Non
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'Tandirda Somsa', 'Tandirda pishirilgan somsa, qo''y go''shti bilan', 12000, true, true),
  ('a1000000-0000-0000-0000-000000000004', 'Pufak Somsa', 'Pufak xamirli somsa, mol go''shtli', 15000, false, true),
  ('a1000000-0000-0000-0000-000000000004', 'Patir Non', 'Tandirda pishirilgan an''anaviy non', 8000, false, true);

-- Salat
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000005', 'Achichuk', 'Pomidor, piyoz va qalampir salati', 18000, false, true),
  ('a1000000-0000-0000-0000-000000000005', 'Shakarob', 'Pomidor salati, piyoz va o''t bilan', 15000, false, true),
  ('a1000000-0000-0000-0000-000000000005', 'Ko''k salat', 'Mavsumiy sabzavotlar salati', 20000, false, true);

-- Ichimlik
INSERT INTO menu_items (category_id, name, description, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000006', 'Ko''k choy', 'An''anaviy o''zbek ko''k choyi', 8000, false, true),
  ('a1000000-0000-0000-0000-000000000006', 'Qora choy', 'Qora choy, limon bilan', 8000, false, true),
  ('a1000000-0000-0000-0000-000000000006', 'Kompot', 'Uy kompoti, quritilgan mevalardan', 12000, false, true);

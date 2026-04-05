-- Ko'hna Chig'atoy — Seed Data for Development
-- 4 categories + 14 sample menu items (multilingual)

-- Categories
INSERT INTO categories (id, name_uz, name_ru, name_en, display_order, icon) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Uyg''ur taomlar', 'Уйгурские блюда', 'Uyghur Dishes', 1, '🍜'),
  ('a1000000-0000-0000-0000-000000000002', 'Milliy taomlar', 'Национальные блюда', 'National Dishes', 2, '🍚'),
  ('a1000000-0000-0000-0000-000000000003', 'Salatlar', 'Салаты', 'Salads', 3, '🥗'),
  ('a1000000-0000-0000-0000-000000000004', 'Shirinliklar', 'Десерты', 'Desserts', 4, '🍰');

-- Menu Items
-- Uyg'ur taomlar
INSERT INTO menu_items (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Lag''mon', 'Лагман', 'Lagman', 'Qo''lda cho''zilgan lag''mon, mol go''shtli va sabzavotli', 'Лагман ручной вытяжки с мясом и овощами', 'Hand-pulled noodles with meat and vegetables', 42000, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Chuchvara', 'Чучвара', 'Chuchvara', 'Uyg''ur uslubidagi chuchvara, bulyon bilan', 'Чучвара в уйгурском стиле с бульоном', 'Uyghur-style dumplings with broth', 35000, false, true),
  ('a1000000-0000-0000-0000-000000000001', 'Manti', 'Манты', 'Manti', 'Uyg''ur mantisi, qo''y go''shti va piyoz bilan', 'Уйгурские манты с бараниной и луком', 'Uyghur steamed dumplings with lamb and onion', 38000, true, true),
  ('a1000000-0000-0000-0000-000000000001', 'Go''shnan', 'Гошнан', 'Goshnan', 'Uyg''ur go''shnani, tandirda pishirilgan', 'Уйгурский гошнан, приготовленный в тандыре', 'Uyghur meat pie baked in a tandoor', 25000, false, true);

-- Milliy taomlar
INSERT INTO menu_items (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Toshkent Palovi', 'Ташкентский плов', 'Tashkent Plov', 'An''anaviy toshkent palovi, qo''y go''shti, sabzi, ziravori bilan', 'Традиционный ташкентский плов с бараниной, морковью и специями', 'Traditional Tashkent plov with lamb, carrots, and spices', 55000, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'Tandir Kabob', 'Тандыр кабоб', 'Tandoor Kabob', 'Tandirda pishirilgan qo''y go''shti, yumshoq va mazali', 'Баранина, приготовленная в тандыре, мягкая и ароматная', 'Tender lamb cooked in a tandoor oven', 75000, true, true),
  ('a1000000-0000-0000-0000-000000000002', 'Tandirda Somsa', 'Самса тандырная', 'Tandoor Samsa', 'Tandirda pishirilgan somsa, qo''y go''shti bilan', 'Самса из тандыра с бараниной', 'Tandoor-baked pastry with lamb filling', 12000, false, true),
  ('a1000000-0000-0000-0000-000000000002', 'Sho''rva', 'Шурпа', 'Shorva', 'An''anaviy qo''y go''shtli sho''rva, sabzavotlar bilan', 'Традиционный суп из баранины с овощами', 'Traditional lamb soup with vegetables', 40000, false, true),
  ('a1000000-0000-0000-0000-000000000002', 'Norin', 'Нарын', 'Norin', 'Yupqa kesimli xamir va qaynatilgan go''sht', 'Тонко нарезанное тесто с отварным мясом', 'Thin-cut noodles with boiled meat', 48000, false, true);

-- Salatlar
INSERT INTO menu_items (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Achichuk', 'Ачичук', 'Achichuk', 'Pomidor, piyoz va qalampir salati', 'Салат из помидоров, лука и перца', 'Tomato, onion, and pepper salad', 18000, false, true),
  ('a1000000-0000-0000-0000-000000000003', 'Shakarob', 'Шакароб', 'Shakarob', 'Pomidor salati, piyoz va o''t bilan', 'Салат из помидоров с луком и зеленью', 'Tomato salad with onion and herbs', 15000, false, true);

-- Shirinliklar
INSERT INTO menu_items (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, is_featured, is_available) VALUES
  ('a1000000-0000-0000-0000-000000000004', 'Chak-chak', 'Чак-чак', 'Chak-chak', 'An''anaviy shirin taom, asal bilan', 'Традиционное сладкое блюдо с мёдом', 'Traditional sweet pastry with honey', 20000, false, true),
  ('a1000000-0000-0000-0000-000000000004', 'Halvaitar', 'Халвайтар', 'Halvaitar', 'An''anaviy o''zbek halvaitari, yog'' va un bilan', 'Традиционная узбекская халва из масла и муки', 'Traditional Uzbek halva with butter and flour', 15000, false, true),
  ('a1000000-0000-0000-0000-000000000004', 'Nisholda', 'Нишолда', 'Nisholda', 'Oq ko''pikli shirin taom, bahor uchun maxsus', 'Белое воздушное сладкое блюдо, весенний деликатес', 'White fluffy sweet, a spring delicacy', 18000, false, true);

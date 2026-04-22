-- ============================================
-- 023: Oksidantų linija — teisinga asortimento sudėtis
-- ============================================
--
-- Teisingas oksidantų asortimentas yra:
--   1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).
--
-- Ankstesniame sėklos faile (002) buvo klaidingi numeriai (3%, 6%, 9% be VOL,
-- ir planuotas 12%, kurio realiai nėra). Ši migracija:
--   1) atnaujina kategorijos aprašymą naujai asortimento sudėčiai,
--   2) pakeičia esamų oxidant-3 / oxidant-6 / oxidant-9 pavadinimus ir
--      aprašymus, pridedant VOL žymą ir teisingą paskirtį,
--   3) įterpia trūkstamą 1.5% (5 VOL) oksidantą,
--   4) pažymi 6% kaip featured (dažniausiai naudojamas salone).
--
-- Featured 3% buvo perkeltas į 6%, nes salone dažniausiai naudojamas būtent
-- 20 VOL oksidantas (standartinis dažymas + žilų dengimas).

-- 1) Kategorijos aprašymas
UPDATE categories
SET
  description_lt = 'Profesionalūs oksidantai skirtingoms koncentracijoms: 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).',
  description_en = 'Professional oxidants in different concentrations: 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).',
  description_ru = 'Профессиональные оксиданты разных концентраций: 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).'
WHERE slug = 'oksidantai';

-- 2) Esamų oksidantų atnaujinimas
UPDATE products
SET
  name_lt = 'Oksidantas 3% (10 VOL)',
  name_en = 'Oxidant 3% (10 VOL)',
  name_ru = 'Оксидант 3% (10 VOL)',
  description_lt = 'Profesionalus 3% (10 VOL) oksidantas toninimui ir spalvos atnaujinimui.',
  description_en = 'Professional 3% (10 VOL) oxidant for toning and color refreshing.',
  description_ru = 'Профессиональный 3% (10 VOL) оксидант для тонирования и обновления цвета.',
  is_featured = false
WHERE slug = 'oxidant-3';

UPDATE products
SET
  name_lt = 'Oksidantas 6% (20 VOL)',
  name_en = 'Oxidant 6% (20 VOL)',
  name_ru = 'Оксидант 6% (20 VOL)',
  description_lt = 'Profesionalus 6% (20 VOL) oksidantas standartiniam dažymui ir žilų plaukų dengimui.',
  description_en = 'Professional 6% (20 VOL) oxidant for standard coloring and grey coverage.',
  description_ru = 'Профессиональный 6% (20 VOL) оксидант для стандартного окрашивания и закрашивания седины.',
  is_featured = true
WHERE slug = 'oxidant-6';

UPDATE products
SET
  name_lt = 'Oksidantas 9% (30 VOL)',
  name_en = 'Oxidant 9% (30 VOL)',
  name_ru = 'Оксидант 9% (30 VOL)',
  description_lt = 'Profesionalus 9% (30 VOL) oksidantas šviesinimui 2–3 tonais.',
  description_en = 'Professional 9% (30 VOL) oxidant for lightening by 2–3 tones.',
  description_ru = 'Профессиональный 9% (30 VOL) оксидант для осветления на 2–3 тона.',
  is_featured = false
WHERE slug = 'oxidant-9';

-- 3) Naujas 1.5% (5 VOL) oksidantas
INSERT INTO products (
  slug, sku, category_id, brand_id,
  name_lt, name_en, name_ru,
  description_lt, description_en, description_ru,
  price_cents, volume_ml, stock_quantity, is_featured
)
SELECT
  'oxidant-1-5', 'OX-1-5',
  (SELECT id FROM categories WHERE slug = 'oksidantai'),
  (SELECT id FROM brands WHERE slug = 'color-shock'),
  'Oksidantas 1.5% (5 VOL)', 'Oxidant 1.5% (5 VOL)', 'Оксидант 1.5% (5 VOL)',
  'Profesionalus 1.5% (5 VOL) oksidantas švelniam toninimui be šviesinimo efekto.',
  'Professional 1.5% (5 VOL) oxidant for gentle toning without lightening.',
  'Профессиональный 1.5% (5 VOL) оксидант для мягкого тонирования без осветления.',
  890, 1000, 50, false
ON CONFLICT (slug) DO NOTHING;

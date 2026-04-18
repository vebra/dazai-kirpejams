-- ============================================
-- 017: Color SHOCK — PDF pavadinimai + swatch nuotraukos
-- ============================================
-- Šaltinis: docs/color-shock-chart.pdf + docs/spalvu pavadinimai.txt.
-- Atnaujiname 46 Color SHOCK atspalvius:
--   * name_lt / name_en / name_ru — pagal originalius PDF pavadinimus
--   * color_name — LT spalvos pavadinimas be prekės ženklo prefikso
--   * image_urls — public/colors/*.jpeg iškirpti iš PDF (154×255 px native)
--
-- MEN linija (4 produktai) — neliečiame, nes PDF jos nėra.

UPDATE products p SET
  name_lt    = v.name_lt,
  name_en    = v.name_en,
  name_ru    = v.name_ru,
  color_name = v.color_lt,
  image_urls = ARRAY[v.image_path]
FROM (VALUES
  -- NATURAL (9)
  ('color-shock-1-00',  'Color SHOCK 1.00 — Intensyvi juoda',    'Color SHOCK 1.00 — Intense Black',    'Color SHOCK 1.00 — Интенсивный чёрный',    'Intensyvi juoda',    '/colors/color-shock-1-00.jpeg'),
  ('color-shock-3-00',  'Color SHOCK 3.00 — Tamsiai ruda',       'Color SHOCK 3.00 — Dark Brown',       'Color SHOCK 3.00 — Тёмно-коричневый',      'Tamsiai ruda',       '/colors/color-shock-3-00.jpeg'),
  ('color-shock-4-00',  'Color SHOCK 4.00 — Ruda',               'Color SHOCK 4.00 — Brown',            'Color SHOCK 4.00 — Коричневый',            'Ruda',               '/colors/color-shock-4-00.jpeg'),
  ('color-shock-5-00',  'Color SHOCK 5.00 — Šviesiai ruda',      'Color SHOCK 5.00 — Light Brown',      'Color SHOCK 5.00 — Светло-коричневый',     'Šviesiai ruda',      '/colors/color-shock-5-00.jpeg'),
  ('color-shock-6-00',  'Color SHOCK 6.00 — Tamsi blondinė',     'Color SHOCK 6.00 — Dark Blonde',      'Color SHOCK 6.00 — Тёмный блонд',          'Tamsi blondinė',     '/colors/color-shock-6-00.jpeg'),
  ('color-shock-7-00',  'Color SHOCK 7.00 — Intensyvi blondinė', 'Color SHOCK 7.00 — Intense Blonde',   'Color SHOCK 7.00 — Интенсивный блонд',     'Intensyvi blondinė', '/colors/color-shock-7-00.jpeg'),
  ('color-shock-8-00',  'Color SHOCK 8.00 — Šviesi blondinė',    'Color SHOCK 8.00 — Light Blonde',     'Color SHOCK 8.00 — Светлый блонд',         'Šviesi blondinė',    '/colors/color-shock-8-00.jpeg'),
  ('color-shock-9-00',  'Color SHOCK 9.00 — Blondinė',           'Color SHOCK 9.00 — Blonde',           'Color SHOCK 9.00 — Блонд',                 'Blondinė',           '/colors/color-shock-9-00.jpeg'),
  ('color-shock-10-00', 'Color SHOCK 10.00 — Platininė blondinė','Color SHOCK 10.00 — Platinum Blonde', 'Color SHOCK 10.00 — Платиновый блонд',     'Platininė blondinė', '/colors/color-shock-10-00.jpeg'),

  -- ASH (6)
  ('color-shock-5-1',   'Color SHOCK 5.1 — Šviesiai pelenų ruda',         'Color SHOCK 5.1 — Light Ash Brown',        'Color SHOCK 5.1 — Светлый пепельно-коричневый',     'Šviesiai pelenų ruda',         '/colors/color-shock-5-1.jpeg'),
  ('color-shock-6-1',   'Color SHOCK 6.1 — Tamsi pelenų blondinė',        'Color SHOCK 6.1 — Dark Ash Blonde',        'Color SHOCK 6.1 — Тёмный пепельный блонд',          'Tamsi pelenų blondinė',        '/colors/color-shock-6-1.jpeg'),
  ('color-shock-7-1',   'Color SHOCK 7.1 — Pelenų blondinė',              'Color SHOCK 7.1 — Ash Blonde',             'Color SHOCK 7.1 — Пепельный блонд',                 'Pelenų blondinė',              '/colors/color-shock-7-1.jpeg'),
  ('color-shock-8-1',   'Color SHOCK 8.1 — Šviesi pelenų blondinė',       'Color SHOCK 8.1 — Light Ash Blonde',       'Color SHOCK 8.1 — Светлый пепельный блонд',         'Šviesi pelenų blondinė',       '/colors/color-shock-8-1.jpeg'),
  ('color-shock-9-1',   'Color SHOCK 9.1 — Labai šviesi pelenų blondinė', 'Color SHOCK 9.1 — Very Light Ash Blonde',  'Color SHOCK 9.1 — Очень светлый пепельный блонд',   'Labai šviesi pelenų blondinė', '/colors/color-shock-9-1.jpeg'),
  ('color-shock-10-1',  'Color SHOCK 10.1 — Platininė pelenų blondinė',   'Color SHOCK 10.1 — Platinum Ash Blonde',   'Color SHOCK 10.1 — Платиновый пепельный блонд',     'Platininė pelenų blondinė',    '/colors/color-shock-10-1.jpeg'),

  -- ICY CHOCOLATE (1)
  ('color-shock-7-18', 'Color SHOCK 7.18 — Šalta šokoladinė ruda', 'Color SHOCK 7.18 — Cool Chocolate Brown', 'Color SHOCK 7.18 — Холодный шоколадно-коричневый', 'Šalta šokoladinė ruda', '/colors/color-shock-7-18.jpeg'),

  -- GOLDEN (1)
  ('color-shock-9-3', 'Color SHOCK 9.3 — Labai šviesi auksinė blondinė', 'Color SHOCK 9.3 — Very Light Golden Blonde', 'Color SHOCK 9.3 — Очень светлый золотистый блонд', 'Labai šviesi auksinė blondinė', '/colors/color-shock-9-3.jpeg'),

  -- ASH PEARL (3)
  ('color-shock-7-12', 'Color SHOCK 7.12 — Perlinė blondinė',              'Color SHOCK 7.12 — Pearl Blonde',            'Color SHOCK 7.12 — Жемчужный блонд',                'Perlinė blondinė',              '/colors/color-shock-7-12.jpeg'),
  ('color-shock-8-12', 'Color SHOCK 8.12 — Šviesi perlinė blondinė',       'Color SHOCK 8.12 — Light Pearl Blonde',      'Color SHOCK 8.12 — Светлый жемчужный блонд',        'Šviesi perlinė blondinė',       '/colors/color-shock-8-12.jpeg'),
  ('color-shock-9-12', 'Color SHOCK 9.12 — Labai šviesi perlinė blondinė', 'Color SHOCK 9.12 — Very Light Pearl Blonde', 'Color SHOCK 9.12 — Очень светлый жемчужный блонд',  'Labai šviesi perlinė blondinė', '/colors/color-shock-9-12.jpeg'),

  -- VIOLET (1)
  ('color-shock-5-22', 'Color SHOCK 5.22 — Intensyvi šviesi violetinė ruda', 'Color SHOCK 5.22 — Intense Light Violet Brown', 'Color SHOCK 5.22 — Интенсивный светлый фиолетово-коричневый', 'Intensyvi šviesi violetinė ruda', '/colors/color-shock-5-22.jpeg'),

  -- VIOLET GOLD (1)
  ('color-shock-4-23', 'Color SHOCK 4.23 — Tabako ruda', 'Color SHOCK 4.23 — Tobacco Brown', 'Color SHOCK 4.23 — Табачно-коричневый', 'Tabako ruda', '/colors/color-shock-4-23.jpeg'),

  -- WARM BEIGE (5)
  ('color-shock-6-32',  'Color SHOCK 6.32 — Tamsi smėlinė blondinė',        'Color SHOCK 6.32 — Dark Beige Blonde',        'Color SHOCK 6.32 — Тёмный бежевый блонд',          'Tamsi smėlinė blondinė',        '/colors/color-shock-6-32.jpeg'),
  ('color-shock-7-32',  'Color SHOCK 7.32 — Smėlinė blondinė',              'Color SHOCK 7.32 — Beige Blonde',             'Color SHOCK 7.32 — Бежевый блонд',                 'Smėlinė blondinė',              '/colors/color-shock-7-32.jpeg'),
  ('color-shock-8-32',  'Color SHOCK 8.32 — Šviesi smėlinė blondinė',       'Color SHOCK 8.32 — Light Beige Blonde',       'Color SHOCK 8.32 — Светлый бежевый блонд',         'Šviesi smėlinė blondinė',       '/colors/color-shock-8-32.jpeg'),
  ('color-shock-9-32',  'Color SHOCK 9.32 — Labai šviesi smėlinė blondinė', 'Color SHOCK 9.32 — Very Light Beige Blonde',  'Color SHOCK 9.32 — Очень светлый бежевый блонд',   'Labai šviesi smėlinė blondinė', '/colors/color-shock-9-32.jpeg'),
  ('color-shock-10-32', 'Color SHOCK 10.32 — Platininė smėlinė blondinė',   'Color SHOCK 10.32 — Platinum Beige Blonde',   'Color SHOCK 10.32 — Платиновый бежевый блонд',     'Platininė smėlinė blondinė',    '/colors/color-shock-10-32.jpeg'),

  -- COPPER (2)
  ('color-shock-7-444', 'Color SHOCK 7.444 — Ypač intensyvi varinė blondinė',        'Color SHOCK 7.444 — Extra Intense Copper Blonde',       'Color SHOCK 7.444 — Экстра интенсивный медный блонд',          'Ypač intensyvi varinė blondinė',        '/colors/color-shock-7-444.jpeg'),
  ('color-shock-8-444', 'Color SHOCK 8.444 — Ypač intensyvi šviesi varinė blondinė', 'Color SHOCK 8.444 — Extra Intense Light Copper Blonde', 'Color SHOCK 8.444 — Экстра интенсивный светлый медный блонд',  'Ypač intensyvi šviesi varinė blondinė', '/colors/color-shock-8-444.jpeg'),

  -- MAHOGANY (1)
  ('color-shock-6-5', 'Color SHOCK 6.5 — Tamsus raudonmedis', 'Color SHOCK 6.5 — Dark Mahogany', 'Color SHOCK 6.5 — Тёмный махагон', 'Tamsus raudonmedis', '/colors/color-shock-6-5.jpeg'),

  -- RED (2)
  ('color-shock-6-66', 'Color SHOCK 6.66 — Intensyvi tamsiai raudona blondinė', 'Color SHOCK 6.66 — Intense Dark Red Blonde', 'Color SHOCK 6.66 — Интенсивный тёмно-красный блонд', 'Intensyvi tamsiai raudona blondinė', '/colors/color-shock-6-66.jpeg'),
  ('color-shock-7-66', 'Color SHOCK 7.66 — Intensyvi raudona blondinė',         'Color SHOCK 7.66 — Intense Red Blonde',      'Color SHOCK 7.66 — Интенсивный красный блонд',       'Intensyvi raudona blondinė',         '/colors/color-shock-7-66.jpeg'),

  -- CHOCOLATE (2)
  ('color-shock-5-8', 'Color SHOCK 5.8 — Šokoladinė ruda',         'Color SHOCK 5.8 — Chocolate Brown',        'Color SHOCK 5.8 — Шоколадно-коричневый',      'Šokoladinė ruda',         '/colors/color-shock-5-8.jpeg'),
  ('color-shock-6-8', 'Color SHOCK 6.8 — Tamsi šokoladinė blondinė','Color SHOCK 6.8 — Dark Chocolate Blonde',  'Color SHOCK 6.8 — Тёмный шоколадный блонд',   'Tamsi šokoladinė blondinė','/colors/color-shock-6-8.jpeg'),

  -- SUPERLIFT (6)
  ('color-shock-11-11', 'Color SHOCK 11.11 — Intensyvi šviesi platininė pelenų blondinė', 'Color SHOCK 11.11 — Intense Light Platinum Ash Blonde', 'Color SHOCK 11.11 — Интенсивный светлый платиновый пепельный блонд', 'Intensyvi šviesi platininė pelenų blondinė', '/colors/color-shock-11-11.jpeg'),
  ('color-shock-12-0',  'Color SHOCK 12.0 — Ypač šviesinanti natūrali blondinė',            'Color SHOCK 12.0 — Superlift Natural Blonde',            'Color SHOCK 12.0 — Суперосветляющий натуральный блонд',              'Ypač šviesinanti natūrali blondinė',            '/colors/color-shock-12-0.jpeg'),
  ('color-shock-12-2',  'Color SHOCK 12.2 — Ypač šviesinanti violetinė blondinė',           'Color SHOCK 12.2 — Superlift Violet Blonde',             'Color SHOCK 12.2 — Суперосветляющий фиолетовый блонд',               'Ypač šviesinanti violetinė blondinė',           '/colors/color-shock-12-2.jpeg'),
  ('color-shock-12-12', 'Color SHOCK 12.12 — Ypač šviesinanti perlinė blondinė',            'Color SHOCK 12.12 — Superlift Pearl Blonde',             'Color SHOCK 12.12 — Суперосветляющий жемчужный блонд',               'Ypač šviesinanti perlinė blondinė',             '/colors/color-shock-12-12.jpeg'),
  ('color-shock-12-21', 'Color SHOCK 12.21 — Ypač šviesinanti violetinė pelenų blondinė', 'Color SHOCK 12.21 — Superlift Violet Ash Blonde',        'Color SHOCK 12.21 — Суперосветляющий фиолетовый пепельный блонд',    'Ypač šviesinanti violetinė pelenų blondinė',  '/colors/color-shock-12-21.jpeg'),
  ('color-shock-12-62', 'Color SHOCK 12.62 — Ypač šviesinanti rožinė blondinė',             'Color SHOCK 12.62 — Superlift Pink Blonde',              'Color SHOCK 12.62 — Суперосветляющий розовый блонд',                 'Ypač šviesinanti rožinė blondinė',              '/colors/color-shock-12-62.jpeg'),

  -- TONER & CORRECTORS (6)
  ('color-shock-silver-grey',  'Color SHOCK Silver Grey — Sidabriškai pilka', 'Color SHOCK Silver Grey — Silver Grey',   'Color SHOCK Silver Grey — Серебристо-серый',   'Sidabriškai pilka', '/colors/color-shock-silver-grey.jpeg'),
  ('color-shock-light-grey',   'Color SHOCK Light Grey — Šviesiai pilka',     'Color SHOCK Light Grey — Light Grey',     'Color SHOCK Light Grey — Светло-серый',        'Šviesiai pilka',    '/colors/color-shock-light-grey.jpeg'),
  ('color-shock-dark-grey',    'Color SHOCK Dark Grey — Tamsiai pilka',       'Color SHOCK Dark Grey — Dark Grey',       'Color SHOCK Dark Grey — Тёмно-серый',          'Tamsiai pilka',     '/colors/color-shock-dark-grey.jpeg'),
  ('color-shock-silver-pearl', 'Color SHOCK Silver Pearl — Sidabrinis perlas','Color SHOCK Silver Pearl — Silver Pearl', 'Color SHOCK Silver Pearl — Серебристый жемчуг','Sidabrinis perlas', '/colors/color-shock-silver-pearl.jpeg'),
  ('color-shock-silver-beige', 'Color SHOCK Silver Beige — Sidabrinė smėlinė','Color SHOCK Silver Beige — Silver Beige', 'Color SHOCK Silver Beige — Серебристо-бежевый','Sidabrinė smėlinė', '/colors/color-shock-silver-beige.jpeg'),
  ('color-shock-lilac',        'Color SHOCK Lilac — Alyvinė',                 'Color SHOCK Lilac — Lilac',               'Color SHOCK Lilac — Сиреневый',                'Alyvinė',           '/colors/color-shock-lilac.jpeg')
) AS v(slug, name_lt, name_en, name_ru, color_lt, image_path)
WHERE p.slug = v.slug;

-- Patikrinimas: turi būti 46 paveiktos eilutės.
-- SELECT count(*) FROM products WHERE slug LIKE 'color-shock-%' AND array_length(image_urls, 1) = 1;

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
  ('color-shock-1-00',  '1.00 Color SHOCK — Intensyvi juoda',    '1.00 Color SHOCK — Intense Black',    '1.00 Color SHOCK — Интенсивный чёрный',    'Intensyvi juoda',    '/colors/color-shock-1-00.jpeg'),
  ('color-shock-3-00',  '3.00 Color SHOCK — Tamsiai ruda',       '3.00 Color SHOCK — Dark Brown',       '3.00 Color SHOCK — Тёмно-коричневый',      'Tamsiai ruda',       '/colors/color-shock-3-00.jpeg'),
  ('color-shock-4-00',  '4.00 Color SHOCK — Ruda',               '4.00 Color SHOCK — Brown',            '4.00 Color SHOCK — Коричневый',            'Ruda',               '/colors/color-shock-4-00.jpeg'),
  ('color-shock-5-00',  '5.00 Color SHOCK — Šviesiai ruda',      '5.00 Color SHOCK — Light Brown',      '5.00 Color SHOCK — Светло-коричневый',     'Šviesiai ruda',      '/colors/color-shock-5-00.jpeg'),
  ('color-shock-6-00',  '6.00 Color SHOCK — Tamsi blondinė',     '6.00 Color SHOCK — Dark Blonde',      '6.00 Color SHOCK — Тёмный блонд',          'Tamsi blondinė',     '/colors/color-shock-6-00.jpeg'),
  ('color-shock-7-00',  '7.00 Color SHOCK — Intensyvi blondinė', '7.00 Color SHOCK — Intense Blonde',   '7.00 Color SHOCK — Интенсивный блонд',     'Intensyvi blondinė', '/colors/color-shock-7-00.jpeg'),
  ('color-shock-8-00',  '8.00 Color SHOCK — Šviesi blondinė',    '8.00 Color SHOCK — Light Blonde',     '8.00 Color SHOCK — Светлый блонд',         'Šviesi blondinė',    '/colors/color-shock-8-00.jpeg'),
  ('color-shock-9-00',  '9.00 Color SHOCK — Blondinė',           '9.00 Color SHOCK — Blonde',           '9.00 Color SHOCK — Блонд',                 'Blondinė',           '/colors/color-shock-9-00.jpeg'),
  ('color-shock-10-00', '10.00 Color SHOCK — Platininė blondinė','10.00 Color SHOCK — Platinum Blonde', '10.00 Color SHOCK — Платиновый блонд',     'Platininė blondinė', '/colors/color-shock-10-00.jpeg'),

  -- ASH (6)
  ('color-shock-5-1',   '5.1 Color SHOCK — Šviesiai pelenų ruda',         '5.1 Color SHOCK — Light Ash Brown',        '5.1 Color SHOCK — Светлый пепельно-коричневый',     'Šviesiai pelenų ruda',         '/colors/color-shock-5-1.jpeg'),
  ('color-shock-6-1',   '6.1 Color SHOCK — Tamsi pelenų blondinė',        '6.1 Color SHOCK — Dark Ash Blonde',        '6.1 Color SHOCK — Тёмный пепельный блонд',          'Tamsi pelenų blondinė',        '/colors/color-shock-6-1.jpeg'),
  ('color-shock-7-1',   '7.1 Color SHOCK — Pelenų blondinė',              '7.1 Color SHOCK — Ash Blonde',             '7.1 Color SHOCK — Пепельный блонд',                 'Pelenų blondinė',              '/colors/color-shock-7-1.jpeg'),
  ('color-shock-8-1',   '8.1 Color SHOCK — Šviesi pelenų blondinė',       '8.1 Color SHOCK — Light Ash Blonde',       '8.1 Color SHOCK — Светлый пепельный блонд',         'Šviesi pelenų blondinė',       '/colors/color-shock-8-1.jpeg'),
  ('color-shock-9-1',   '9.1 Color SHOCK — Labai šviesi pelenų blondinė', '9.1 Color SHOCK — Very Light Ash Blonde',  '9.1 Color SHOCK — Очень светлый пепельный блонд',   'Labai šviesi pelenų blondinė', '/colors/color-shock-9-1.jpeg'),
  ('color-shock-10-1',  '10.1 Color SHOCK — Platininė pelenų blondinė',   '10.1 Color SHOCK — Platinum Ash Blonde',   '10.1 Color SHOCK — Платиновый пепельный блонд',     'Platininė pelenų blondinė',    '/colors/color-shock-10-1.jpeg'),

  -- ICY CHOCOLATE (1)
  ('color-shock-7-18', '7.18 Color SHOCK — Šalta šokoladinė ruda', '7.18 Color SHOCK — Cool Chocolate Brown', '7.18 Color SHOCK — Холодный шоколадно-коричневый', 'Šalta šokoladinė ruda', '/colors/color-shock-7-18.jpeg'),

  -- GOLDEN (1)
  ('color-shock-9-3', '9.3 Color SHOCK — Labai šviesi auksinė blondinė', '9.3 Color SHOCK — Very Light Golden Blonde', '9.3 Color SHOCK — Очень светлый золотистый блонд', 'Labai šviesi auksinė blondinė', '/colors/color-shock-9-3.jpeg'),

  -- ASH PEARL (3)
  ('color-shock-7-12', '7.12 Color SHOCK — Perlinė blondinė',              '7.12 Color SHOCK — Pearl Blonde',            '7.12 Color SHOCK — Жемчужный блонд',                'Perlinė blondinė',              '/colors/color-shock-7-12.jpeg'),
  ('color-shock-8-12', '8.12 Color SHOCK — Šviesi perlinė blondinė',       '8.12 Color SHOCK — Light Pearl Blonde',      '8.12 Color SHOCK — Светлый жемчужный блонд',        'Šviesi perlinė blondinė',       '/colors/color-shock-8-12.jpeg'),
  ('color-shock-9-12', '9.12 Color SHOCK — Labai šviesi perlinė blondinė', '9.12 Color SHOCK — Very Light Pearl Blonde', '9.12 Color SHOCK — Очень светлый жемчужный блонд',  'Labai šviesi perlinė blondinė', '/colors/color-shock-9-12.jpeg'),

  -- VIOLET (1)
  ('color-shock-5-22', '5.22 Color SHOCK — Intensyvi šviesi violetinė ruda', '5.22 Color SHOCK — Intense Light Violet Brown', '5.22 Color SHOCK — Интенсивный светлый фиолетово-коричневый', 'Intensyvi šviesi violetinė ruda', '/colors/color-shock-5-22.jpeg'),

  -- VIOLET GOLD (1)
  ('color-shock-4-23', '4.23 Color SHOCK — Tabako ruda', '4.23 Color SHOCK — Tobacco Brown', '4.23 Color SHOCK — Табачно-коричневый', 'Tabako ruda', '/colors/color-shock-4-23.jpeg'),

  -- WARM BEIGE (5)
  ('color-shock-6-32',  '6.32 Color SHOCK — Tamsi smėlinė blondinė',        '6.32 Color SHOCK — Dark Beige Blonde',        '6.32 Color SHOCK — Тёмный бежевый блонд',          'Tamsi smėlinė blondinė',        '/colors/color-shock-6-32.jpeg'),
  ('color-shock-7-32',  '7.32 Color SHOCK — Smėlinė blondinė',              '7.32 Color SHOCK — Beige Blonde',             '7.32 Color SHOCK — Бежевый блонд',                 'Smėlinė blondinė',              '/colors/color-shock-7-32.jpeg'),
  ('color-shock-8-32',  '8.32 Color SHOCK — Šviesi smėlinė blondinė',       '8.32 Color SHOCK — Light Beige Blonde',       '8.32 Color SHOCK — Светлый бежевый блонд',         'Šviesi smėlinė blondinė',       '/colors/color-shock-8-32.jpeg'),
  ('color-shock-9-32',  '9.32 Color SHOCK — Labai šviesi smėlinė blondinė', '9.32 Color SHOCK — Very Light Beige Blonde',  '9.32 Color SHOCK — Очень светлый бежевый блонд',   'Labai šviesi smėlinė blondinė', '/colors/color-shock-9-32.jpeg'),
  ('color-shock-10-32', '10.32 Color SHOCK — Platininė smėlinė blondinė',   '10.32 Color SHOCK — Platinum Beige Blonde',   '10.32 Color SHOCK — Платиновый бежевый блонд',     'Platininė smėlinė blondinė',    '/colors/color-shock-10-32.jpeg'),

  -- COPPER (2)
  ('color-shock-7-444', '7.444 Color SHOCK — Ypač intensyvi varinė blondinė',        '7.444 Color SHOCK — Extra Intense Copper Blonde',       '7.444 Color SHOCK — Экстра интенсивный медный блонд',          'Ypač intensyvi varinė blondinė',        '/colors/color-shock-7-444.jpeg'),
  ('color-shock-8-444', '8.444 Color SHOCK — Ypač intensyvi šviesi varinė blondinė', '8.444 Color SHOCK — Extra Intense Light Copper Blonde', '8.444 Color SHOCK — Экстра интенсивный светлый медный блонд',  'Ypač intensyvi šviesi varinė blondinė', '/colors/color-shock-8-444.jpeg'),

  -- MAHOGANY (1)
  ('color-shock-6-5', '6.5 Color SHOCK — Tamsus raudonmedis', '6.5 Color SHOCK — Dark Mahogany', '6.5 Color SHOCK — Тёмный махагон', 'Tamsus raudonmedis', '/colors/color-shock-6-5.jpeg'),

  -- RED (2)
  ('color-shock-6-66', '6.66 Color SHOCK — Intensyvi tamsiai raudona blondinė', '6.66 Color SHOCK — Intense Dark Red Blonde', '6.66 Color SHOCK — Интенсивный тёмно-красный блонд', 'Intensyvi tamsiai raudona blondinė', '/colors/color-shock-6-66.jpeg'),
  ('color-shock-7-66', '7.66 Color SHOCK — Intensyvi raudona blondinė',         '7.66 Color SHOCK — Intense Red Blonde',      '7.66 Color SHOCK — Интенсивный красный блонд',       'Intensyvi raudona blondinė',         '/colors/color-shock-7-66.jpeg'),

  -- CHOCOLATE (2)
  ('color-shock-5-8', '5.8 Color SHOCK — Šokoladinė ruda',         '5.8 Color SHOCK — Chocolate Brown',        '5.8 Color SHOCK — Шоколадно-коричневый',      'Šokoladinė ruda',         '/colors/color-shock-5-8.jpeg'),
  ('color-shock-6-8', '6.8 Color SHOCK — Tamsi šokoladinė blondinė','6.8 Color SHOCK — Dark Chocolate Blonde',  '6.8 Color SHOCK — Тёмный шоколадный блонд',   'Tamsi šokoladinė blondinė','/colors/color-shock-6-8.jpeg'),

  -- SUPERLIFT (6)
  ('color-shock-11-11', '11.11 Color SHOCK — Intensyvi šviesi platininė pelenų blondinė', '11.11 Color SHOCK — Intense Light Platinum Ash Blonde', '11.11 Color SHOCK — Интенсивный светлый платиновый пепельный блонд', 'Intensyvi šviesi platininė pelenų blondinė', '/colors/color-shock-11-11.jpeg'),
  ('color-shock-12-0',  '12.0 Color SHOCK — Ypač šviesinanti natūrali blondinė',            '12.0 Color SHOCK — Superlift Natural Blonde',            '12.0 Color SHOCK — Суперосветляющий натуральный блонд',              'Ypač šviesinanti natūrali blondinė',            '/colors/color-shock-12-0.jpeg'),
  ('color-shock-12-2',  '12.2 Color SHOCK — Ypač šviesinanti violetinė blondinė',           '12.2 Color SHOCK — Superlift Violet Blonde',             '12.2 Color SHOCK — Суперосветляющий фиолетовый блонд',               'Ypač šviesinanti violetinė blondinė',           '/colors/color-shock-12-2.jpeg'),
  ('color-shock-12-12', '12.12 Color SHOCK — Ypač šviesinanti perlinė blondinė',            '12.12 Color SHOCK — Superlift Pearl Blonde',             '12.12 Color SHOCK — Суперосветляющий жемчужный блонд',               'Ypač šviesinanti perlinė blondinė',             '/colors/color-shock-12-12.jpeg'),
  ('color-shock-12-21', '12.21 Color SHOCK — Ypač šviesinanti violetinė pelenų blondinė', '12.21 Color SHOCK — Superlift Violet Ash Blonde',        '12.21 Color SHOCK — Суперосветляющий фиолетовый пепельный блонд',    'Ypač šviesinanti violetinė pelenų blondinė',  '/colors/color-shock-12-21.jpeg'),
  ('color-shock-12-62', '12.62 Color SHOCK — Ypač šviesinanti rožinė blondinė',             '12.62 Color SHOCK — Superlift Pink Blonde',              '12.62 Color SHOCK — Суперосветляющий розовый блонд',                 'Ypač šviesinanti rožinė blondinė',              '/colors/color-shock-12-62.jpeg'),

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

-- ============================================
-- Seed data: Brands, Categories, Products
-- ============================================

-- Brands
insert into brands (slug, name, description_lt, description_en, description_ru) values
  ('color-shock', 'Color SHOCK', 'Profesionali plaukų dažų linija su 180 ml talpa', 'Professional hair dye line with 180 ml volume', 'Профессиональная линия красок для волос 180 мл'),
  ('rosanera-cosmetic', 'RosaNera Cosmetic', 'Profesionali kosmetikos ir priežiūros linija', 'Professional cosmetics and care line', 'Профессиональная линия косметики и ухода')
on conflict (slug) do nothing;

-- Categories
insert into categories (slug, name_lt, name_en, name_ru, description_lt, description_en, description_ru, sort_order) values
  ('dazai', 'Plaukų dažai', 'Hair Dyes', 'Краски для волос',
    'Color SHOCK profesionalūs plaukų dažai 180 ml talpoje. Plati spalvų paletė profesionaliam darbui salone.',
    'Color SHOCK professional hair dyes in 180 ml volume. Wide color palette for professional salon work.',
    'Профессиональные краски Color SHOCK в объёме 180 мл. Широкая палитра для салонной работы.',
    1),
  ('oksidantai', 'Oksidantai', 'Oxidants', 'Оксиданты',
    'Profesionalūs oksidantai skirtingoms koncentracijoms: 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).',
    'Professional oxidants in different concentrations: 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).',
    'Профессиональные оксиданты разных концентраций: 1.5% (5 VOL), 3% (10 VOL), 6% (20 VOL), 9% (30 VOL).',
    2),
  ('sampunai', 'Šampūnai ir priežiūra', 'Shampoos & Care', 'Шампуни и уход',
    'Plaukų priežiūros priemonės po dažymo — šampūnai, kondicionieriai, kaukės.',
    'Hair care products after coloring — shampoos, conditioners, masks.',
    'Средства по уходу за волосами после окрашивания — шампуни, кондиционеры, маски.',
    3),
  ('priemones', 'Pagalbinės priemonės', 'Accessories', 'Аксессуары',
    'Darbo įrankiai ir priemonės kirpėjams — šepetėliai, pelerinos, pirštinės.',
    'Work tools and accessories for hairdressers — brushes, capes, gloves.',
    'Инструменты и аксессуары для парикмахеров — кисти, пеньюары, перчатки.',
    4)
on conflict (slug) do nothing;

-- Sample products - Color SHOCK dažai
with cat as (select id from categories where slug = 'dazai'),
     brd as (select id from brands where slug = 'color-shock')
insert into products (
  slug, sku, category_id, brand_id,
  name_lt, name_en, name_ru,
  description_lt, description_en, description_ru,
  price_cents, volume_ml,
  color_number, color_name, color_hex, color_tone, color_family,
  stock_quantity, is_featured
) values
  ('color-shock-1-0', 'CS-1.0', (select id from cat), (select id from brd),
    '1.0 Color SHOCK — Juoda', '1.0 Color SHOCK — Black', '1.0 Color SHOCK — Чёрный',
    'Giliai juodas atspalvis su intensyviu pigmentu. Tinka visiems plaukų tipams.',
    'Deep black shade with intense pigment. Suitable for all hair types.',
    'Глубокий чёрный оттенок с интенсивным пигментом. Подходит для всех типов волос.',
    1290, 180, '1.0', 'Juoda', '#1A1A1A', 'neutrali', 'tamsi', 100, true),

  ('color-shock-4-0', 'CS-4.0', (select id from cat), (select id from brd),
    '4.0 Color SHOCK — Vidutinė ruda', '4.0 Color SHOCK — Medium Brown', '4.0 Color SHOCK — Средне-коричневый',
    'Natūrali vidutiniškai ruda spalva. Puikus pasirinkimas kasdieniam ryšiui.',
    'Natural medium brown color. Perfect choice for everyday look.',
    'Натуральный средне-коричневый. Идеальный выбор для повседневного образа.',
    1290, 180, '4.0', 'Vidutinė ruda', '#6B4423', 'neutrali', 'vidutinė', 100, true),

  ('color-shock-6-0', 'CS-6.0', (select id from cat), (select id from brd),
    '6.0 Color SHOCK — Tamsiai šviesi', '6.0 Color SHOCK — Dark Blonde', '6.0 Color SHOCK — Тёмный блонд',
    'Tamsiai šviesi natūrali spalva. Universali šviesių tonų bazė.',
    'Dark blonde natural color. Universal base for light tones.',
    'Тёмный натуральный блонд. Универсальная база для светлых тонов.',
    1290, 180, '6.0', 'Tamsiai šviesi', '#A67B5B', 'neutrali', 'vidutinė', 100, true),

  ('color-shock-6-4', 'CS-6.4', (select id from cat), (select id from brd),
    '6.4 Color SHOCK — Šviesiai varinė', '6.4 Color SHOCK — Light Copper', '6.4 Color SHOCK — Светлая медь',
    'Ryški varinė šviesi spalva su šiltu atspalviu. Efektinga rudens paletė.',
    'Bright copper light color with warm tone. Striking autumn palette.',
    'Яркий медный светлый с тёплым оттенком. Эффектная осенняя палитра.',
    1290, 180, '6.4', 'Šviesiai varinė', '#C84A2B', 'šilta', 'vidutinė', 100, true),

  ('color-shock-8-0', 'CS-8.0', (select id from cat), (select id from brd),
    '8.0 Color SHOCK — Šviesi', '8.0 Color SHOCK — Light Blonde', '8.0 Color SHOCK — Светлый блонд',
    'Natūrali šviesi spalva su švariu atspalviu. Klasikinis blondas.',
    'Natural light color with clean tone. Classic blonde.',
    'Натуральный светлый с чистым оттенком. Классический блонд.',
    1290, 180, '8.0', 'Šviesi', '#D4A574', 'neutrali', 'šviesi', 100, false),

  ('color-shock-9-1', 'CS-9.1', (select id from cat), (select id from brd),
    '9.1 Color SHOCK — Šalta šviesi', '9.1 Color SHOCK — Cool Blonde', '9.1 Color SHOCK — Холодный блонд',
    'Šalta šviesi spalva su peleniniu atspalviu. Modernus pasirinkimas.',
    'Cool light color with ash tone. Modern choice.',
    'Холодный светлый с пепельным оттенком. Современный выбор.',
    1290, 180, '9.1', 'Šalta šviesi', '#C5B7A0', 'šalta', 'šviesi', 100, false)
on conflict (slug) do nothing;

-- Oksidantai
with cat as (select id from categories where slug = 'oksidantai'),
     brd as (select id from brands where slug = 'color-shock')
insert into products (
  slug, sku, category_id, brand_id,
  name_lt, name_en, name_ru,
  description_lt, description_en, description_ru,
  price_cents, volume_ml,
  stock_quantity, is_featured
) values
  ('oxidant-1-5', 'OX-1-5', (select id from cat), (select id from brd),
    'Oksidantas 1.5% (5 VOL)', 'Oxidant 1.5% (5 VOL)', 'Оксидант 1.5% (5 VOL)',
    'Profesionalus 1.5% (5 VOL) oksidantas švelniam toninimui be šviesinimo efekto.',
    'Professional 1.5% (5 VOL) oxidant for gentle toning without lightening.',
    'Профессиональный 1.5% (5 VOL) оксидант для мягкого тонирования без осветления.',
    890, 1000, 50, false),

  ('oxidant-3', 'OX-3', (select id from cat), (select id from brd),
    'Oksidantas 3% (10 VOL)', 'Oxidant 3% (10 VOL)', 'Оксидант 3% (10 VOL)',
    'Profesionalus 3% (10 VOL) oksidantas toninimui ir spalvos atnaujinimui.',
    'Professional 3% (10 VOL) oxidant for toning and color refreshing.',
    'Профессиональный 3% (10 VOL) оксидант для тонирования и обновления цвета.',
    890, 1000, 50, false),

  ('oxidant-6', 'OX-6', (select id from cat), (select id from brd),
    'Oksidantas 6% (20 VOL)', 'Oxidant 6% (20 VOL)', 'Оксидант 6% (20 VOL)',
    'Profesionalus 6% (20 VOL) oksidantas standartiniam dažymui ir žilų plaukų dengimui.',
    'Professional 6% (20 VOL) oxidant for standard coloring and grey coverage.',
    'Профессиональный 6% (20 VOL) оксидант для стандартного окрашивания и закрашивания седины.',
    890, 1000, 50, true),

  ('oxidant-9', 'OX-9', (select id from cat), (select id from brd),
    'Oksidantas 9% (30 VOL)', 'Oxidant 9% (30 VOL)', 'Оксидант 9% (30 VOL)',
    'Profesionalus 9% (30 VOL) oksidantas šviesinimui 2–3 tonais.',
    'Professional 9% (30 VOL) oxidant for lightening by 2–3 tones.',
    'Профессиональный 9% (30 VOL) оксидант для осветления на 2–3 тона.',
    890, 1000, 50, false)
on conflict (slug) do nothing;

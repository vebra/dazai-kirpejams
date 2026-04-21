import type { Product, Category } from '@/lib/types'

/**
 * Mock duomenys naudoti kol bus prijungta Supabase.
 * Atitinka supabase/migrations/002_seed_data.sql struktūrą.
 */

export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    slug: 'dazai',
    name_lt: 'Plaukų dažai',
    name_en: 'Hair Dyes',
    name_ru: 'Краски для волос',
    description_lt:
      'Color SHOCK profesionalūs plaukų dažai 180 ml talpoje. Plati spalvų paletė profesionaliam darbui salone.',
    description_en:
      'Color SHOCK professional hair dyes in 180 ml volume. Wide color palette for professional salon work.',
    description_ru:
      'Профессиональные краски Color SHOCK в объёме 180 мл. Широкая палитра для салонной работы.',
    image_url: null,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'cat-2',
    slug: 'oksidantai',
    name_lt: 'Oksidantai',
    name_en: 'Oxidants',
    name_ru: 'Оксиданты',
    description_lt:
      'Profesionalūs oksidantai skirtingoms koncentracijoms: 3%, 6%, 9%, 12%.',
    description_en:
      'Professional oxidants in different concentrations: 3%, 6%, 9%, 12%.',
    description_ru:
      'Профессиональные оксиданты разных концентраций: 3%, 6%, 9%, 12%.',
    image_url: null,
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'cat-3',
    slug: 'sampunai',
    name_lt: 'Šampūnai ir priežiūra',
    name_en: 'Shampoos & Care',
    name_ru: 'Шампуни и уход',
    description_lt:
      'Plaukų priežiūros priemonės po dažymo — šampūnai, kondicionieriai, kaukės.',
    description_en:
      'Hair care products after coloring — shampoos, conditioners, masks.',
    description_ru:
      'Средства по уходу за волосами после окрашивания — шампуни, кондиционеры, маски.',
    image_url: null,
    sort_order: 3,
    is_active: true,
  },
  {
    id: 'cat-4',
    slug: 'priemones',
    name_lt: 'Pagalbinės priemonės',
    name_en: 'Accessories',
    name_ru: 'Аксессуары',
    description_lt:
      'Darbo įrankiai ir priemonės kirpėjams — šepetėliai, pelerinos, pirštinės.',
    description_en:
      'Work tools and accessories for hairdressers — brushes, capes, gloves.',
    description_ru:
      'Инструменты и аксессуары для парикмахеров — кисти, пеньюары, перчатки.',
    image_url: null,
    sort_order: 4,
    is_active: true,
  },
]

function makeProduct(p: Partial<Product>): Product {
  const now = new Date().toISOString()
  return {
    id: '',
    slug: '',
    sku: null,
    category_id: '',
    brand_id: null,
    name_lt: '',
    name_en: '',
    name_ru: '',
    description_lt: null,
    description_en: null,
    description_ru: null,
    ingredients_lt: null,
    ingredients_en: null,
    ingredients_ru: null,
    usage_lt: null,
    usage_en: null,
    usage_ru: null,
    price_cents: 0,
    compare_price_cents: null,
    b2b_price_cents: null,
    volume_ml: null,
    weight_g: null,
    color_number: null,
    color_name: null,
    color_hex: null,
    color_tone: null,
    color_family: null,
    stock_quantity: 100,
    is_in_stock: true,
    is_active: true,
    is_featured: false,
    image_urls: [],
    created_at: now,
    updated_at: now,
    ...p,
  }
}

/**
 * Pilnas Color SHOCK paletės sąrašas — 46 atspalviai pagal originalų
 * `js/products-data.js` HTML dizainą.
 *
 * Mapinimas iš HTML kategorijų į DB schemos `color_tone` / `color_family`:
 *  - `color_family` priklauso nuo numerio pirmo skaitmens:
 *      1–3 → tamsi, 4–6 → vidutinė, 7–12 → šviesi
 *  - `color_tone` parinkta pagal HTML kategoriją (Natural=neutrali,
 *    Ash/Violet/Superlift=šalta, Copper/Red/Warm Beige/Chocolate=šilta).
 *  - Toneriai (be numerio) — vidutinė/šviesi pagal vizualinį tamsumą.
 */
export type DyeColor = {
  /** HTML originalo identifikatorius (pvz. '1.00', '7.444', 'silver-grey') */
  key: string
  /** Atvaizduojamas spalvos numeris (toneriams — null) */
  num: string | null
  /** Slug — be taškų, su brūkšneliais */
  slug: string
  family: 'šviesi' | 'vidutinė' | 'tamsi'
  tone: 'neutrali' | 'šilta' | 'šalta'
  hex: string
  /** PDF swatch'o kelias (null — nėra nuotraukos, pvz. MEN linija) */
  imagePath: string | null
  name_lt: string
  name_en: string
  name_ru: string
}

/**
 * Pavadinimai — pagal Color SHOCK PDF katalogą (docs/color-shock-chart.pdf)
 * ir `docs/spalvu pavadinimai.txt`. Swatch'ų nuotraukos iškirptos 100%
 * tikslumu iš PDF embedded image resursų (154×255 px native raiška),
 * saugomos `public/colors/color-shock-{slug}.jpeg`.
 */
export const hairDyeColors: DyeColor[] = [
  // NATURAL — neutrali (9)
  { key: '1.00',  num: '1.00',  slug: 'color-shock-1-00',  family: 'tamsi',    tone: 'neutrali', hex: '#1A1A1A', imagePath: '/colors/color-shock-1-00.jpeg',  name_lt: 'Intensyvi juoda',    name_en: 'Intense Black',   name_ru: 'Интенсивный чёрный' },
  { key: '3.00',  num: '3.00',  slug: 'color-shock-3-00',  family: 'tamsi',    tone: 'neutrali', hex: '#3B2314', imagePath: '/colors/color-shock-3-00.jpeg',  name_lt: 'Tamsiai ruda',       name_en: 'Dark Brown',      name_ru: 'Тёмно-коричневый' },
  { key: '4.00',  num: '4.00',  slug: 'color-shock-4-00',  family: 'vidutinė', tone: 'neutrali', hex: '#4A3021', imagePath: '/colors/color-shock-4-00.jpeg',  name_lt: 'Ruda',               name_en: 'Brown',           name_ru: 'Коричневый' },
  { key: '5.00',  num: '5.00',  slug: 'color-shock-5-00',  family: 'vidutinė', tone: 'neutrali', hex: '#5C3D2E', imagePath: '/colors/color-shock-5-00.jpeg',  name_lt: 'Šviesiai ruda',      name_en: 'Light Brown',     name_ru: 'Светло-коричневый' },
  { key: '6.00',  num: '6.00',  slug: 'color-shock-6-00',  family: 'vidutinė', tone: 'neutrali', hex: '#7A5A3E', imagePath: '/colors/color-shock-6-00.jpeg',  name_lt: 'Tamsi blondinė',     name_en: 'Dark Blonde',     name_ru: 'Тёмный блонд' },
  { key: '7.00',  num: '7.00',  slug: 'color-shock-7-00',  family: 'šviesi',   tone: 'neutrali', hex: '#8B7355', imagePath: '/colors/color-shock-7-00.jpeg',  name_lt: 'Intensyvi blondinė', name_en: 'Intense Blonde',  name_ru: 'Интенсивный блонд' },
  { key: '8.00',  num: '8.00',  slug: 'color-shock-8-00',  family: 'šviesi',   tone: 'neutrali', hex: '#B8956A', imagePath: '/colors/color-shock-8-00.jpeg',  name_lt: 'Šviesi blondinė',    name_en: 'Light Blonde',    name_ru: 'Светлый блонд' },
  { key: '9.00',  num: '9.00',  slug: 'color-shock-9-00',  family: 'šviesi',   tone: 'neutrali', hex: '#D4B896', imagePath: '/colors/color-shock-9-00.jpeg',  name_lt: 'Blondinė',           name_en: 'Blonde',          name_ru: 'Блонд' },
  { key: '10.00', num: '10.00', slug: 'color-shock-10-00', family: 'šviesi',   tone: 'neutrali', hex: '#E8D5B8', imagePath: '/colors/color-shock-10-00.jpeg', name_lt: 'Platininė blondinė', name_en: 'Platinum Blonde', name_ru: 'Платиновый блонд' },

  // ASH — šalta (6)
  { key: '5.1',  num: '5.1',  slug: 'color-shock-5-1',  family: 'vidutinė', tone: 'šalta', hex: '#6B5D52', imagePath: '/colors/color-shock-5-1.jpeg',  name_lt: 'Šviesiai pelenų ruda',        name_en: 'Light Ash Brown',        name_ru: 'Светлый пепельно-коричневый' },
  { key: '6.1',  num: '6.1',  slug: 'color-shock-6-1',  family: 'vidutinė', tone: 'šalta', hex: '#8A7D6E', imagePath: '/colors/color-shock-6-1.jpeg',  name_lt: 'Tamsi pelenų blondinė',       name_en: 'Dark Ash Blonde',        name_ru: 'Тёмный пепельный блонд' },
  { key: '7.1',  num: '7.1',  slug: 'color-shock-7-1',  family: 'šviesi',   tone: 'šalta', hex: '#A09585', imagePath: '/colors/color-shock-7-1.jpeg',  name_lt: 'Pelenų blondinė',             name_en: 'Ash Blonde',             name_ru: 'Пепельный блонд' },
  { key: '8.1',  num: '8.1',  slug: 'color-shock-8-1',  family: 'šviesi',   tone: 'šalta', hex: '#B8AE9E', imagePath: '/colors/color-shock-8-1.jpeg',  name_lt: 'Šviesi pelenų blondinė',      name_en: 'Light Ash Blonde',       name_ru: 'Светлый пепельный блонд' },
  { key: '9.1',  num: '9.1',  slug: 'color-shock-9-1',  family: 'šviesi',   tone: 'šalta', hex: '#D0C8B8', imagePath: '/colors/color-shock-9-1.jpeg',  name_lt: 'Labai šviesi pelenų blondinė', name_en: 'Very Light Ash Blonde', name_ru: 'Очень светлый пепельный блонд' },
  { key: '10.1', num: '10.1', slug: 'color-shock-10-1', family: 'šviesi',   tone: 'šalta', hex: '#E2DDD0', imagePath: '/colors/color-shock-10-1.jpeg', name_lt: 'Platininė pelenų blondinė',   name_en: 'Platinum Ash Blonde',    name_ru: 'Платиновый пепельный блонд' },

  // ICY CHOCOLATE — šalta (1)
  { key: '7.18', num: '7.18', slug: 'color-shock-7-18', family: 'šviesi', tone: 'šalta', hex: '#7A6550', imagePath: '/colors/color-shock-7-18.jpeg', name_lt: 'Šalta šokoladinė ruda', name_en: 'Cool Chocolate Brown', name_ru: 'Холодный шоколадно-коричневый' },

  // GOLDEN — šilta (1)
  { key: '9.3', num: '9.3', slug: 'color-shock-9-3', family: 'šviesi', tone: 'šilta', hex: '#C4A24E', imagePath: '/colors/color-shock-9-3.jpeg', name_lt: 'Labai šviesi auksinė blondinė', name_en: 'Very Light Golden Blonde', name_ru: 'Очень светлый золотистый блонд' },

  // ASH PEARL — šalta (3)
  { key: '7.12', num: '7.12', slug: 'color-shock-7-12', family: 'šviesi', tone: 'šalta', hex: '#8A7872', imagePath: '/colors/color-shock-7-12.jpeg', name_lt: 'Perlinė blondinė',              name_en: 'Pearl Blonde',            name_ru: 'Жемчужный блонд' },
  { key: '8.12', num: '8.12', slug: 'color-shock-8-12', family: 'šviesi', tone: 'šalta', hex: '#A8968F', imagePath: '/colors/color-shock-8-12.jpeg', name_lt: 'Šviesi perlinė blondinė',       name_en: 'Light Pearl Blonde',      name_ru: 'Светлый жемчужный блонд' },
  { key: '9.12', num: '9.12', slug: 'color-shock-9-12', family: 'šviesi', tone: 'šalta', hex: '#C4B5AE', imagePath: '/colors/color-shock-9-12.jpeg', name_lt: 'Labai šviesi perlinė blondinė', name_en: 'Very Light Pearl Blonde', name_ru: 'Очень светлый жемчужный блонд' },

  // VIOLET — šalta (1)
  { key: '5.22', num: '5.22', slug: 'color-shock-5-22', family: 'vidutinė', tone: 'šalta', hex: '#5C1A6E', imagePath: '/colors/color-shock-5-22.jpeg', name_lt: 'Intensyvi šviesi violetinė ruda', name_en: 'Intense Light Violet Brown', name_ru: 'Интенсивный светлый фиолетово-коричневый' },

  // VIOLET GOLD — neutrali (1)
  { key: '4.23', num: '4.23', slug: 'color-shock-4-23', family: 'vidutinė', tone: 'neutrali', hex: '#5A3828', imagePath: '/colors/color-shock-4-23.jpeg', name_lt: 'Tabako ruda', name_en: 'Tobacco Brown', name_ru: 'Табачно-коричневый' },

  // WARM BEIGE — šilta (5)
  { key: '6.32',  num: '6.32',  slug: 'color-shock-6-32',  family: 'vidutinė', tone: 'šilta', hex: '#8A6E4E', imagePath: '/colors/color-shock-6-32.jpeg',  name_lt: 'Tamsi smėlinė blondinė',       name_en: 'Dark Beige Blonde',         name_ru: 'Тёмный бежевый блонд' },
  { key: '7.32',  num: '7.32',  slug: 'color-shock-7-32',  family: 'šviesi',   tone: 'šilta', hex: '#A08462', imagePath: '/colors/color-shock-7-32.jpeg',  name_lt: 'Smėlinė blondinė',             name_en: 'Beige Blonde',              name_ru: 'Бежевый блонд' },
  { key: '8.32',  num: '8.32',  slug: 'color-shock-8-32',  family: 'šviesi',   tone: 'šilta', hex: '#C4A07A', imagePath: '/colors/color-shock-8-32.jpeg',  name_lt: 'Šviesi smėlinė blondinė',      name_en: 'Light Beige Blonde',        name_ru: 'Светлый бежевый блонд' },
  { key: '9.32',  num: '9.32',  slug: 'color-shock-9-32',  family: 'šviesi',   tone: 'šilta', hex: '#D8BFA0', imagePath: '/colors/color-shock-9-32.jpeg',  name_lt: 'Labai šviesi smėlinė blondinė', name_en: 'Very Light Beige Blonde',  name_ru: 'Очень светлый бежевый блонд' },
  { key: '10.32', num: '10.32', slug: 'color-shock-10-32', family: 'šviesi',   tone: 'šilta', hex: '#E8D5B8', imagePath: '/colors/color-shock-10-32.jpeg', name_lt: 'Platininė smėlinė blondinė',   name_en: 'Platinum Beige Blonde',     name_ru: 'Платиновый бежевый блонд' },

  // COPPER — šilta (2)
  { key: '7.444', num: '7.444', slug: 'color-shock-7-444', family: 'šviesi', tone: 'šilta', hex: '#C4622A', imagePath: '/colors/color-shock-7-444.jpeg', name_lt: 'Ypač intensyvi varinė blondinė',        name_en: 'Extra Intense Copper Blonde',       name_ru: 'Экстра интенсивный медный блонд' },
  { key: '8.444', num: '8.444', slug: 'color-shock-8-444', family: 'šviesi', tone: 'šilta', hex: '#D4884A', imagePath: '/colors/color-shock-8-444.jpeg', name_lt: 'Ypač intensyvi šviesi varinė blondinė', name_en: 'Extra Intense Light Copper Blonde', name_ru: 'Экстра интенсивный светлый медный блонд' },

  // MAHOGANY — šilta (1)
  { key: '6.5', num: '6.5', slug: 'color-shock-6-5', family: 'vidutinė', tone: 'šilta', hex: '#6E2244', imagePath: '/colors/color-shock-6-5.jpeg', name_lt: 'Tamsus raudonmedis', name_en: 'Dark Mahogany', name_ru: 'Тёмный махагон' },

  // RED — šilta (2)
  { key: '6.66', num: '6.66', slug: 'color-shock-6-66', family: 'vidutinė', tone: 'šilta', hex: '#A52A2A', imagePath: '/colors/color-shock-6-66.jpeg', name_lt: 'Intensyvi tamsiai raudona blondinė', name_en: 'Intense Dark Red Blonde', name_ru: 'Интенсивный тёмно-красный блонд' },
  { key: '7.66', num: '7.66', slug: 'color-shock-7-66', family: 'šviesi',   tone: 'šilta', hex: '#C44040', imagePath: '/colors/color-shock-7-66.jpeg', name_lt: 'Intensyvi raudona blondinė',         name_en: 'Intense Red Blonde',      name_ru: 'Интенсивный красный блонд' },

  // CHOCOLATE — šilta (2)
  { key: '5.8', num: '5.8', slug: 'color-shock-5-8', family: 'vidutinė', tone: 'šilta', hex: '#5C3420', imagePath: '/colors/color-shock-5-8.jpeg', name_lt: 'Šokoladinė ruda',         name_en: 'Chocolate Brown',       name_ru: 'Шоколадно-коричневый' },
  { key: '6.8', num: '6.8', slug: 'color-shock-6-8', family: 'vidutinė', tone: 'šilta', hex: '#7A4A2E', imagePath: '/colors/color-shock-6-8.jpeg', name_lt: 'Tamsi šokoladinė blondinė', name_en: 'Dark Chocolate Blonde', name_ru: 'Тёмный шоколадный блонд' },

  // SUPERLIFT — šalta (6)
  { key: '11.11', num: '11.11', slug: 'color-shock-11-11', family: 'šviesi', tone: 'šalta', hex: '#C8B8A8', imagePath: '/colors/color-shock-11-11.jpeg', name_lt: 'Intensyvi šviesi platininė pelenų blondinė', name_en: 'Intense Light Platinum Ash Blonde', name_ru: 'Интенсивный светлый платиновый пепельный блонд' },
  { key: '12.0',  num: '12.0',  slug: 'color-shock-12-0',  family: 'šviesi', tone: 'šalta', hex: '#D8CFC5', imagePath: '/colors/color-shock-12-0.jpeg',  name_lt: 'Ypač šviesinanti natūrali blondinė',           name_en: 'Superlift Natural Blonde',           name_ru: 'Суперосветляющий натуральный блонд' },
  { key: '12.2',  num: '12.2',  slug: 'color-shock-12-2',  family: 'šviesi', tone: 'šalta', hex: '#E0D2C8', imagePath: '/colors/color-shock-12-2.jpeg',  name_lt: 'Ypač šviesinanti violetinė blondinė',          name_en: 'Superlift Violet Blonde',            name_ru: 'Суперосветляющий фиолетовый блонд' },
  { key: '12.12', num: '12.12', slug: 'color-shock-12-12', family: 'šviesi', tone: 'šalta', hex: '#D8C8C0', imagePath: '/colors/color-shock-12-12.jpeg', name_lt: 'Ypač šviesinanti perlinė blondinė',            name_en: 'Superlift Pearl Blonde',             name_ru: 'Суперосветляющий жемчужный блонд' },
  { key: '12.21', num: '12.21', slug: 'color-shock-12-21', family: 'šviesi', tone: 'šalta', hex: '#DFD0C8', imagePath: '/colors/color-shock-12-21.jpeg', name_lt: 'Ypač šviesinanti violetinė pelenų blondinė', name_en: 'Superlift Violet Ash Blonde',        name_ru: 'Суперосветляющий фиолетовый пепельный блонд' },
  { key: '12.62', num: '12.62', slug: 'color-shock-12-62', family: 'šviesi', tone: 'šalta', hex: '#D8C4C0', imagePath: '/colors/color-shock-12-62.jpeg', name_lt: 'Ypač šviesinanti rožinė blondinė',             name_en: 'Superlift Pink Blonde',              name_ru: 'Суперосветляющий розовый блонд' },

  // TONER & CORRECTORS — be numerinio kodo (6)
  { key: 'silver-grey',  num: null, slug: 'color-shock-silver-grey',  family: 'vidutinė', tone: 'šalta',    hex: '#8A8A8A', imagePath: '/colors/color-shock-silver-grey.jpeg',  name_lt: 'Sidabriškai pilka', name_en: 'Silver Grey',  name_ru: 'Серебристо-серый' },
  { key: 'light-grey',   num: null, slug: 'color-shock-light-grey',   family: 'šviesi',   tone: 'šalta',    hex: '#B0B0B0', imagePath: '/colors/color-shock-light-grey.jpeg',   name_lt: 'Šviesiai pilka',    name_en: 'Light Grey',   name_ru: 'Светло-серый' },
  { key: 'dark-grey',    num: null, slug: 'color-shock-dark-grey',    family: 'vidutinė', tone: 'neutrali', hex: '#6A6A6A', imagePath: '/colors/color-shock-dark-grey.jpeg',    name_lt: 'Tamsiai pilka',     name_en: 'Dark Grey',    name_ru: 'Тёмно-серый' },
  { key: 'silver-pearl', num: null, slug: 'color-shock-silver-pearl', family: 'šviesi',   tone: 'šalta',    hex: '#C0B8B0', imagePath: '/colors/color-shock-silver-pearl.jpeg', name_lt: 'Sidabrinis perlas', name_en: 'Silver Pearl', name_ru: 'Серебристый жемчуг' },
  { key: 'silver-beige', num: null, slug: 'color-shock-silver-beige', family: 'šviesi',   tone: 'neutrali', hex: '#C8B8A0', imagePath: '/colors/color-shock-silver-beige.jpeg', name_lt: 'Sidabrinė smėlinė', name_en: 'Silver Beige', name_ru: 'Серебристо-бежевый' },
  { key: 'lilac',        num: null, slug: 'color-shock-lilac',        family: 'šviesi',   tone: 'šalta',    hex: '#C8A0B0', imagePath: '/colors/color-shock-lilac.jpeg',        name_lt: 'Alyvinė',           name_en: 'Lilac',        name_ru: 'Сиреневый' },

  // MEN — tamsūs atspalviai vyrams (4 spalvos — pilna paletė iki 50; nėra PDF swatch'o)
  { key: '4-men', num: '4 MEN', slug: 'color-shock-4-men', family: 'tamsi', tone: 'neutrali', hex: '#2A1810', imagePath: null, name_lt: 'Tamsiai kaštoninė (vyrams)', name_en: 'Dark Chestnut (Men)',  name_ru: 'Тёмно-каштановый (для мужчин)' },
  { key: '5-men', num: '5 MEN', slug: 'color-shock-5-men', family: 'tamsi', tone: 'neutrali', hex: '#3B2314', imagePath: null, name_lt: 'Kaštoninė (vyrams)',         name_en: 'Chestnut (Men)',       name_ru: 'Каштановый (для мужчин)' },
  { key: '6-men', num: '6 MEN', slug: 'color-shock-6-men', family: 'tamsi', tone: 'neutrali', hex: '#4A3021', imagePath: null, name_lt: 'Tamsiai blondinė (vyrams)',  name_en: 'Dark Blonde (Men)',    name_ru: 'Тёмный блонд (для мужчин)' },
  { key: '7-men', num: '7 MEN', slug: 'color-shock-7-men', family: 'tamsi', tone: 'neutrali', hex: '#5C3D2E', imagePath: null, name_lt: 'Vidutinė blondinė (vyrams)', name_en: 'Medium Blonde (Men)',  name_ru: 'Средний блонд (для мужчин)' },
]

/** Featured produktai pagrindiniam puslapiui — 4 ryškūs, įvairaus tono atspalviai */
const featuredSlugs = new Set([
  'color-shock-1-00',
  'color-shock-6-66',
  'color-shock-7-444',
  'color-shock-9-1',
])

const hairDyes: Product[] = hairDyeColors.map((c, idx) => {
  // Numeruoti dažai — „{num} Color SHOCK — {spalva}" (skaičius pradžioje, kad
  // koloristai greitai atpažintų atspalvio kodą). Toneriai be numerio lieka
  // klasikiniu „Color SHOCK {name}" formatu.
  const namePrefixLt = c.num ? `${c.num} Color SHOCK` : `Color SHOCK ${c.name_en}`
  const namePrefixEn = c.num ? `${c.num} Color SHOCK` : `Color SHOCK ${c.name_en}`
  const namePrefixRu = c.num ? `${c.num} Color SHOCK` : `Color SHOCK ${c.name_en}`
  return makeProduct({
    id: `prod-dye-${idx + 1}`,
    slug: c.slug,
    sku: c.num ? `CS-${c.num}` : `CS-${c.key.toUpperCase()}`,
    category_id: 'cat-1',
    brand_id: 'brand-1',
    name_lt: `${namePrefixLt} — ${c.name_lt}`,
    name_en: `${namePrefixEn} — ${c.name_en}`,
    name_ru: `${namePrefixRu} — ${c.name_ru}`,
    description_lt: `Profesionalus kreminės tekstūros plaukų dažas ${c.name_lt.toLowerCase()} atspalvio. Stabili formulė, ilgalaikis rezultatas, didelė 180 ml talpa.`,
    description_en: `Professional cream-textured hair dye in ${c.name_en.toLowerCase()} shade. Stable formula, long-lasting result, large 180 ml volume.`,
    description_ru: `Профессиональная кремовая краска для волос оттенка «${c.name_ru.toLowerCase()}». Стабильная формула, долговечный результат, большой объём 180 мл.`,
    ingredients_lt:
      'Aqua, Cetearyl Alcohol, Propylene Glycol, Ammonium Hydroxide, Fragrance, Ascorbic Acid.',
    ingredients_en:
      'Aqua, Cetearyl Alcohol, Propylene Glycol, Ammonium Hydroxide, Fragrance, Ascorbic Acid.',
    ingredients_ru:
      'Aqua, Cetearyl Alcohol, Propylene Glycol, Ammonium Hydroxide, Fragrance, Ascorbic Acid.',
    usage_lt:
      'Maišykite 1:2 su pasirinktos koncentracijos oksidantu. Laikymo laikas: 30–35 min. Nuplaukite šampūnu.',
    usage_en:
      'Mix 1:2 with oxidant of chosen concentration. Development time: 30–35 min. Rinse with shampoo.',
    usage_ru:
      'Смешайте 1:2 с оксидантом выбранной концентрации. Время выдержки: 30–35 мин. Смойте шампунём.',
    price_cents: 790, // 7.90 €
    // Vyriški dažai (4-men, 5-men, 6-men, 7-men) — be senos kainos.
    // Moteriškos spalvos — 11.00 € senoji kaina.
    compare_price_cents: c.key.endsWith('-men') ? null : 1100,
    volume_ml: 180,
    color_number: c.num,
    color_name: c.name_lt,
    color_hex: c.hex,
    color_tone: c.tone,
    color_family: c.family,
    is_featured: featuredSlugs.has(c.slug),
    image_urls: c.imagePath ? [c.imagePath] : [],
  })
})

// Oksidantai
const oxidants: Product[] = [
  { pct: '3', desc_lt: 'toninimui ir tamsinimui', desc_en: 'for toning and darkening', desc_ru: 'для тонирования и затемнения' },
  { pct: '6', desc_lt: 'dažymui iki 2 tonų', desc_en: 'for coloring up to 2 tones', desc_ru: 'для окрашивания до 2 тонов' },
  { pct: '9', desc_lt: 'šviesinimui iki 3 tonų', desc_en: 'for lightening up to 3 tones', desc_ru: 'для осветления до 3 тонов' },
  { pct: '12', desc_lt: 'maksimaliam šviesinimui', desc_en: 'for maximum lightening', desc_ru: 'для максимального осветления' },
].map((o, idx) =>
  makeProduct({
    id: `prod-ox-${idx + 1}`,
    slug: `oxidant-${o.pct}`,
    sku: `OX-${o.pct}`,
    category_id: 'cat-2',
    brand_id: 'brand-1',
    name_lt: `Oksidantas ${o.pct}%`,
    name_en: `Oxidant ${o.pct}%`,
    name_ru: `Оксидант ${o.pct}%`,
    description_lt: `Profesionalus ${o.pct}% oksidantas ${o.desc_lt}. Stabilus, lengvai maišomas.`,
    description_en: `Professional ${o.pct}% oxidant ${o.desc_en}. Stable, easy to mix.`,
    description_ru: `Профессиональный ${o.pct}% оксидант ${o.desc_ru}. Стабильный, легко смешивается.`,
    price_cents: 890,
    volume_ml: 1000,
    is_featured: o.pct === '3',
  })
)

// Šampūnai
const shampoos: Product[] = [
  {
    slug: 'shampoo-color-protect',
    name_lt: 'Color Protect Šampūnas',
    name_en: 'Color Protect Shampoo',
    name_ru: 'Шампунь Color Protect',
    desc_lt: 'Apsauginis šampūnas dažytiems plaukams. Išlaiko spalvos intensyvumą.',
    desc_en: 'Protective shampoo for colored hair. Preserves color intensity.',
    desc_ru: 'Защитный шампунь для окрашенных волос. Сохраняет интенсивность цвета.',
    price: 1490,
  },
  {
    slug: 'shampoo-silver',
    name_lt: 'Silver Šampūnas',
    name_en: 'Silver Shampoo',
    name_ru: 'Серебряный шампунь',
    desc_lt: 'Šampūnas šviesioms ir pelenų spalvoms. Neutralizuoja geltoną atspalvį.',
    desc_en: 'Shampoo for blonde and ash colors. Neutralizes yellow tones.',
    desc_ru: 'Шампунь для блонда и пепельных оттенков. Нейтрализует желтизну.',
    price: 1590,
  },
  {
    slug: 'conditioner-repair',
    name_lt: 'Repair Kondicionierius',
    name_en: 'Repair Conditioner',
    name_ru: 'Восстанавливающий кондиционер',
    desc_lt: 'Atstatantis kondicionierius pažeistiems plaukams.',
    desc_en: 'Repairing conditioner for damaged hair.',
    desc_ru: 'Восстанавливающий кондиционер для повреждённых волос.',
    price: 1390,
  },
  {
    slug: 'hair-mask-intense',
    name_lt: 'Intense Kaukė',
    name_en: 'Intense Mask',
    name_ru: 'Интенсивная маска',
    desc_lt: 'Intensyvi maitinamoji kaukė plaukams po dažymo.',
    desc_en: 'Intensive nourishing mask for hair after coloring.',
    desc_ru: 'Интенсивная питательная маска для волос после окрашивания.',
    price: 1890,
  },
].map((s, idx) =>
  makeProduct({
    id: `prod-shampoo-${idx + 1}`,
    slug: s.slug,
    sku: `SH-${idx + 1}`,
    category_id: 'cat-3',
    brand_id: 'brand-2',
    name_lt: s.name_lt,
    name_en: s.name_en,
    name_ru: s.name_ru,
    description_lt: s.desc_lt,
    description_en: s.desc_en,
    description_ru: s.desc_ru,
    price_cents: s.price,
    volume_ml: 500,
    is_featured: idx < 2,
  })
)

// Priemonės
const accessories: Product[] = [
  {
    slug: 'brush-set',
    name_lt: 'Dažų šepetėlių rinkinys',
    name_en: 'Hair Dye Brush Set',
    name_ru: 'Набор кистей для окрашивания',
    desc_lt: 'Profesionalus 3 šepetėlių rinkinys tiksliam dažymui.',
    desc_en: 'Professional 3-brush set for precise coloring.',
    desc_ru: 'Профессиональный набор из 3 кистей для точного окрашивания.',
    price: 1290,
  },
  {
    slug: 'gloves-100',
    name_lt: 'Vienkartinės pirštinės (100 vnt.)',
    name_en: 'Disposable Gloves (100 pcs)',
    name_ru: 'Одноразовые перчатки (100 шт.)',
    desc_lt: 'Nitrilo pirštinės profesionaliam naudojimui.',
    desc_en: 'Nitrile gloves for professional use.',
    desc_ru: 'Нитриловые перчатки для профессионального использования.',
    price: 990,
  },
  {
    slug: 'cape-professional',
    name_lt: 'Profesionali pelerina',
    name_en: 'Professional Cape',
    name_ru: 'Профессиональный пеньюар',
    desc_lt: 'Vandeniui atspari pelerina dažymui ir kirpimui.',
    desc_en: 'Waterproof cape for coloring and cutting.',
    desc_ru: 'Водостойкий пеньюар для окрашивания и стрижки.',
    price: 1990,
  },
  {
    slug: 'mixing-bowl',
    name_lt: 'Dažų maišymo indas',
    name_en: 'Mixing Bowl',
    name_ru: 'Чаша для смешивания',
    desc_lt: 'Neskleidžiantis plastiko maišymo indas su skalės.',
    desc_en: 'Non-slip plastic mixing bowl with measurement marks.',
    desc_ru: 'Нескользящая пластиковая чаша с мерной шкалой.',
    price: 490,
  },
].map((a, idx) =>
  makeProduct({
    id: `prod-acc-${idx + 1}`,
    slug: a.slug,
    sku: `AC-${idx + 1}`,
    category_id: 'cat-4',
    brand_id: 'brand-2',
    name_lt: a.name_lt,
    name_en: a.name_en,
    name_ru: a.name_ru,
    description_lt: a.desc_lt,
    description_en: a.desc_en,
    description_ru: a.desc_ru,
    price_cents: a.price,
    volume_ml: null,
    is_featured: false,
  })
)

export const mockProducts: Product[] = [
  ...hairDyes,
  ...oxidants,
  ...shampoos,
  ...accessories,
]

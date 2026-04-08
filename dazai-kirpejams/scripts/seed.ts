/**
 * Supabase duomenų seed scriptas.
 *
 * Paleidimas:
 *   npx tsx scripts/seed.ts
 *
 * Reikalavimai:
 *   - .env.local su NEXT_PUBLIC_SUPABASE_URL ir SUPABASE_SERVICE_ROLE_KEY
 *   - Migracijos jau pritaikytos (001_initial_schema.sql, 002_seed_data.sql)
 *
 * Veikia idempotentiškai — upsert'ina pagal slug. Saugu paleisti kelis kartus.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { mockCategories, mockProducts } from '../src/lib/data/mock-products'

// Įkraunam .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_KEY ||
  SUPABASE_URL.includes('your-supabase') ||
  SUPABASE_SERVICE_KEY.includes('your-supabase')
) {
  console.error(
    '\n❌ Supabase nesukonfigūruotas. Nustatykite šiuos kintamuosius .env.local faile:'
  )
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function seedBrands() {
  console.log('→ Seeding brands...')
  const brands = [
    {
      slug: 'color-shock',
      name: 'Color SHOCK',
      description_lt: 'Profesionali plaukų dažų linija su 180 ml talpa',
      description_en: 'Professional hair dye line with 180 ml volume',
      description_ru: 'Профессиональная линия красок для волос 180 мл',
    },
    {
      slug: 'rosanera-cosmetic',
      name: 'RosaNera Cosmetic',
      description_lt: 'Profesionali kosmetikos ir priežiūros linija',
      description_en: 'Professional cosmetics and care line',
      description_ru: 'Профессиональная линия косметики и ухода',
    },
  ]

  const { error } = await supabase
    .from('brands')
    .upsert(brands, { onConflict: 'slug' })

  if (error) throw new Error(`Brands upsert failed: ${error.message}`)
  console.log(`  ✓ ${brands.length} brands`)
}

async function seedCategories() {
  console.log('→ Seeding categories...')
  const categories = mockCategories.map((c) => ({
    slug: c.slug,
    name_lt: c.name_lt,
    name_en: c.name_en,
    name_ru: c.name_ru,
    description_lt: c.description_lt,
    description_en: c.description_en,
    description_ru: c.description_ru,
    sort_order: c.sort_order,
    is_active: c.is_active,
  }))

  const { error } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })

  if (error) throw new Error(`Categories upsert failed: ${error.message}`)
  console.log(`  ✓ ${categories.length} categories`)
}

async function fetchIdMaps() {
  // Po categories/brands upsert gaunam jų tikruosius UUID pagal slug
  const { data: cats } = await supabase.from('categories').select('id, slug')
  const { data: brands } = await supabase.from('brands').select('id, slug')

  const catMap = new Map<string, string>()
  const brandMap = new Map<string, string>()

  for (const c of cats || []) catMap.set(c.slug, c.id)
  for (const b of brands || []) brandMap.set(b.slug, b.id)

  return { catMap, brandMap }
}

/**
 * Pašalina iš DB tuos produktus, kurių slug nebėra naujame mock sąraše.
 * Naudinga, kai pakeitėme kategorijos turinį (pvz. pridėjome 26 spalvas
 * arba performatavome slug'us 1.0 → 1.00).
 *
 * order_items lentelė turi `on delete restrict` FK į products, todėl tai
 * saugu vykdyti tik tol, kol nėra realių užsakymų. Pre-launch — saugu.
 */
async function pruneOrphanedProducts(
  catMap: Map<string, string>,
  validSlugs: Set<string>
) {
  console.log('→ Pruning orphaned products...')

  const { data: existing, error: fetchErr } = await supabase
    .from('products')
    .select('id, slug, category_id')
  if (fetchErr) throw new Error(`Fetch existing failed: ${fetchErr.message}`)

  // Trinam tik tuos, kurie priklauso žinomai kategorijai (catMap) ir kurių
  // slug'o nebėra naujame mock sąraše. Nežinomos kategorijos neliečiamos.
  const knownCategoryIds = new Set(catMap.values())
  const orphanIds = (existing || [])
    .filter(
      (p) =>
        knownCategoryIds.has(p.category_id) && !validSlugs.has(p.slug)
    )
    .map((p) => p.id)

  if (orphanIds.length === 0) {
    console.log('  ✓ no orphans')
    return
  }

  const { error: delErr } = await supabase
    .from('products')
    .delete()
    .in('id', orphanIds)
  if (delErr) throw new Error(`Prune failed: ${delErr.message}`)
  console.log(`  ✓ removed ${orphanIds.length} orphan(s)`)
}

async function seedProducts(
  catMap: Map<string, string>,
  brandMap: Map<string, string>
) {
  console.log('→ Seeding products...')

  // Mock'e category_id = 'cat-1', 'cat-2'... — konvertuojam į slug ir tada į UUID
  const mockCatSlugById: Record<string, string> = {
    'cat-1': 'dazai',
    'cat-2': 'oksidantai',
    'cat-3': 'sampunai',
    'cat-4': 'priemones',
  }
  const mockBrandSlugById: Record<string, string> = {
    'brand-1': 'color-shock',
    'brand-2': 'rosanera-cosmetic',
  }

  const rows = mockProducts.map((p) => {
    const catSlug = mockCatSlugById[p.category_id]
    const brandSlug = p.brand_id ? mockBrandSlugById[p.brand_id] : null
    const categoryUuid = catSlug ? catMap.get(catSlug) : null
    const brandUuid = brandSlug ? brandMap.get(brandSlug) : null

    if (!categoryUuid) {
      throw new Error(
        `Produktas ${p.slug}: kategorija ${p.category_id} nerasta DB`
      )
    }

    return {
      slug: p.slug,
      sku: p.sku,
      category_id: categoryUuid,
      brand_id: brandUuid,
      name_lt: p.name_lt,
      name_en: p.name_en,
      name_ru: p.name_ru,
      description_lt: p.description_lt,
      description_en: p.description_en,
      description_ru: p.description_ru,
      ingredients_lt: p.ingredients_lt,
      ingredients_en: p.ingredients_en,
      ingredients_ru: p.ingredients_ru,
      usage_lt: p.usage_lt,
      usage_en: p.usage_en,
      usage_ru: p.usage_ru,
      price_cents: p.price_cents,
      compare_price_cents: p.compare_price_cents,
      b2b_price_cents: p.b2b_price_cents,
      volume_ml: p.volume_ml,
      weight_g: p.weight_g,
      color_number: p.color_number,
      color_name: p.color_name,
      color_hex: p.color_hex,
      color_tone: p.color_tone,
      color_family: p.color_family,
      stock_quantity: p.stock_quantity,
      is_in_stock: p.is_in_stock,
      is_active: p.is_active,
      is_featured: p.is_featured,
      image_urls: p.image_urls,
    }
  })

  // Upsert partijomis po 50 įrašų — saugiau dideliems katalogams
  const chunkSize = 50
  let inserted = 0
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase
      .from('products')
      .upsert(chunk, { onConflict: 'slug' })
    if (error) throw new Error(`Products upsert failed: ${error.message}`)
    inserted += chunk.length
  }
  console.log(`  ✓ ${inserted} products`)
}

async function main() {
  console.log('\n🌱 Seeding Supabase...\n')
  try {
    await seedBrands()
    await seedCategories()
    const { catMap, brandMap } = await fetchIdMaps()
    const validSlugs = new Set(mockProducts.map((p) => p.slug))
    await pruneOrphanedProducts(catMap, validSlugs)
    await seedProducts(catMap, brandMap)
    console.log('\n✓ Seed sėkmingas!\n')
  } catch (err) {
    console.error('\n❌ Seed nepavyko:', err)
    process.exit(1)
  }
}

main()

/**
 * RosaNera tiekėjo kainoraščio importas į `products` lentelę.
 *
 * Paleidimas:
 *   npm run import:supplier
 *   # arba su custom failo keliu:
 *   npm run import:supplier -- tmp/mano-failas.csv
 *
 * Ką daro:
 *  1. Perskaito CSV failą (default: tmp/Copy of RN_2024.xlsx - Sheet1.csv)
 *  2. Kiekvienai eilutei nustato kategoriją (dazai / oksidantai / sampunai / priemones)
 *  3. Color SHOCK dažus sugretina su `hairDyeColors` iš mock-products.ts —
 *     paima LT/EN/RU pavadinimus, HEX, slug, dye group
 *  4. Pritaiko kainodaros taisykles:
 *       - Pro Hair Color 180ml:    retail €7.90,  b2b €4.99
 *       - MEN 180ml:               retail €12.99, b2b €7.99
 *       - Oksidantai / priežiūra:  retail = cost×3.0, b2b = cost×2.0
 *  5. Upsert pagal `ean` (unikalus raktas) — saugu leisti kelis kartus
 *  6. Visi produktai po importo `is_active = false` — nematomi svetainėje
 *     kol admin neįjungia
 *
 * Reikalavimai:
 *  - .env.local su NEXT_PUBLIC_SUPABASE_URL ir SUPABASE_SERVICE_ROLE_KEY
 *  - Migracija 005_ean_and_cost.sql pritaikyta
 *
 * Naudoja SERVICE_ROLE_KEY — apeina RLS.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { hairDyeColors, type DyeColor } from '../src/lib/data/mock-products'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_KEY ||
  SUPABASE_URL.includes('your-supabase')
) {
  console.error(
    '❌ Trūksta NEXT_PUBLIC_SUPABASE_URL arba SUPABASE_SERVICE_ROLE_KEY .env.local faile'
  )
  process.exit(1)
}

const DEFAULT_CSV_PATH = 'tmp/Copy of RN_2024.xlsx - Sheet1.csv'

// ============================================
// Tipai
// ============================================

type CategorySlug = 'dazai' | 'oksidantai' | 'sampunai' | 'priemones'

type RawRow = {
  lineNum: number
  ean: string
  name: string
  costPriceCents: number | null
}

type ProductPayload = {
  ean: string
  slug: string
  sku: string | null
  category_slug: CategorySlug
  name_lt: string
  name_en: string
  name_ru: string
  price_cents: number
  b2b_price_cents: number
  cost_price_cents: number
  volume_ml: number | null
  weight_g: number | null
  color_number: string | null
  color_name: string | null
  color_hex: string | null
  color_tone: string | null
  color_family: string | null
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
}

// ============================================
// CSV parseris (paprastas — failas yra predictable formato)
// ============================================

function parseCsv(content: string): RawRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const rows: RawRow[] = []

  // Skip header row (lineNum: 1)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const cols = line.split(',')
    const ean = (cols[0] ?? '').trim()
    const name = (cols[1] ?? '').trim()
    const priceRaw = (cols[2] ?? '').trim()

    // Eilutės be EAN — praleisk (tai aprašymai / pastabos)
    if (!ean) continue

    rows.push({
      lineNum: i + 1,
      ean,
      name,
      costPriceCents: parsePriceToCents(priceRaw),
    })
  }

  return rows
}

function parsePriceToCents(raw: string): number | null {
  // "€  8.80" / " €  1.85 " / "€ 12.99" → 880 / 185 / 1299
  const cleaned = raw
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .replace(',', '.')
    .trim()
  if (!cleaned) return null
  const num = parseFloat(cleaned)
  if (!isFinite(num) || num < 0) return null
  return Math.round(num * 100)
}

// ============================================
// Kategorijos aptikimas pagal pavadinimą
// ============================================

function detectCategory(name: string): CategorySlug {
  const u = name.toUpperCase()
  // Dažai (tik Pro Hair Color serija)
  if (/PRO HAIR COLOR/.test(u)) return 'dazai'
  // Oksidantai (Oxy N VOL)
  if (/\bOXY\s*\d+\s*VOL/.test(u)) return 'oksidantai'
  // Pagalbinės priemonės: balinimas, pigmentai, fiksatoriai, paletės
  if (/BLEACH|PIGMENT|KERAFIX|KERAPERM|PALETA KOLOROW|HIGHLIGHTING/.test(u)) {
    return 'priemones'
  }
  // Visa kita — šampūnai ir priežiūros priemonės
  return 'sampunai'
}

// ============================================
// Dažo kodo ištraukimas ir sugretinimas su mock data
// ============================================

/**
 * Iš pavadinimo "RosaNera COLOR SHOCK Pro Hair Color 7.444 180ml" ištraukia
 * "7.444". Toneriams — "SG", "LG" ir t.t. MEN dažams — "4 MEN".
 */
function extractDyeCode(name: string): string | null {
  // Tvarka svarbi: pirma bandom MEN, tada trumpą kodą, tada skaičių
  const menMatch = name.match(/Pro Hair Color\s+(\d+\s+MEN)\s+180ml/i)
  if (menMatch) return menMatch[1].trim()

  const shortMatch = name.match(/Pro Hair Color\s+([A-Z]{2,3})\s+180ml/i)
  if (shortMatch) return shortMatch[1].trim().toUpperCase()

  const numMatch = name.match(/Pro Hair Color\s+([\d.]+)\s+180ml/i)
  if (numMatch) return numMatch[1].trim()

  return null
}

const TONER_SHORT_TO_KEY: Record<string, string> = {
  SG: 'silver-grey',
  LG: 'light-grey',
  DG: 'dark-grey',
  SP: 'silver-pearl',
  SB: 'silver-beige',
  LIL: 'lilac',
}

function findDyeMatch(code: string): DyeColor | null {
  // 1. Mėginam pagal num (skaitinis kodas ar "4 MEN")
  const byNum = hairDyeColors.find((c) => c.num === code)
  if (byNum) return byNum

  // 2. Toneriams — per short-code mapą
  const tonerKey = TONER_SHORT_TO_KEY[code.toUpperCase()]
  if (tonerKey) {
    return hairDyeColors.find((c) => c.key === tonerKey) ?? null
  }

  return null
}

// ============================================
// Kainodaros taisyklės
// ============================================

type PriceResult = { priceCents: number; b2bPriceCents: number }

function calculatePrices(
  category: CategorySlug,
  name: string,
  costCents: number
): PriceResult {
  const isMen = /\bMEN\b/.test(name)

  // Color SHOCK dažai — flat retail
  if (category === 'dazai') {
    if (isMen) {
      return { priceCents: 1299, b2bPriceCents: 799 } // €12.99 / €7.99
    }
    return { priceCents: 790, b2bPriceCents: 499 } // €7.90 / €4.99
  }

  // Kiti produktai — formulė (×3.0 retail, ×2.0 b2b)
  return {
    priceCents: Math.round(costCents * 3),
    b2bPriceCents: Math.round(costCents * 2),
  }
}

// ============================================
// Volume/weight ištraukimas
// ============================================

function extractSize(
  name: string
): { volumeMl: number | null; weightG: number | null } {
  // Paskutinis (\d+)ml — patogiai apdoroja "10x10ml" atvejį (paima 10ml)
  const mlMatch = name.match(/(\d+)\s*ml\b/i)
  const gMatch = name.match(/(\d+)\s*gr?\b/i)
  return {
    volumeMl: mlMatch ? parseInt(mlMatch[1], 10) : null,
    weightG: gMatch ? parseInt(gMatch[1], 10) : null,
  }
}

// ============================================
// Slug generavimas ne-dažų produktams
// ============================================

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/rosanera\s+/gi, '')
    .replace(/\*new|\*top seller/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

function cleanProductName(name: string): string {
  return name.replace(/\s*\*(NEW|TOP SELLER)\b/gi, '').trim()
}

// ============================================
// Vienos eilutės transformavimas į ProductPayload
// ============================================

function buildPayload(row: RawRow): {
  payload: ProductPayload | null
  reason?: string
  matchedDye?: DyeColor
} {
  if (row.costPriceCents === null) {
    return { payload: null, reason: 'Nepavyko parsinti kainos' }
  }

  const category = detectCategory(row.name)
  const { priceCents, b2bPriceCents } = calculatePrices(
    category,
    row.name,
    row.costPriceCents
  )

  // Dažams — gretiname su mock data
  if (category === 'dazai') {
    const code = extractDyeCode(row.name)
    if (!code) {
      return {
        payload: null,
        reason: `Nepavyko ištraukti dažo kodo iš: ${row.name}`,
      }
    }
    const dye = findDyeMatch(code)
    if (!dye) {
      return {
        payload: null,
        reason: `Dažo kodas "${code}" nerastas hairDyeColors sąraše`,
      }
    }

    const sku = `CS-${dye.key.replace(/\./g, '-').toUpperCase()}`

    return {
      matchedDye: dye,
      payload: {
        ean: row.ean,
        slug: dye.slug,
        sku,
        category_slug: 'dazai',
        name_lt: dye.num ? `${dye.num} Color SHOCK — ${dye.name_lt}` : `Color SHOCK ${dye.name_en} — ${dye.name_lt}`,
        name_en: dye.num ? `${dye.num} Color SHOCK — ${dye.name_en}` : `Color SHOCK ${dye.name_en} — ${dye.name_en}`,
        name_ru: dye.num ? `${dye.num} Color SHOCK — ${dye.name_ru}` : `Color SHOCK ${dye.name_en} — ${dye.name_ru}`,
        price_cents: priceCents,
        b2b_price_cents: b2bPriceCents,
        cost_price_cents: row.costPriceCents,
        volume_ml: 180,
        weight_g: null,
        color_number: dye.num,
        color_name: dye.name_lt,
        color_hex: dye.hex,
        color_tone: dye.tone,
        color_family: dye.family,
        stock_quantity: 0,
        is_active: false,
        is_featured: false,
      },
    }
  }

  // Ne-dažų produktai — pavadinimą paliekam iš CSV EN, LT/RU = EN (koreguosit vėliau)
  const cleanName = cleanProductName(row.name)
  const { volumeMl, weightG } = extractSize(row.name)

  return {
    payload: {
      ean: row.ean,
      slug: makeSlug(row.name),
      sku: null,
      category_slug: category,
      name_lt: cleanName,
      name_en: cleanName,
      name_ru: cleanName,
      price_cents: priceCents,
      b2b_price_cents: b2bPriceCents,
      cost_price_cents: row.costPriceCents,
      volume_ml: volumeMl,
      weight_g: weightG,
      color_number: null,
      color_name: null,
      color_hex: null,
      color_tone: null,
      color_family: null,
      stock_quantity: 0,
      is_active: false,
      is_featured: false,
    },
  }
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const csvPath = args.find((a) => !a.startsWith('--')) ?? DEFAULT_CSV_PATH
  const absPath = resolve(process.cwd(), csvPath)

  if (dryRun) {
    console.log('🏃 DRY RUN — į DB nieko nerašysim\n')
  }

  console.log(`📂 Skaitau CSV: ${csvPath}`)
  let content: string
  try {
    content = readFileSync(absPath, 'utf-8')
  } catch (err) {
    console.error(`❌ Nepavyko perskaityti failo: ${absPath}`)
    console.error(err)
    process.exit(1)
  }

  const rows = parseCsv(content)
  console.log(`✓ Rasta ${rows.length} eilučių su EAN\n`)

  // ============================================
  // Supabase client (service role — apeina RLS)
  // ============================================
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ============================================
  // Kategorijų ID'ai iš DB
  // ============================================
  console.log('🔍 Gaunu kategorijų ID iš DB...')
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, slug')
    .in('slug', ['dazai', 'oksidantai', 'sampunai', 'priemones'])

  if (catErr || !categories) {
    console.error('❌ Kategorijų fetch klaida:', catErr?.message)
    process.exit(1)
  }

  const categoryIdBySlug = new Map<string, string>()
  for (const c of categories) categoryIdBySlug.set(c.slug, c.id)

  for (const slug of ['dazai', 'oksidantai', 'sampunai', 'priemones']) {
    if (!categoryIdBySlug.has(slug)) {
      console.error(`❌ Kategorija "${slug}" nerasta DB'je. Patikrink seed duomenis.`)
      process.exit(1)
    }
  }
  console.log(`✓ Visos 4 kategorijos rastos\n`)

  // ============================================
  // Transformuojam eilutes į payload'us
  // ============================================
  console.log('🔧 Transformuoju duomenis...')
  const stats = {
    total: rows.length,
    byCategory: { dazai: 0, oksidantai: 0, sampunai: 0, priemones: 0 },
    dyeMatched: 0,
    skipped: [] as { line: number; ean: string; reason: string }[],
    toUpsert: [] as ProductPayload[],
  }

  for (const row of rows) {
    const result = buildPayload(row)
    if (!result.payload) {
      stats.skipped.push({
        line: row.lineNum,
        ean: row.ean,
        reason: result.reason ?? 'unknown',
      })
      continue
    }
    stats.byCategory[result.payload.category_slug]++
    if (result.matchedDye) stats.dyeMatched++
    stats.toUpsert.push(result.payload)
  }

  console.log(`✓ Pasiskirstymas:`)
  console.log(`   dazai:      ${stats.byCategory.dazai} (sugretinta su mock data: ${stats.dyeMatched})`)
  console.log(`   oksidantai: ${stats.byCategory.oksidantai}`)
  console.log(`   sampunai:   ${stats.byCategory.sampunai}`)
  console.log(`   priemones:  ${stats.byCategory.priemones}`)
  console.log(`   praleista:  ${stats.skipped.length}`)
  if (stats.skipped.length > 0) {
    console.log('\n⚠ Praleistos eilutės:')
    for (const s of stats.skipped) {
      console.log(`   eilutė ${s.line} (EAN ${s.ean}): ${s.reason}`)
    }
  }
  console.log('')

  // ============================================
  // Dry run — tik parodom pirmas 5 eilutes ir sustojam
  // ============================================
  if (dryRun) {
    console.log('\n📋 Pirmi 5 payload\'ai (preview):')
    for (const p of stats.toUpsert.slice(0, 5)) {
      console.log(
        `   [${p.category_slug}] ${p.ean} | ${p.name_lt} | €${(p.price_cents / 100).toFixed(2)} retail / €${(p.b2b_price_cents / 100).toFixed(2)} b2b / €${(p.cost_price_cents / 100).toFixed(2)} cost`
      )
    }
    console.log(`\n✓ Dry run baigtas. Iš viso paruošta ${stats.toUpsert.length} produktų.`)
    return
  }

  // ============================================
  // Upsert į DB pagal EAN
  // ============================================
  console.log(`💾 Upserting ${stats.toUpsert.length} produktų į DB...`)

  let created = 0
  let updated = 0
  let failed = 0
  const errors: string[] = []

  for (const p of stats.toUpsert) {
    // Tikrinam ar produktas su šiuo EAN jau yra
    const { data: byEan, error: eanErr } = await supabase
      .from('products')
      .select('id')
      .eq('ean', p.ean)
      .maybeSingle()

    if (eanErr) {
      failed++
      errors.push(`EAN ${p.ean}: fetch error — ${eanErr.message}`)
      continue
    }

    // Fallback — jei EAN nerastas, tikrinam pagal slug (pvz. pirmasis
    // importas, kai dažai jau yra seed'inti iš mock-products bet be EAN)
    let existing = byEan
    if (!existing) {
      const { data: bySlug, error: slugErr } = await supabase
        .from('products')
        .select('id')
        .eq('slug', p.slug)
        .maybeSingle()
      if (slugErr) {
        failed++
        errors.push(`EAN ${p.ean}: slug fetch error — ${slugErr.message}`)
        continue
      }
      existing = bySlug
    }

    const payload = {
      ean: p.ean,
      slug: p.slug,
      sku: p.sku,
      category_id: categoryIdBySlug.get(p.category_slug)!,
      name_lt: p.name_lt,
      name_en: p.name_en,
      name_ru: p.name_ru,
      price_cents: p.price_cents,
      b2b_price_cents: p.b2b_price_cents,
      cost_price_cents: p.cost_price_cents,
      volume_ml: p.volume_ml,
      weight_g: p.weight_g,
      color_number: p.color_number,
      color_name: p.color_name,
      color_hex: p.color_hex,
      color_tone: p.color_tone,
      color_family: p.color_family,
      stock_quantity: p.stock_quantity,
      is_in_stock: p.stock_quantity > 0,
      is_active: p.is_active,
      is_featured: p.is_featured,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      // UPDATE — nekeičiam stock_quantity/is_active, kad neužtušuotų admin'o pakeitimų
      const { id: _id, stock_quantity: _s, is_active: _a, ...updatePayload } =
        { ...payload, id: existing.id }
      const { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', existing.id)
      if (error) {
        failed++
        errors.push(`EAN ${p.ean}: update — ${error.message}`)
      } else {
        updated++
      }
    } else {
      // INSERT
      const { error } = await supabase.from('products').insert(payload)
      if (error) {
        failed++
        errors.push(`EAN ${p.ean}: insert — ${error.message}`)
      } else {
        created++
      }
    }
  }

  // ============================================
  // Ataskaita
  // ============================================
  console.log('\n═══════════════════════════════════════')
  console.log('📊 IMPORTAS BAIGTAS')
  console.log('═══════════════════════════════════════')
  console.log(`   Sukurta:   ${created}`)
  console.log(`   Atnaujinta: ${updated}`)
  console.log(`   Nepavyko:  ${failed}`)
  console.log(`   Praleista: ${stats.skipped.length}`)
  console.log('═══════════════════════════════════════')

  if (errors.length > 0) {
    console.log('\n❌ Klaidos:')
    for (const e of errors.slice(0, 20)) console.log(`   ${e}`)
    if (errors.length > 20) console.log(`   ... ir dar ${errors.length - 20}`)
  }

  console.log(
    '\n👉 Visi importuoti produktai yra NEAKTYVŪS (is_active=false).\n' +
      '   Peržiūrėkite /admin/sandelis?inactive=1 ir įjunkite pasirengusius.'
  )

  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('❌ Neplanuota klaida:', err)
  process.exit(1)
})

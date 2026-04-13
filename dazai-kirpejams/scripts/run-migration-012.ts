/**
 * Paleidžia 012_banners.sql migraciją per Supabase service role.
 * npx tsx --env-file=.env.local scripts/run-migration-012.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Trūksta env kintamųjų')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const sql = readFileSync(
  resolve(__dirname, '../supabase/migrations/012_banners.sql'),
  'utf-8'
)

async function main() {
  console.log('Running 012_banners.sql migration...\n')

  // Split by semicolons, filter empty
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))

  for (const stmt of statements) {
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ')
    const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' }).single()
    if (error) {
      // Try direct approach - some Supabase projects don't have exec_sql
      console.log(`  ⚠ RPC not available, trying alternative...`)
      break
    }
    console.log(`  ✓ ${preview}...`)
  }

  // Alternative: use the REST API to check if table exists, then create via individual operations
  // First check if banners table already exists
  const { error: checkErr } = await supabase.from('banners').select('id').limit(1)

  if (checkErr?.message?.includes('does not exist') || checkErr?.code === '42P01') {
    console.log('\nBanners lentelė neegzistuoja. Reikia paleisti SQL rankiniu būdu.')
    console.log('Eikite į Supabase Dashboard → SQL Editor ir paleiskite:')
    console.log('supabase/migrations/012_banners.sql\n')
  } else if (checkErr) {
    console.log(`\n⚠ Klaida tikrinant: ${checkErr.message}`)
    console.log('Gali būti, kad lentelė jau egzistuoja bet RLS blokuoja.')
    console.log('Bandome įterpti default hero banerį...\n')

    // Try inserting default banner
    const { error: insertErr } = await supabase.from('banners').insert({
      placement: 'hero',
      title_lt: 'Profesionalūs plaukų dažai kirpėjams',
      title_en: 'Professional hair dyes for hairdressers',
      title_ru: 'Профессиональные краски для парикмахеров',
      subtitle_lt: 'Didesnė 180 ml talpa. Daugiau vertės darbui salone. Profesionali formulė, plati spalvų paletė ir ekonomiška kaina — viskas, ko reikia Jūsų salonui.',
      subtitle_en: 'Bigger 180 ml volume. More value for your salon work.',
      subtitle_ru: 'Увеличенный объём 180 мл. Больше пользы для работы в салоне.',
      badge_lt: 'Color SHOCK · Pasirinkimas iš 50+ spalvų',
      badge_en: 'Color SHOCK · Choose from 50+ colors',
      badge_ru: 'Color SHOCK · Выбор из 50+ цветов',
      cta_text_lt: 'Peržiūrėti produktus',
      cta_text_en: 'View products',
      cta_text_ru: 'Смотреть продукты',
      cta_url: '/produktai',
      cta_secondary_text_lt: 'Gauti pasiūlymą salonui',
      cta_secondary_text_en: 'Get a salon offer',
      cta_secondary_text_ru: 'Получить предложение для салона',
      cta_secondary_url: '/salonams',
      sort_order: 0,
      is_active: true,
    })

    if (insertErr) {
      console.log(`  ✗ Insert klaida: ${insertErr.message}`)
    } else {
      console.log('  ✓ Default hero baneris įterptas')
    }
  } else {
    console.log('✓ Banners lentelė jau egzistuoja.')

    // Check if we have any banners
    const { data, error: countErr } = await supabase.from('banners').select('id')
    if (!countErr && data && data.length === 0) {
      console.log('  Nėra banerių, įterpiame default hero...')
      const { error: insertErr } = await supabase.from('banners').insert({
        placement: 'hero',
        title_lt: 'Profesionalūs plaukų dažai kirpėjams',
        title_en: 'Professional hair dyes for hairdressers',
        title_ru: 'Профессиональные краски для парикмахеров',
        subtitle_lt: 'Didesnė 180 ml talpa. Daugiau vertės darbui salone. Profesionali formulė, plati spalvų paletė ir ekonomiška kaina — viskas, ko reikia Jūsų salonui.',
        subtitle_en: 'Bigger 180 ml volume. More value for your salon work.',
        subtitle_ru: 'Увеличенный объём 180 мл. Больше пользы для работы в салоне.',
        badge_lt: 'Color SHOCK · Pasirinkimas iš 50+ spalvų',
        badge_en: 'Color SHOCK · Choose from 50+ colors',
        badge_ru: 'Color SHOCK · Выбор из 50+ цветов',
        cta_text_lt: 'Peržiūrėti produktus',
        cta_text_en: 'View products',
        cta_text_ru: 'Смотреть продукты',
        cta_url: '/produktai',
        cta_secondary_text_lt: 'Gauti pasiūlymą salonui',
        cta_secondary_text_en: 'Get a salon offer',
        cta_secondary_text_ru: 'Получить предложение для салона',
        cta_secondary_url: '/salonams',
        sort_order: 0,
        is_active: true,
      })
      if (insertErr) {
        console.log(`  ✗ ${insertErr.message}`)
      } else {
        console.log('  ✓ Default hero baneris įterptas')
      }
    } else {
      console.log(`  Jau yra ${data?.length ?? 0} baneriai.`)
    }
  }
}

main()

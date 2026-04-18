/**
 * 017 migracija — Color SHOCK PDF pavadinimai + swatch nuotraukos.
 *
 * Paleisti: npx tsx scripts/run-migration-017.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { hairDyeColors } from '../src/lib/data/mock-products'

config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Trūksta NEXT_PUBLIC_SUPABASE_URL arba SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function main() {
  const targets = hairDyeColors.filter((c) => c.imagePath !== null)
  console.log(`Atnaujinama ${targets.length} Color SHOCK produktų (PDF swatch'ai)\n`)

  let ok = 0
  let fail = 0

  for (const c of targets) {
    const codeLabel = c.num ?? c.name_en
    const payload = {
      name_lt: `Color SHOCK ${codeLabel} — ${c.name_lt}`,
      name_en: `Color SHOCK ${codeLabel} — ${c.name_en}`,
      name_ru: `Color SHOCK ${codeLabel} — ${c.name_ru}`,
      color_name: c.name_lt,
      image_urls: c.imagePath ? [c.imagePath] : [],
    }

    const { error, count } = await supabase
      .from('products')
      .update(payload, { count: 'exact' })
      .eq('slug', c.slug)

    if (error) {
      console.error(`  ✗ ${c.slug}: ${error.message}`)
      fail++
    } else if (count === 0) {
      console.warn(`  ⚠ ${c.slug}: nerastas DB (0 paveiktų eilučių)`)
      fail++
    } else {
      console.log(`  ✓ ${c.slug}  →  ${payload.color_name}`)
      ok++
    }
  }

  console.log(`\nRezultatas: ${ok} OK, ${fail} klaidos.`)
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

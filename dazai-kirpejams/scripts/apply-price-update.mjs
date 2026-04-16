/**
 * Vienkartinis migracijos 016_update_price_7_90.sql paleidimas per REST API.
 * - products.price_cents: 799 -> 790 (visi, kur tiksliai 799 — MEN yra 1299)
 * - blog_posts.content_{lt,en,ru}: string replace 7,99 € ir perskaičiuotos sumos
 *
 * Paleidimas: node scripts/apply-price-update.mjs
 */
import { readFileSync } from 'node:fs'

const envText = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

// --- 1) products: 799 -> 790 ---
{
  const r = await fetch(`${URL}/rest/v1/products?price_cents=eq.799`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify({ price_cents: 790 }),
  })
  if (!r.ok) {
    console.error('products PATCH failed:', r.status, await r.text())
    process.exit(1)
  }
  const rows = await r.json()
  console.log(`products updated: ${rows.length} rows (799 -> 790)`)
}

// --- 2) blog_posts: string replace per row ---
const replacements = [
  ['7,99 €', '7,90 €'],
  ['55,93 €', '55,30 €'],
  ['215,73 €', '213,30 €'],
  ['2 556,80 €', '2 528,00 €'],
]

function applyReplace(s) {
  if (typeof s !== 'string') return s
  let out = s
  for (const [from, to] of replacements) {
    out = out.split(from).join(to)
  }
  return out
}

{
  const r = await fetch(
    `${URL}/rest/v1/blog_posts?select=id,slug,content_lt,content_en,content_ru`,
    { headers: HEADERS }
  )
  if (!r.ok) {
    console.error('blog_posts fetch failed:', r.status, await r.text())
    process.exit(1)
  }
  const all = await r.json()
  const posts = all.filter(
    (p) =>
      (p.content_lt && p.content_lt.includes('7,99 €')) ||
      (p.content_en && p.content_en.includes('7,99 €')) ||
      (p.content_ru && p.content_ru.includes('7,99 €'))
  )
  console.log(`blog_posts total: ${all.length}, to update: ${posts.length}`)

  for (const p of posts) {
    const patch = {
      content_lt: applyReplace(p.content_lt),
      content_en: applyReplace(p.content_en),
      content_ru: applyReplace(p.content_ru),
      updated_at: new Date().toISOString(),
    }
    const u = await fetch(`${URL}/rest/v1/blog_posts?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: { ...HEADERS, Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    })
    if (!u.ok) {
      console.error(`  [FAIL] ${p.slug}:`, u.status, await u.text())
      continue
    }
    console.log(`  [OK]   ${p.slug}`)
  }
}

console.log('\nDone.')

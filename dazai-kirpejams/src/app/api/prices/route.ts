import { NextResponse } from 'next/server'
import { isUserVerified } from '@/lib/auth/verification'
import { getProductPricesBySlugs } from '@/lib/data/queries'

// Per-request render (skaito sesiją per cookies). Niekada nekešuojamas.
export const dynamic = 'force-dynamic'

const MAX_SLUGS = 250

/**
 * Autentifikuotas kainų maršrutas. Kaina grąžinama TIK admin'o patvirtintiems
 * profesionalams — tas pats verslo modelis kaip server-side vartuose. Anonimui
 * ar nepatvirtintam vartotojui grąžinamas tuščias objektas (jokios kainos).
 *
 * Tai leidžia produktų/kategorijų puslapius generuoti statiškai (be kainos
 * HTML'e), o kainą klientas pasiima čia — kaina niekada nepatenka į viešą,
 * kešuojamą payload'ą.
 */
export async function POST(request: Request) {
  let slugs: unknown
  try {
    const body = await request.json()
    slugs = body?.slugs
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  if (!Array.isArray(slugs) || slugs.some((s) => typeof s !== 'string')) {
    return NextResponse.json({ error: 'invalid-slugs' }, { status: 400 })
  }

  const cleaned = Array.from(
    new Set((slugs as string[]).map((s) => s.trim()).filter(Boolean))
  ).slice(0, MAX_SLUGS)

  // VARTAI: kaina tik patvirtintiems. Nepatvirtintam — tuščia.
  const verified = await isUserVerified().catch(() => false)
  if (!verified || cleaned.length === 0) {
    return NextResponse.json(
      { prices: {} },
      { headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  const prices = await getProductPricesBySlugs(cleaned)
  return NextResponse.json(
    { prices },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}

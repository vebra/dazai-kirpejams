import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Email atidarymo beacon — 1×1 caching-free PNG. Embed'inamas kampanijų
 * laiškuose kaip <img src="…/api/track/open/{recipient_id}">.
 *
 * Veikia kaip „best-effort" tracker'is:
 * - Pažymim opened_at (jei dar nepažymėta) + inkrement'inam opened_count.
 * - Apribojimai: Gmail/Outlook proxy paveikslus iškart gavus laišką
 *   (vartotojas dar neatidaręs), tad reikšmė reiškia „pristatyta į inbox",
 *   ne tikras atidarymas. Apple Mail / kai kurie kiti rodo tikrus opens.
 *
 * Saugumas: id yra UUID (sunku atspėti), bet šio endpoint'o nenaudojam
 * jokiems jautriems veiksmams — tik counter inkrement'as. Net jei kažkas
 * sufaksintų load'us, sugadintų statistiką, ne duomenis.
 */

// 1×1 transparent PNG (43 bytes) — generuotas iš `pngcrush` minimum
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
)

function pixelResponse(): NextResponse {
  return new NextResponse(new Uint8Array(TRANSPARENT_PIXEL), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': TRANSPARENT_PIXEL.length.toString(),
      // Bus parodyta net jei DB klaida — nesusandelio per ilgai, nes
      // norim, kad pakartotiniai opens irgi būtų suskaičiuoti.
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache',
    },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // UUID validation — neribotai išėjus ant blogo input'o nesieksim DB
  if (!/^[0-9a-f-]{32,36}$/i.test(id)) {
    return pixelResponse()
  }

  try {
    const supabase = createServerClient()

    // Try to fetch existing row to know if opened_at is already set
    const { data: row } = await supabase
      .from('marketing_campaign_recipients')
      .select('id, opened_at, opened_count')
      .eq('id', id)
      .maybeSingle()

    if (row) {
      await supabase
        .from('marketing_campaign_recipients')
        .update({
          opened_at: row.opened_at ?? new Date().toISOString(),
          opened_count: (row.opened_count ?? 0) + 1,
        })
        .eq('id', id)
    }
  } catch (err) {
    // Tylim — bet kuriuo atveju grąžinam pixel'į, kad email rendering'as
    // nepasirodytų sulaužytas vartotojui.
    console.error('[api/track/open] DB update failed:', err)
  }

  return pixelResponse()
}

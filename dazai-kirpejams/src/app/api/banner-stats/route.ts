import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'

/**
 * Banerių statistikos beacon — best-effort parodymų/paspaudimų skaitiklis
 * (analogiškas /api/track/open kampanijų pixel'iui).
 *
 * Body: { key: string, type: 'impression' | 'click' }
 *   key — banners.id (uuid) arba 'event:<slug>' automatiniam renginio baneriui.
 *
 * Saugumas: endpoint'as nieko jautraus nedaro — tik skaitiklio eilutė.
 * Sufalsinti load'ai sugadintų statistiką, ne duomenis.
 */

const KEY_RE = /^([0-9a-f-]{32,36}|event:[a-z0-9-]{1,80})$/i

export async function POST(req: NextRequest) {
  if (!isSupabaseServerConfigured) {
    return new NextResponse(null, { status: 204 })
  }

  let key = ''
  let type = ''
  try {
    // sendBeacon siunčia text/plain — parsiname kūną patys, ne per req.json()
    const body = JSON.parse(await req.text()) as { key?: string; type?: string }
    key = String(body.key ?? '')
    type = String(body.type ?? '')
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  if (!KEY_RE.test(key) || (type !== 'impression' && type !== 'click')) {
    return new NextResponse(null, { status: 204 })
  }

  try {
    const supabase = createServerClient()
    await supabase
      .from('banner_events')
      .insert({ banner_key: key.toLowerCase(), event_type: type })
  } catch (err) {
    console.error('[api/banner-stats] insert failed:', err)
  }

  return new NextResponse(null, { status: 204 })
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Marketingo laiškų atsisakymas — nuoroda kampanijos laiško footer'yje ir
 * List-Unsubscribe header'yje.
 *
 * GET  — žmogus paspaudžia nuorodą laiške → nustatom opt-out ir parodom
 *        paprastą patvirtinimo puslapį (be prisijungimo).
 * POST — RFC 8058 „List-Unsubscribe=One-Click": Gmail/Yahoo mygtukas
 *        „Unsubscribe" siunčia POST į tą patį URL → 200 be turinio.
 *
 * Saugumas: HMAC žetonas suriša userId su galiojimu (365 d.) — atsisakyti
 * galima tik už save. Idempotentiška: pakartotinis kvietimas nieko negadina.
 * Transakciniai laiškai (užsakymai, verifikacija) šio flag'o nepaiso.
 */

async function applyOptOut(request: Request): Promise<'ok' | 'invalid' | 'db-error'> {
  const url = new URL(request.url)
  const userId = url.searchParams.get('u') ?? ''
  const token = url.searchParams.get('t') ?? ''

  // UUID formato patikra prieš DB kvietimą (žetonas vis tiek lemiamas)
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(userId) || !token) return 'invalid'
  if (!verifyUnsubscribeToken(token, userId)) return 'invalid'

  const supabase = createServerClient()
  const { error } = await supabase
    .from('user_profiles')
    .update({ marketing_opt_out: true, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[marketing/atsisakyti] update failed:', error.message)
    return 'db-error'
  }
  return 'ok'
}

function htmlPage(title: string, message: string, status: number): NextResponse {
  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} — Dažai Kirpėjams</title>
</head>
<body style="margin:0;padding:48px 16px;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A1A;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 32px;text-align:center;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#E91E8C;margin-bottom:16px;">Dažai Kirpėjams</div>
    <h1 style="margin:0 0 12px;font-size:22px;">${title}</h1>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#6B6B6B;">${message}</p>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }) as NextResponse
}

export async function GET(request: Request) {
  const result = await applyOptOut(request)
  if (result === 'ok') {
    return htmlPage(
      'Prenumerata atšaukta',
      'Daugiau pasiūlymų el. paštu nebesiųsime. Užsakymų patvirtinimai ir kiti su Jūsų pirkimais susiję laiškai pasieks Jus kaip įprasta.',
      200
    )
  }
  if (result === 'db-error') {
    return htmlPage(
      'Įvyko klaida',
      'Nepavyko išsaugoti pakeitimo. Pabandykite dar kartą arba tiesiog atsakykite į gautą laišką — atsisakysime rankiniu būdu.',
      500
    )
  }
  return htmlPage(
    'Nuoroda nebegalioja',
    'Atsisakymo nuoroda neteisinga arba pasibaigė jos galiojimas. Atsakykite į gautą laišką — atsisakysime rankiniu būdu.',
    400
  )
}

// RFC 8058 One-Click unsubscribe (Gmail/Yahoo „Unsubscribe" mygtukas)
export async function POST(request: Request) {
  const result = await applyOptOut(request)
  return NextResponse.json(
    { ok: result === 'ok' },
    { status: result === 'ok' ? 200 : result === 'db-error' ? 500 : 400 }
  )
}

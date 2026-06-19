import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

config({ path: resolve(process.cwd(), '.env.local') })

/**
 * Vienkartinis skriptas: išsiunčia priminimą patvirtinti el. paštą
 * vartotojams, kurie užsiregistravo, buvo admin patvirtinti, bet niekada
 * nepaspaudė patvirtinimo nuorodos (email_confirmed_at = null).
 *
 * Kiekvienam vartotojui per service-role sugeneruojama magic-link nuoroda
 * (paspaudus — patvirtina el. paštą IR prijungia prie paskyros), nuoroda
 * įdedama į firminio stiliaus laišką ir siunčiama per Resend.
 *
 * DRY_RUN=1 — tik parodo ką darytų, nieko nesiunčia.
 *
 * Paleisti:
 *   DRY_RUN=1 npx tsx scripts/send-email-confirm-reminder.ts   (peržiūra)
 *   npx tsx scripts/send-email-confirm-reminder.ts             (siunčia)
 */

// Adresatai (iš /admin/verifikacija — „El. paštas nepatvirtintas")
const TARGET_EMAILS = ['jurgaminte@gmail.com', 'odeta820103@gmail.com']

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
  'https://www.dazaikirpejams.lt'
)
const DRY_RUN = process.env.DRY_RUN === '1'

const BRAND_MAGENTA = '#E91E8C'
const GRAY_900 = '#1A1A1A'
const GRAY_500 = '#6B6B6B'
const GRAY_50 = '#F5F5F7'
const BORDER = '#eeeeee'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

type Lang = 'lt' | 'en' | 'ru'

const COPY: Record<Lang, {
  subject: string
  preheader: string
  badge: string
  title: (name: string) => string
  intro: string
  ctaLabel: string
  validity: string
  ignoreTitle: string
  ignoreDesc: string
  closing: string
  signoff: string
  footerSite: string
}> = {
  lt: {
    subject: 'Patvirtinkite savo el. paštą — Dažai Kirpėjams',
    preheader:
      'Jūsų paskyra jau patvirtinta. Liko vienas žingsnis — patvirtinti el. pašto adresą.',
    badge: 'Priminimas',
    title: (name) => (name ? `Sveiki, ${name}` : 'Patvirtinkite el. paštą'),
    intro:
      'Jūsų profesionalo paskyra jau patvirtinta ir kainos matomos. Tačiau jūsų el. pašto adresas dar nepatvirtintas — paspauskite mygtuką žemiau, kad jį patvirtintumėte ir iškart prisijungtumėte.',
    ctaLabel: 'Patvirtinti el. paštą',
    validity: 'Nuoroda galioja ribotą laiką. Jei nebeveiks — parašykite mums ir atsiųsime naują.',
    ignoreTitle: 'Kodėl tai svarbu?',
    ignoreDesc:
      'Patvirtintas el. paštas užtikrina, kad gausite užsakymų patvirtinimus, sąskaitas ir svarbius pranešimus.',
    closing:
      'Klausimai — atsakykite į šį laišką arba rašykite info@dziuljetavebre.lt.',
    signoff: 'Pagarbiai,\nDažai Kirpėjams komanda',
    footerSite: 'www.dazaikirpejams.lt',
  },
  en: {
    subject: 'Please confirm your email — Dažai Kirpėjams',
    preheader:
      'Your account is already approved. One step left — confirm your email address.',
    badge: 'Reminder',
    title: (name) => (name ? `Hello, ${name}` : 'Confirm your email'),
    intro:
      'Your professional account is already approved and prices are visible. However, your email address is not yet confirmed — click the button below to confirm it and sign in right away.',
    ctaLabel: 'Confirm email',
    validity: 'The link is valid for a limited time. If it no longer works — write to us and we will send a new one.',
    ignoreTitle: 'Why does this matter?',
    ignoreDesc:
      'A confirmed email ensures you receive order confirmations, invoices and important notifications.',
    closing:
      'Questions — reply to this email or write to info@dziuljetavebre.lt.',
    signoff: 'Kind regards,\nThe Dažai Kirpėjams team',
    footerSite: 'www.dazaikirpejams.lt',
  },
  ru: {
    subject: 'Подтвердите вашу эл. почту — Dažai Kirpėjams',
    preheader:
      'Ваш аккаунт уже подтверждён. Остался один шаг — подтвердить адрес эл. почты.',
    badge: 'Напоминание',
    title: (name) => (name ? `Здравствуйте, ${name}` : 'Подтвердите эл. почту'),
    intro:
      'Ваш профессиональный аккаунт уже подтверждён, и цены видны. Однако адрес эл. почты ещё не подтверждён — нажмите кнопку ниже, чтобы подтвердить его и сразу войти.',
    ctaLabel: 'Подтвердить эл. почту',
    validity: 'Ссылка действительна ограниченное время. Если она не работает — напишите нам, и мы отправим новую.',
    ignoreTitle: 'Почему это важно?',
    ignoreDesc:
      'Подтверждённая эл. почта гарантирует получение подтверждений заказов, счетов и важных уведомлений.',
    closing:
      'Вопросы — ответьте на это письмо или напишите на info@dziuljetavebre.lt.',
    signoff: 'С уважением,\nКоманда Dažai Kirpėjams',
    footerSite: 'www.dazaikirpejams.lt',
  },
}

function buildEmail(firstName: string, lang: Lang, confirmUrl: string) {
  const c = COPY[lang] ?? COPY.lt
  const safeName = escapeHtml(firstName || '')

  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(c.preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 0;">
          <div style="display:inline-block;padding:6px 12px;background:${BRAND_MAGENTA};color:#ffffff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-radius:999px;">
            ${escapeHtml(c.badge)}
          </div>
          <h1 style="margin:20px 0 0;font-size:26px;font-weight:700;color:${GRAY_900};line-height:1.25;">
            ${escapeHtml(c.title(safeName))}
          </h1>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px 0;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:${GRAY_500};">${escapeHtml(c.intro)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 0;">
          <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:10px;">
            ${escapeHtml(c.ctaLabel)} →
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:${GRAY_500};">${escapeHtml(c.validity)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 0;">
          <div style="background:${GRAY_50};border-radius:12px;padding:18px 22px;">
            <div style="font-size:13px;font-weight:700;color:${GRAY_900};margin-bottom:6px;">${escapeHtml(c.ignoreTitle)}</div>
            <p style="margin:0;font-size:13px;line-height:1.65;color:${GRAY_500};">${escapeHtml(c.ignoreDesc)}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0;font-size:13px;line-height:1.65;color:${GRAY_500};">${escapeHtml(c.closing)}</p>
          <p style="margin:18px 0 0;font-size:13px;line-height:1.65;color:${GRAY_900};white-space:pre-line;">${escapeHtml(c.signoff)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;">
          <div style="border-top:1px solid ${BORDER};padding-top:16px;font-size:11px;color:${GRAY_500};text-align:center;">${escapeHtml(c.footerSite)}</div>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`

  const text = `${c.title(firstName || '')}

${c.intro}

${c.ctaLabel}: ${confirmUrl}
${c.validity}

${c.ignoreTitle}
${c.ignoreDesc}

${c.closing}

${c.signoff}

${c.footerSite}`

  return { subject: c.subject, html, text }
}

function resolveLang(raw: string | null | undefined): Lang {
  return raw === 'en' || raw === 'ru' ? raw : 'lt'
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const resendKey = process.env.RESEND_API_KEY!
  const from = process.env.RESEND_FROM!

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const resend = new Resend(resendKey)

  console.log(DRY_RUN ? '=== DRY RUN (nieko nesiunčiama) ===' : '=== SIUNČIAMA ===')

  // Surandam auth vartotojus pagal el. paštą (listUsers, paginuojam)
  const wanted = new Set(TARGET_EMAILS.map((e) => e.toLowerCase()))
  const found = new Map<string, { id: string; email: string; confirmed: boolean }>()
  for (let page = 1; page <= 50 && found.size < wanted.size; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    for (const u of data.users) {
      const em = (u.email ?? '').toLowerCase()
      if (wanted.has(em)) {
        found.set(em, {
          id: u.id,
          email: u.email ?? em,
          confirmed: Boolean(u.email_confirmed_at ?? (u as { confirmed_at?: string }).confirmed_at),
        })
      }
    }
    if (data.users.length < 1000) break
  }

  for (const email of TARGET_EMAILS) {
    const key = email.toLowerCase()
    const user = found.get(key)
    if (!user) {
      console.log(`\n[SKIP] ${email} — auth vartotojas nerastas`)
      continue
    }

    // Profilis: vardas + kalba
    const { data: profile } = await admin
      .from('user_profiles')
      .select('first_name, lang')
      .eq('id', user.id)
      .maybeSingle<{ first_name: string | null; lang: string | null }>()

    const firstName = profile?.first_name ?? ''
    const lang = resolveLang(profile?.lang)

    console.log(
      `\n[${email}] vardas="${firstName}" kalba=${lang} el.paštas patvirtintas=${user.confirmed}`
    )

    if (user.confirmed) {
      console.log('  → jau patvirtintas, praleidžiam.')
      continue
    }

    // Magic link — paspaudus patvirtina el. paštą ir prijungia prie paskyros
    const redirectTo = `${SITE_URL}/auth/callback?lang=${lang}`
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: { redirectTo },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      console.error('  ✗ generateLink klaida:', linkErr?.message ?? 'nėra action_link')
      continue
    }
    const confirmUrl = linkData.properties.action_link
    const mail = buildEmail(firstName, lang, confirmUrl)

    if (DRY_RUN) {
      console.log('  → [DRY] siųstų:', mail.subject)
      console.log('  → nuoroda:', confirmUrl.slice(0, 80) + '...')
      continue
    }

    const { data: sent, error: sendErr } = await resend.emails.send({
      from,
      to: [user.email],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
    if (sendErr) {
      console.error('  ✗ Resend klaida:', sendErr)
      continue
    }
    console.log('  ✓ išsiųsta, id:', sent?.id)
  }

  console.log('\nBaigta.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

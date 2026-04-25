import 'server-only'
import type { EventInfo } from './config'
import { formatEventDateLt } from './config'

/**
 * Email šablonai renginio registracijoms.
 *
 * Laikomės tų pačių principų kaip src/lib/email/templates.ts:
 *  - inline CSS (Gmail/Outlook)
 *  - tik table layout'ai
 *  - brand magenta #E91E8C, gray #1A1A1A / #6B6B6B
 *  - max 600px plotis
 *  - preheader po <body>
 *  - visada grąžinam `{ subject, html, text }`
 */

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

type RegistrationInput = {
  event: EventInfo
  firstName: string
  lastName: string
  email: string
  phone: string
  salonName: string | null
  role: string | null
  guestsCount: number
  eventUrl: string
}

// ============================================
// Dalyvio patvirtinimas (su .ics attachment)
// ============================================

export function buildEventRegistrationCustomerEmail(input: RegistrationInput): {
  subject: string
  html: string
  text: string
} {
  const { event, firstName, eventUrl } = input
  const dateStr = formatEventDateLt(event)
  const venueLine = `${event.venueName}, ${event.venueStreet}, ${event.venueCity}`

  const subject = `Registracija patvirtinta — ${event.title}`

  const totalPeople = 1 + input.guestsCount
  const guestsLine =
    input.guestsCount > 0
      ? `<tr><td style="padding:8px 0;color:${GRAY_500};font-size:13px;">Dalyvių skaičius</td><td style="padding:8px 0;color:${GRAY_900};font-size:13px;font-weight:600;text-align:right;">${totalPeople}</td></tr>`
      : ''

  const html = `<!doctype html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${GRAY_50};">Registracija į ${escapeHtml(event.title)} — ${escapeHtml(dateStr)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
      <tr><td style="padding:32px 32px 16px 32px;">
        <div style="display:inline-block;padding:6px 12px;background:${BRAND_MAGENTA};color:#ffffff;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Registracija patvirtinta</div>
        <h1 style="margin:16px 0 8px 0;color:${GRAY_900};font-size:24px;line-height:1.3;">Laukiame Jūsų, ${escapeHtml(firstName)}!</h1>
        <p style="margin:0;color:${GRAY_500};font-size:15px;line-height:1.6;">Jūsų vieta į <strong style="color:${GRAY_900};">${escapeHtml(event.title)}</strong> rezervuota. Žemiau — pagrindinė renginio informacija.</p>
      </td></tr>

      <tr><td style="padding:0 32px;">
        <div style="background:${GRAY_50};border-radius:12px;padding:20px;margin:12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
            <tr><td style="padding:8px 0;color:${GRAY_500};">Data ir laikas</td><td style="padding:8px 0;color:${GRAY_900};font-weight:600;text-align:right;">${escapeHtml(dateStr)}</td></tr>
            <tr><td style="padding:8px 0;color:${GRAY_500};">Vieta</td><td style="padding:8px 0;color:${GRAY_900};font-weight:600;text-align:right;">${escapeHtml(venueLine)}</td></tr>
            <tr><td style="padding:8px 0;color:${GRAY_500};">Prezentuoja</td><td style="padding:8px 0;color:${GRAY_900};font-weight:600;text-align:right;">${escapeHtml(event.presenterName)}</td></tr>
            ${guestsLine}
            <tr><td style="padding:8px 0;color:${GRAY_500};">Įėjimas</td><td style="padding:8px 0;color:${GRAY_900};font-weight:600;text-align:right;">Nemokamas</td></tr>
          </table>
        </div>
      </td></tr>

      <tr><td style="padding:8px 32px;">
        <p style="margin:16px 0;color:${GRAY_900};font-size:14px;line-height:1.6;">
          Prie laiško pridėtas <strong>.ics kalendoriaus failas</strong> — atidarykite jį, kad renginys atsirastų Jūsų Google / Apple / Outlook kalendoriuje.
        </p>
        <p style="margin:16px 0;color:${GRAY_500};font-size:13px;line-height:1.6;">
          Jei planai pasikeis ir negalėsite atvykti, atsakykite į šį laišką — atlaisvinsime vietą kitam dalyviui.
        </p>
      </td></tr>

      <tr><td align="center" style="padding:16px 32px 32px 32px;">
        <a href="${eventUrl}" style="display:inline-block;padding:14px 28px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;">Renginio puslapis</a>
      </td></tr>

      <tr><td style="padding:20px 32px;background:${GRAY_50};border-top:1px solid ${BORDER};">
        <p style="margin:0;color:${GRAY_500};font-size:12px;line-height:1.6;text-align:center;">
          Klausimų dėl renginio? Rašykite <a href="mailto:${event.contactEmail}" style="color:${BRAND_MAGENTA};text-decoration:none;">${event.contactEmail}</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = [
    `Registracija patvirtinta — ${event.title}`,
    ``,
    `Laukiame Jūsų, ${firstName}!`,
    ``,
    `Data ir laikas: ${dateStr}`,
    `Vieta: ${venueLine}`,
    `Prezentuoja: ${event.presenterName}`,
    input.guestsCount > 0 ? `Dalyvių skaičius: ${totalPeople}` : null,
    `Įėjimas: nemokamas`,
    ``,
    `Prie laiško pridėtas .ics kalendoriaus failas — atidarykite jį, kad renginys atsirastų Jūsų kalendoriuje.`,
    ``,
    `Renginio puslapis: ${eventUrl}`,
    `Klausimai: ${event.contactEmail}`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  return { subject, html, text }
}

// ============================================
// Admin notifikacija (naujas registruotasis)
// ============================================

type AdminInput = RegistrationInput & {
  adminUrl: string
}

export function buildEventRegistrationAdminEmail(input: AdminInput): {
  subject: string
  html: string
  text: string
} {
  const {
    event,
    firstName,
    lastName,
    email,
    phone,
    salonName,
    role,
    guestsCount,
    adminUrl,
  } = input

  const fullName = `${firstName} ${lastName}`.trim()
  const totalPeople = 1 + guestsCount
  const subject = `Nauja registracija: ${fullName} — ${event.shortTitle}`

  const rows: Array<[string, string]> = [
    ['Vardas, pavardė', fullName],
    ['El. paštas', email],
    ['Telefonas', phone],
  ]
  if (salonName) rows.push(['Salonas', salonName])
  if (role) rows.push(['Pareigos', role])
  if (guestsCount > 0) rows.push(['Iš viso dalyvių', String(totalPeople)])

  const rowsHtml = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 0;color:${GRAY_500};font-size:13px;">${escapeHtml(k)}</td>
        <td style="padding:8px 0;color:${GRAY_900};font-size:13px;font-weight:600;text-align:right;">${escapeHtml(v)}</td>
      </tr>`
    )
    .join('')

  const html = `<!doctype html>
<html lang="lt"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:28px 32px 12px 32px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:${BRAND_MAGENTA};">Nauja registracija</div>
        <h1 style="margin:8px 0 4px 0;color:${GRAY_900};font-size:20px;">${escapeHtml(fullName)}</h1>
        <div style="color:${GRAY_500};font-size:13px;">${escapeHtml(event.title)}</div>
      </td></tr>
      <tr><td style="padding:0 32px;">
        <div style="background:${GRAY_50};border-radius:12px;padding:20px;margin:12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
        </div>
      </td></tr>
      <tr><td style="padding:16px 32px 32px 32px;">
        <a href="${adminUrl}" style="display:inline-block;padding:10px 20px;background:${GRAY_900};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Atidaryti admin panelėje</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = [
    `Nauja registracija į ${event.title}`,
    ``,
    `Vardas: ${fullName}`,
    `El. paštas: ${email}`,
    `Telefonas: ${phone}`,
    salonName ? `Salonas: ${salonName}` : null,
    role ? `Pareigos: ${role}` : null,
    guestsCount > 0 ? `Iš viso dalyvių: ${totalPeople}` : null,
    ``,
    `Admin: ${adminUrl}`,
  ]
    .filter((l) => l !== null)
    .join('\n')

  return { subject, html, text }
}

// ============================================
// Priminimas dieną prieš renginį (cron)
// ============================================

type ReminderInput = {
  event: EventInfo
  firstName: string
  eventUrl: string
}

export function buildEventReminderEmail(input: ReminderInput): {
  subject: string
  html: string
  text: string
} {
  const { event, firstName, eventUrl } = input
  const dateStr = formatEventDateLt(event)
  const venueLine = `${event.venueName}, ${event.venueStreet}, ${event.venueCity}`

  const subject = `Rytoj — ${event.title}`

  const html = `<!doctype html>
<html lang="lt"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${GRAY_50};">Priminimas: ${escapeHtml(event.title)} rytoj ${escapeHtml(dateStr)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 12px 0;color:${GRAY_900};font-size:22px;">Iki renginio — viena diena</h1>
        <p style="margin:0 0 20px 0;color:${GRAY_500};font-size:15px;line-height:1.6;">
          Sveiki, ${escapeHtml(firstName)}! Tik primename, kad rytoj Jūsų laukia <strong style="color:${GRAY_900};">${escapeHtml(event.title)}</strong>.
        </p>
        <div style="background:${GRAY_50};border-radius:12px;padding:20px;margin:20px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:6px 0;color:${GRAY_500};">Kada</td><td style="padding:6px 0;color:${GRAY_900};font-weight:600;text-align:right;">${escapeHtml(dateStr)}</td></tr>
            <tr><td style="padding:6px 0;color:${GRAY_500};">Kur</td><td style="padding:6px 0;color:${GRAY_900};font-weight:600;text-align:right;">${escapeHtml(venueLine)}</td></tr>
          </table>
        </div>
        <p style="margin:20px 0;color:${GRAY_500};font-size:13px;line-height:1.6;">
          Jei vis dėlto negalėsite atvykti — trumpai atsakykite į šį laišką, atlaisvinsime vietą.
        </p>
        <a href="${eventUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">Renginio puslapis</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = [
    `Priminimas: rytoj — ${event.title}`,
    ``,
    `Sveiki, ${firstName}!`,
    ``,
    `Kada: ${dateStr}`,
    `Kur: ${venueLine}`,
    ``,
    `Jei negalėsite atvykti, atsakykite į šį laišką.`,
    `Renginio puslapis: ${eventUrl}`,
  ].join('\n')

  return { subject, html, text }
}

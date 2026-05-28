import 'server-only'

/**
 * Savaitinė admin suvestinė — siunčiama pirmadienio rytą.
 * Tik LT kalba (admin'as Lietuvoje). Jokio i18n.
 *
 * Dizainas: laiškas atveria pirmiausia „Reikia veiksmo" bloką (verifikacijos
 * laukia, mažas sandėlis), o tik tada apžvalginius skaičius. Tikslas — kad
 * admin'as iškart pamatytų, kur reikia jo dėmesio, o ne tik gražius KPI.
 */

const BRAND_MAGENTA = '#E91E8C'
const GRAY_900 = '#1A1A1A'
const GRAY_500 = '#6B6B6B'
const GRAY_50 = '#F5F5F7'
const BORDER = '#eeeeee'
const AMBER = '#d97706'
const RED = '#dc2626'
const GREEN = '#059669'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export type WeeklyAdminSummaryInput = {
  siteUrl: string
  weekStartLabel: string // "2026-05-21"
  weekEndLabel: string // "2026-05-28"

  // Užsakymai
  orders: {
    total: number
    revenueCents: number
    byStatus: {
      pending: number
      paid: number
      processing: number
      shipped: number
      delivered: number
      cancelled: number
      refunded: number
    }
    topProducts: Array<{ name: string; quantity: number; revenueCents: number }>
  }

  // Veiksmo reikia
  pendingVerifications: number
  approvedThisWeek: number
  lowStock: Array<{
    name: string
    sku: string | null
    stockQuantity: number
    slug: string
  }>
  newB2bInquiries: number
}

export function buildWeeklyAdminSummaryEmail(
  input: WeeklyAdminSummaryInput
): { subject: string; html: string; text: string } {
  const subject = `Savaitės suvestinė · ${input.weekStartLabel} – ${input.weekEndLabel}`
  const adminUrl = `${input.siteUrl}/admin`

  const needsAction =
    input.pendingVerifications > 0 || input.lowStock.length > 0

  const actionBlock = needsAction
    ? `
    <tr>
      <td style="padding:24px 32px 0;">
        <div style="background:#FEF3C7;border-left:4px solid ${AMBER};border-radius:8px;padding:18px 22px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${AMBER};margin-bottom:10px;">
            Reikia veiksmo
          </div>
          ${
            input.pendingVerifications > 0
              ? `<div style="font-size:14px;line-height:1.65;color:${GRAY_900};margin-bottom:6px;">
                  <strong>${input.pendingVerifications}</strong> profesionalas laukia patvirtinimo.
                  <a href="${adminUrl}/verifikacija" style="color:${BRAND_MAGENTA};text-decoration:none;font-weight:600;">Peržiūrėti →</a>
                </div>`
              : ''
          }
          ${
            input.lowStock.length > 0
              ? `<div style="font-size:14px;line-height:1.65;color:${GRAY_900};">
                  <strong>${input.lowStock.length}</strong> produktas su žemu sandėliu (≤ 5 vnt.).
                  <a href="${adminUrl}/sandelis" style="color:${BRAND_MAGENTA};text-decoration:none;font-weight:600;">Sandėlis →</a>
                </div>`
              : ''
          }
        </div>
      </td>
    </tr>`
    : `
    <tr>
      <td style="padding:24px 32px 0;">
        <div style="background:#ECFDF5;border-left:4px solid ${GREEN};border-radius:8px;padding:18px 22px;">
          <div style="font-size:13px;font-weight:600;color:${GREEN};">
            ✓ Šią savaitę nereikia rankinio admin veiksmo.
          </div>
        </div>
      </td>
    </tr>`

  const kpiCell = (
    label: string,
    value: string,
    color: string = GRAY_900
  ) => `
    <td valign="top" style="padding:14px 18px;border:1px solid ${BORDER};border-radius:10px;background:#ffffff;text-align:center;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:6px;">
        ${escapeHtml(label)}
      </div>
      <div style="font-size:22px;font-weight:700;color:${color};line-height:1;">
        ${escapeHtml(value)}
      </div>
    </td>`

  const o = input.orders.byStatus
  const statusRow = (label: string, value: number) => `
    <tr>
      <td style="padding:6px 0;color:${GRAY_500};font-size:13px;width:60%;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:${GRAY_900};font-size:13px;font-weight:600;text-align:right;">${value}</td>
    </tr>`

  const lowStockList = input.lowStock.length
    ? input.lowStock
        .map(
          (p) => `
        <tr>
          <td style="padding:8px 0;border-top:1px solid ${BORDER};">
            <a href="${adminUrl}/sandelis/${escapeHtml(p.slug)}" style="color:${GRAY_900};text-decoration:none;font-size:13px;font-weight:600;">
              ${escapeHtml(p.name)}
            </a>
            ${p.sku ? `<div style="font-size:11px;color:${GRAY_500};">${escapeHtml(p.sku)}</div>` : ''}
          </td>
          <td style="padding:8px 0;border-top:1px solid ${BORDER};text-align:right;">
            <span style="font-size:13px;font-weight:700;color:${p.stockQuantity === 0 ? RED : AMBER};">
              ${p.stockQuantity} vnt.
            </span>
          </td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding:14px 0;color:${GRAY_500};font-size:13px;text-align:center;">Visi produktai gerai aprūpinti.</td></tr>`

  const topProductsList = input.orders.topProducts.length
    ? input.orders.topProducts
        .map(
          (p, i) => `
        <tr>
          <td style="padding:8px 0;border-top:${i === 0 ? '0' : `1px solid ${BORDER}`};font-size:13px;color:${GRAY_900};">
            <strong>${i + 1}.</strong> ${escapeHtml(p.name)}
          </td>
          <td style="padding:8px 0;border-top:${i === 0 ? '0' : `1px solid ${BORDER}`};text-align:right;font-size:13px;color:${GRAY_500};">
            ${p.quantity} vnt. · <strong style="color:${GRAY_900};">${escapeHtml(formatEur(p.revenueCents))}</strong>
          </td>
        </tr>`
        )
        .join('')
    : `<tr><td colspan="2" style="padding:14px 0;color:${GRAY_500};font-size:13px;text-align:center;">Šią savaitę užsakymų nebuvo.</td></tr>`

  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="padding:24px 32px;background:${GRAY_900};">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.7);">
              Admin · Savaitės suvestinė
            </div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:4px;">
              ${escapeHtml(input.weekStartLabel)} – ${escapeHtml(input.weekEndLabel)}
            </div>
          </td>
        </tr>

        ${actionBlock}

        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:10px;">
              Užsakymai per 7 d.
            </div>
            <table width="100%" cellpadding="0" cellspacing="6">
              <tr>
                ${kpiCell('Užsakymai', String(input.orders.total))}
                ${kpiCell('Apyvarta', formatEur(input.orders.revenueCents), BRAND_MAGENTA)}
              </tr>
              <tr>
                ${kpiCell('Naujos paskyros', String(input.approvedThisWeek + input.pendingVerifications))}
                ${kpiCell('B2B užklausos', String(input.newB2bInquiries))}
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:10px;">
              Užsakymų statusai
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;padding:14px 18px;">
              ${statusRow('Laukia apmokėjimo', o.pending)}
              ${statusRow('Apmokėti', o.paid)}
              ${statusRow('Ruošiami', o.processing)}
              ${statusRow('Išsiųsti', o.shipped)}
              ${statusRow('Pristatyti', o.delivered)}
              ${statusRow('Atšaukti', o.cancelled)}
              ${statusRow('Grąžinti', o.refunded)}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:10px;">
              Populiariausi produktai
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;padding:14px 18px;">
              ${topProductsList}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:10px;">
              Žemas sandėlis (≤ 5 vnt.)
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;padding:14px 18px;">
              ${lowStockList}
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 32px 32px;">
            <a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
              Atidaryti admin →
            </a>
            <div style="margin-top:18px;border-top:1px solid ${BORDER};padding-top:16px;font-size:11px;color:${GRAY_500};text-align:center;">
              Šis laiškas siunčiamas automatiškai kiekvieną pirmadienį.
              Adresatas keičiamas per ADMIN_NOTIFICATION_EMAIL env.
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `SAVAITĖS SUVESTINĖ · ${input.weekStartLabel} – ${input.weekEndLabel}

REIKIA VEIKSMO
- Laukia patvirtinimo: ${input.pendingVerifications}
- Žemo sandėlio produktai: ${input.lowStock.length}

UŽSAKYMAI PER 7 D.
- Iš viso: ${input.orders.total}
- Apyvarta: ${formatEur(input.orders.revenueCents)}
- Laukia apmokėjimo: ${o.pending}
- Apmokėti: ${o.paid}
- Ruošiami: ${o.processing}
- Išsiųsti: ${o.shipped}
- Pristatyti: ${o.delivered}
- Atšaukti: ${o.cancelled}
- Grąžinti: ${o.refunded}

POPULIARIAUSI PRODUKTAI
${input.orders.topProducts.map((p, i) => `${i + 1}. ${p.name} — ${p.quantity} vnt. · ${formatEur(p.revenueCents)}`).join('\n') || '(užsakymų nebuvo)'}

ŽEMAS SANDĖLIS
${input.lowStock.map((p) => `- ${p.name} (${p.sku ?? 'be SKU'}): ${p.stockQuantity} vnt.`).join('\n') || '(visi produktai gerai aprūpinti)'}

NAUJOS PASKYROS: ${input.approvedThisWeek + input.pendingVerifications}
B2B UŽKLAUSOS: ${input.newB2bInquiries}

Admin: ${adminUrl}`

  return { subject, html, text }
}

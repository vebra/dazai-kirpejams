import 'server-only'

/**
 * HTML email templates.
 *
 * Dizaino principai:
 * - Inline CSS (Gmail, Outlook nestyles <style> tag'o `<head>` viduje).
 * - Tik lenteliniai layout'ai (`<table>`) — flex/grid email'uose neveikia.
 * - Saugios spalvos: brand magenta #E91E8C, gray #1A1A1A / #6B6B6B / #F5F5F7.
 * - Maksimalus plotis 600px — standartas.
 * - Preheader (hidden text) po `<body>` — Gmail rodo inbox previewe.
 *
 * Visi templatai grąžina `{ subject, html, text }`. `text` variantas yra
 * privalomas spam filtrams ir accessibility'ui.
 */

const BRAND_MAGENTA = '#E91E8C'
const GRAY_900 = '#1A1A1A'
const GRAY_500 = '#6B6B6B'
const GRAY_50 = '#F5F5F7'
const BORDER = '#eeeeee'

function formatEur(cents: number): string {
  return new Intl.NumberFormat('lt-LT', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('lt-LT', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

type OrderItem = {
  name: string
  quantity: number
  unitPriceCents: number
}

/**
 * Įmonės duomenys email šablonui — banko informacija + footer.
 * Jei visi laukai tušti (admin'as dar neužpildė Nustatymų), banko blokas
 * elgiasi degraced: nerodom IBAN instrukcijų arba rodom fallback placeholder'į.
 */
type CompanyInfoForEmail = {
  legalName: string
  address: string
  email: string
  phone: string
  bankRecipient: string
  bankIban: string
  bankName: string
}

type CustomerOrderEmailInput = {
  orderNumber: string
  firstName: string
  lastName: string
  email: string
  phone: string
  deliveryMethod: 'courier' | 'parcel_locker' | 'pickup'
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  paymentMethod: 'bank_transfer' | 'paysera' | 'stripe'
  items: OrderItem[]
  subtotalCents: number
  discountCode?: string | null
  discountCents?: number
  shippingCents: number
  vatCents: number
  totalCents: number
  createdAt: string
  siteUrl: string
  company?: CompanyInfoForEmail
}

const DELIVERY_LT: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
}

const PAYMENT_LT: Record<string, string> = {
  bank_transfer: 'Banko pavedimas',
  paysera: 'Paysera',
  stripe: 'Banko kortelė',
}

// ============================================
// Kliento patvirtinimas
// ============================================

export function buildCustomerOrderEmail(input: CustomerOrderEmailInput): {
  subject: string
  html: string
  text: string
} {
  const subject = `Jūsų užsakymas ${input.orderNumber} gautas — Dažai Kirpėjams`

  const itemsRows = input.items
    .map(
      (it) => `
      <tr>
        <td style="padding:12px 16px;border-top:1px solid ${BORDER};color:${GRAY_900};font-size:14px;">
          ${escapeHtml(it.name)}
          <div style="color:${GRAY_500};font-size:12px;margin-top:2px;">× ${it.quantity}</div>
        </td>
        <td style="padding:12px 16px;border-top:1px solid ${BORDER};color:${GRAY_900};font-size:14px;text-align:right;font-weight:600;white-space:nowrap;">
          ${formatEur(it.unitPriceCents * it.quantity)}
        </td>
      </tr>`
    )
    .join('')

  const addressBlock =
    input.deliveryMethod === 'courier' && input.deliveryAddress
      ? `${escapeHtml(input.deliveryAddress)}, ${escapeHtml(input.deliveryCity ?? '')} ${escapeHtml(input.deliveryPostalCode ?? '')}`
      : input.deliveryMethod === 'parcel_locker' && input.deliveryAddress
        ? `Paštomatas: ${escapeHtml(input.deliveryAddress)}`
        : 'Atsiėmimas vietoje'

  // Banko pavedimo blokas rodomas tik jei:
  //   - mokėjimo būdas = bank_transfer
  //   - admin'as užpildė bent IBAN'ą ir gavėją Nustatymuose
  // Jei nėra IBAN'o, rodom paprastesnę žinutę be rekvizitų — kad nesiųsti
  // placeholder'ių klientams.
  const hasBankInfo = Boolean(
    input.company?.bankIban && input.company?.bankRecipient
  )
  const bankRecipient = input.company?.bankRecipient ?? ''
  const bankIban = input.company?.bankIban ?? ''
  const bankName = input.company?.bankName ?? ''

  const bankTransferBlock =
    input.paymentMethod === 'bank_transfer' && hasBankInfo
      ? `
      <tr>
        <td style="padding:0 20px;">
          <div style="background:${GRAY_900};color:#ffffff;border-radius:12px;padding:24px;margin:24px 0;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,0.6);">
              Apmokėjimo instrukcijos
            </div>
            <div style="font-size:16px;font-weight:700;margin-top:4px;margin-bottom:16px;">
              Banko pavedimas
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
              <tr>
                <td style="padding:8px 0;color:rgba(255,255,255,0.6);">Gavėjas</td>
                <td style="padding:8px 0;color:#ffffff;text-align:right;font-weight:600;">${escapeHtml(bankRecipient)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:rgba(255,255,255,0.6);border-top:1px solid rgba(255,255,255,0.1);">IBAN</td>
                <td style="padding:8px 0;color:#ffffff;text-align:right;font-family:monospace;border-top:1px solid rgba(255,255,255,0.1);">${escapeHtml(bankIban)}</td>
              </tr>
              ${
                bankName
                  ? `<tr>
                <td style="padding:8px 0;color:rgba(255,255,255,0.6);border-top:1px solid rgba(255,255,255,0.1);">Bankas</td>
                <td style="padding:8px 0;color:#ffffff;text-align:right;border-top:1px solid rgba(255,255,255,0.1);">${escapeHtml(bankName)}</td>
              </tr>`
                  : ''
              }
              <tr>
                <td style="padding:8px 0;color:rgba(255,255,255,0.6);border-top:1px solid rgba(255,255,255,0.1);">Suma</td>
                <td style="padding:8px 0;color:${BRAND_MAGENTA};text-align:right;font-weight:700;font-size:16px;border-top:1px solid rgba(255,255,255,0.1);">${formatEur(input.totalCents)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:rgba(255,255,255,0.6);border-top:1px solid rgba(255,255,255,0.1);">Mokėjimo paskirtis</td>
                <td style="padding:8px 0;color:#ffffff;text-align:right;font-family:monospace;border-top:1px solid rgba(255,255,255,0.1);">${input.orderNumber}</td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;">
              SVARBU: mokėjimo paskirtyje nurodykite tikslų užsakymo numerį —
              tai leis greitai atpažinti jūsų mokėjimą. Prekes išsiųsime iš
              karto gavę pinigus.
            </p>
          </div>
        </td>
      </tr>`
      : input.paymentMethod === 'bank_transfer'
        ? `
      <tr>
        <td style="padding:0 20px;">
          <div style="background:${GRAY_50};border:1px solid ${BORDER};border-radius:12px;padding:20px;margin:24px 0;">
            <div style="font-size:13px;color:${GRAY_900};line-height:1.6;">
              Mokėjimo instrukcijas atsiųsime atskiru laišku per artimiausią
              darbo dieną.
            </div>
          </div>
        </td>
      </tr>`
        : ''

  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Ačiū už jūsų užsakymą ${input.orderNumber}. Suma: ${formatEur(input.totalCents)}.
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid ${BORDER};">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND_MAGENTA};">
              Dažai Kirpėjams
            </div>
            <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:${GRAY_900};line-height:1.2;">
              Ačiū už jūsų užsakymą
            </h1>
            <p style="margin:8px 0 0;font-size:14px;color:${GRAY_500};line-height:1.5;">
              Sveiki, ${escapeHtml(input.firstName)}. Jūsų užsakymas sėkmingai gautas ir mes jau jį ruošiame.
            </p>
          </td>
        </tr>

        <!-- Order number -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${GRAY_50};border-radius:12px;padding:16px 20px;">
                  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};">
                    Užsakymo numeris
                  </div>
                  <div style="font-size:20px;font-weight:700;color:${GRAY_900};font-family:monospace;margin-top:4px;">
                    ${escapeHtml(input.orderNumber)}
                  </div>
                  <div style="font-size:12px;color:${GRAY_500};margin-top:4px;">
                    ${escapeHtml(formatDate(input.createdAt))}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${bankTransferBlock}

        <!-- Prekės -->
        <tr>
          <td style="padding:24px 32px 0;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:8px;">
              Jūsų užsakymas
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
              ${itemsRows}
              <tr>
                <td colspan="2" style="padding:12px 16px;border-top:1px solid ${BORDER};background:${GRAY_50};">
                  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                    <tr>
                      <td style="padding:2px 0;color:${GRAY_500};">Prekės</td>
                      <td style="padding:2px 0;color:${GRAY_900};text-align:right;">${formatEur(input.subtotalCents)}</td>
                    </tr>
                    ${
                      input.discountCents && input.discountCents > 0
                        ? `<tr>
                      <td style="padding:2px 0;color:${BRAND_MAGENTA};">Nuolaida${input.discountCode ? ` (${escapeHtml(input.discountCode)})` : ''}</td>
                      <td style="padding:2px 0;color:${BRAND_MAGENTA};text-align:right;font-weight:600;">−${formatEur(input.discountCents)}</td>
                    </tr>`
                        : ''
                    }
                    <tr>
                      <td style="padding:2px 0;color:${GRAY_500};">Pristatymas</td>
                      <td style="padding:2px 0;color:${GRAY_900};text-align:right;">${input.shippingCents === 0 ? 'Nemokamas' : formatEur(input.shippingCents)}</td>
                    </tr>
                    <tr>
                      <td style="padding:2px 0;color:${GRAY_500};">PVM (21%)</td>
                      <td style="padding:2px 0;color:${GRAY_500};text-align:right;">${formatEur(input.vatCents)}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0 0;color:${GRAY_900};font-weight:700;font-size:15px;border-top:1px solid ${BORDER};">Iš viso</td>
                      <td style="padding:8px 0 0;color:${GRAY_900};font-weight:700;font-size:18px;text-align:right;border-top:1px solid ${BORDER};">${formatEur(input.totalCents)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Kontaktai + pristatymas -->
        <tr>
          <td style="padding:24px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" valign="top" style="padding-right:8px;">
                  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:8px;">
                    Kontaktai
                  </div>
                  <div style="font-size:13px;color:${GRAY_900};line-height:1.6;">
                    ${escapeHtml(input.firstName)} ${escapeHtml(input.lastName)}<br>
                    ${escapeHtml(input.email)}<br>
                    ${escapeHtml(input.phone)}
                  </div>
                </td>
                <td width="50%" valign="top" style="padding-left:8px;">
                  <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:8px;">
                    Pristatymas
                  </div>
                  <div style="font-size:13px;color:${GRAY_900};line-height:1.6;">
                    <strong>${DELIVERY_LT[input.deliveryMethod]}</strong><br>
                    ${addressBlock}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px;border-top:1px solid ${BORDER};margin-top:32px;">
            <p style="margin:0 0 12px;font-size:13px;color:${GRAY_500};line-height:1.6;">
              Jei turite klausimų apie užsakymą, tiesiog atsakykite į šį laišką
              arba parašykite mums el. paštu.
            </p>
            <p style="margin:0;font-size:12px;color:${GRAY_500};line-height:1.6;">
              <strong style="color:${GRAY_900};">${escapeHtml(input.company?.legalName || 'Dažai Kirpėjams')}</strong><br>
              Profesionalūs plaukų dažai kirpėjams · 180 ml<br>
              ${
                input.company?.address
                  ? `${escapeHtml(input.company.address)}<br>`
                  : ''
              }
              <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${input.siteUrl.replace(/^https?:\/\//, '')}</a>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const itemsText = input.items
    .map(
      (it) =>
        `  • ${it.name} × ${it.quantity} — ${formatEur(it.unitPriceCents * it.quantity)}`
    )
    .join('\n')

  const text = `
Ačiū už jūsų užsakymą — Dažai Kirpėjams

Sveiki, ${input.firstName}.

Jūsų užsakymas ${input.orderNumber} sėkmingai gautas.
Data: ${formatDate(input.createdAt)}

UŽSAKYMAS
${itemsText}

Prekės:     ${formatEur(input.subtotalCents)}${
    input.discountCents && input.discountCents > 0
      ? `
Nuolaida${input.discountCode ? ` (${input.discountCode})` : ''}: −${formatEur(input.discountCents)}`
      : ''
  }
Pristatymas: ${input.shippingCents === 0 ? 'Nemokamas' : formatEur(input.shippingCents)}
PVM (21%):  ${formatEur(input.vatCents)}
IŠ VISO:    ${formatEur(input.totalCents)}

PRISTATYMAS
${DELIVERY_LT[input.deliveryMethod]}
${input.deliveryMethod === 'pickup' ? 'Atsiėmimas vietoje' : input.deliveryAddress ?? ''}
${input.deliveryCity ? `${input.deliveryCity} ${input.deliveryPostalCode ?? ''}` : ''}

${
  input.paymentMethod === 'bank_transfer' && hasBankInfo
    ? `
APMOKĖJIMO INSTRUKCIJOS (Banko pavedimas)
Gavėjas: ${bankRecipient}
IBAN: ${bankIban}${bankName ? `\nBankas: ${bankName}` : ''}
Suma: ${formatEur(input.totalCents)}
Mokėjimo paskirtis: ${input.orderNumber}

SVARBU: mokėjimo paskirtyje nurodykite tikslų užsakymo numerį.
`
    : input.paymentMethod === 'bank_transfer'
      ? `
Mokėjimo instrukcijas atsiųsime atskiru laišku per artimiausią darbo dieną.
`
      : ''
}

Jei turite klausimų — tiesiog atsakykite į šį laišką.

${input.company?.legalName || 'Dažai Kirpėjams'}
${input.siteUrl}
`.trim()

  return { subject, html, text }
}

// ============================================
// Admin pranešimas apie naują užsakymą
// ============================================

type AdminOrderEmailInput = {
  orderNumber: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  isB2b: boolean
  companyName: string | null
  totalCents: number
  itemCount: number
  paymentMethod: string
  deliveryMethod: string
  adminUrl: string
  createdAt: string
}

export function buildAdminOrderEmail(input: AdminOrderEmailInput): {
  subject: string
  html: string
  text: string
} {
  const subject = `Naujas užsakymas ${input.orderNumber} · ${formatEur(input.totalCents)}`

  const b2bBadge = input.isB2b
    ? `<span style="display:inline-block;background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;margin-left:8px;">B2B</span>`
    : ''

  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  ${escapeHtml(input.customerName)} · ${input.itemCount} prekės · ${formatEur(input.totalCents)}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="padding:24px 32px;background:${BRAND_MAGENTA};">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.8);">
              Admin · Naujas užsakymas
            </div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;font-family:monospace;margin-top:4px;">
              ${escapeHtml(input.orderNumber)}${b2bBadge}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;width:40%;">Data</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;">${escapeHtml(formatDate(input.createdAt))}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Klientas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">
                  ${escapeHtml(input.customerName)}${input.companyName ? `<br><span style="color:${GRAY_500};font-size:12px;">${escapeHtml(input.companyName)}</span>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">El. paštas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">
                  <a href="mailto:${escapeHtml(input.customerEmail)}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.customerEmail)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Telefonas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">
                  <a href="tel:${escapeHtml(input.customerPhone)}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.customerPhone)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Pristatymas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${escapeHtml(DELIVERY_LT[input.deliveryMethod] ?? input.deliveryMethod)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Mokėjimas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${escapeHtml(PAYMENT_LT[input.paymentMethod] ?? input.paymentMethod)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Prekių</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${input.itemCount} vnt.</td>
              </tr>
              <tr>
                <td style="padding:12px 0;color:${GRAY_900};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid ${BORDER};">Iš viso</td>
                <td style="padding:12px 0;color:${GRAY_900};font-size:22px;font-weight:700;border-top:1px solid ${BORDER};">${formatEur(input.totalCents)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 32px;">
            <a href="${input.adminUrl}" style="display:inline-block;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;">
              Atidaryti admin panelėje →
            </a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `
NAUJAS UŽSAKYMAS ${input.orderNumber}${input.isB2b ? ' [B2B]' : ''}
${formatEur(input.totalCents)} · ${input.itemCount} prekės

Data:        ${formatDate(input.createdAt)}
Klientas:    ${input.customerName}${input.companyName ? ` (${input.companyName})` : ''}
El. paštas:  ${input.customerEmail}
Telefonas:   ${input.customerPhone}
Pristatymas: ${DELIVERY_LT[input.deliveryMethod] ?? input.deliveryMethod}
Mokėjimas:   ${PAYMENT_LT[input.paymentMethod] ?? input.paymentMethod}

Atidaryti admin panelėje:
${input.adminUrl}
`.trim()

  return { subject, html, text }
}

// ============================================
// Statuso keitimo email klientui
// ============================================

type StatusChangeEmailInput = {
  orderNumber: string
  firstName: string
  status: 'shipped' | 'cancelled'
  trackingNumber: string | null
  trackingCarrier: string | null
  siteUrl: string
}

const CARRIER_LABELS: Record<string, string> = {
  omniva: 'Omniva',
  dpd: 'DPD',
  lp_express: 'LP Express',
  other: '',
}

const CARRIER_TRACKING_URLS: Record<string, (tn: string) => string> = {
  omniva: (tn) => `https://www.omniva.lt/private_customer/tracking?barcode=${tn}`,
  dpd: (tn) => `https://www.dpd.lt/tracking?parcelnumber=${tn}`,
  lp_express: (tn) => `https://www.lpexpress.lt/tracking/${tn}`,
}

export function buildStatusChangeEmail(input: StatusChangeEmailInput): {
  subject: string
  html: string
  text: string
} {
  if (input.status === 'shipped') {
    return buildShippedEmail(input)
  }
  return buildCancelledEmail(input)
}

function buildShippedEmail(input: StatusChangeEmailInput): {
  subject: string
  html: string
  text: string
} {
  const subject = `Jūsų užsakymas ${input.orderNumber} išsiųstas`
  const carrierLabel = input.trackingCarrier
    ? CARRIER_LABELS[input.trackingCarrier] ?? input.trackingCarrier
    : null

  const trackingUrl =
    input.trackingNumber && input.trackingCarrier
      ? CARRIER_TRACKING_URLS[input.trackingCarrier]?.(input.trackingNumber) ?? null
      : null

  const trackingBlock = input.trackingNumber
    ? `
      <tr>
        <td style="padding:0 20px;">
          <div style="background:${GRAY_50};border-radius:12px;padding:20px;margin:24px 0;">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};">
              Siuntimo sekimo numeris${carrierLabel ? ` (${escapeHtml(carrierLabel)})` : ''}
            </div>
            <div style="font-size:18px;font-weight:700;color:${GRAY_900};font-family:monospace;margin-top:8px;">
              ${escapeHtml(input.trackingNumber)}
            </div>
            ${
              trackingUrl
                ? `<a href="${trackingUrl}" style="display:inline-block;margin-top:12px;padding:10px 20px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;">Sekti siuntą →</a>`
                : ''
            }
          </div>
        </td>
      </tr>`
    : ''

  const html = `<!doctype html>
<html lang="lt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Jūsų užsakymas ${escapeHtml(input.orderNumber)} jau pakeliui!
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND_MAGENTA};">Dažai Kirpėjams</div>
          <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:${GRAY_900};">Jūsų užsakymas išsiųstas!</h1>
          <p style="margin:8px 0 0;font-size:14px;color:${GRAY_500};line-height:1.5;">
            Sveiki, ${escapeHtml(input.firstName)}. Jūsų užsakymas <strong>${escapeHtml(input.orderNumber)}</strong> jau pakeliui pas Jus.
          </p>
        </td>
      </tr>
      ${trackingBlock}
      <tr>
        <td style="padding:32px;border-top:1px solid ${BORDER};">
          <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.6;">
            Jei turite klausimų — tiesiog atsakykite į šį laišką.
          </p>
          <p style="margin:12px 0 0;font-size:12px;color:${GRAY_500};">
            <strong style="color:${GRAY_900};">Dažai Kirpėjams</strong><br>
            <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${input.siteUrl.replace(/^https?:\/\//, '')}</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = `
Jūsų užsakymas ${input.orderNumber} išsiųstas — Dažai Kirpėjams

Sveiki, ${input.firstName}.

Jūsų užsakymas ${input.orderNumber} jau pakeliui pas Jus.
${input.trackingNumber ? `\nSiuntimo sekimo nr.: ${input.trackingNumber}${carrierLabel ? ` (${carrierLabel})` : ''}` : ''}
${trackingUrl ? `Sekti siuntą: ${trackingUrl}` : ''}

Jei turite klausimų — tiesiog atsakykite į šį laišką.

Dažai Kirpėjams
${input.siteUrl}
`.trim()

  return { subject, html, text }
}

// ============================================
// PVM sąskaitos faktūros email klientui (su PDF priedu)
// ============================================

type InvoicePaidEmailInput = {
  orderNumber: string
  invoiceNumber: string
  firstName: string
  totalCents: number
  siteUrl: string
  accountUrl: string
}

export function buildInvoicePaidEmail(input: InvoicePaidEmailInput): {
  subject: string
  html: string
  text: string
} {
  const subject = `PVM sąskaita faktūra ${input.invoiceNumber} — Dažai Kirpėjams`

  const html = `<!doctype html>
<html lang="lt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Sąskaita ${escapeHtml(input.invoiceNumber)} priede. Suma ${formatEur(input.totalCents)}.
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND_MAGENTA};">Dažai Kirpėjams</div>
          <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:${GRAY_900};">Jūsų PVM sąskaita faktūra</h1>
          <p style="margin:8px 0 0;font-size:14px;color:${GRAY_500};line-height:1.5;">
            Sveiki, ${escapeHtml(input.firstName)}. Ačiū už apmokėjimą — sąskaitą rasite šio laiško priede (PDF).
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};">Sąskaitos numeris</div>
                <div style="font-size:18px;font-weight:700;color:${GRAY_900};font-family:monospace;margin-top:4px;">${escapeHtml(input.invoiceNumber)}</div>
              </td>
              <td style="padding:16px 20px;text-align:right;">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};">Suma</div>
                <div style="font-size:18px;font-weight:700;color:${GRAY_900};margin-top:4px;">${formatEur(input.totalCents)}</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0 20px 16px;">
                <div style="font-size:12px;color:${GRAY_500};">Užsakymas <span style="font-family:monospace;color:${GRAY_900};">${escapeHtml(input.orderNumber)}</span></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:14px;color:${GRAY_900};line-height:1.6;">
            Sąskaitą taip pat galite peržiūrėti ir parsisiųsti savo paskyroje:
          </p>
          <a href="${input.accountUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Mano sąskaitos →
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;border-top:1px solid ${BORDER};padding-top:24px;">
          <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.6;">
            Jei turite klausimų — tiesiog atsakykite į šį laišką.
          </p>
          <p style="margin:12px 0 0;font-size:12px;color:${GRAY_500};">
            <strong style="color:${GRAY_900};">Dažai Kirpėjams</strong><br>
            <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${input.siteUrl.replace(/^https?:\/\//, '')}</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = `
PVM sąskaita faktūra ${input.invoiceNumber} — Dažai Kirpėjams

Sveiki, ${input.firstName}.

Ačiū už apmokėjimą. Jūsų PVM sąskaita faktūra ${input.invoiceNumber} (užsakymas ${input.orderNumber}) pridėta prie šio laiško kaip PDF.

Suma: ${formatEur(input.totalCents)}

Sąskaitą taip pat galite parsisiųsti savo paskyroje:
${input.accountUrl}

Jei turite klausimų — tiesiog atsakykite į šį laišką.

Dažai Kirpėjams
${input.siteUrl}
`.trim()

  return { subject, html, text }
}

// ============================================
// B2B užklausa — admin pranešimas
// ============================================

type B2bInquiryAdminEmailInput = {
  salonName: string
  contactName: string
  email: string
  phone: string
  address: string | null
  monthlyVolume: string | null
  message: string | null
  locale: string
  adminUrl: string
  createdAt: string
}

const VOLUME_LT: Record<string, string> = {
  'iki-10': 'Iki 10 pakuočių / mėn.',
  '10-50': '10–50 pakuočių / mėn.',
  '50-100': '50–100 pakuočių / mėn.',
  '100+': 'Daugiau nei 100 pakuočių / mėn.',
}

export function buildB2bInquiryAdminEmail(input: B2bInquiryAdminEmailInput): {
  subject: string
  html: string
  text: string
} {
  const subject = `Nauja B2B užklausa · ${input.salonName}`

  const volumeLabel = input.monthlyVolume
    ? VOLUME_LT[input.monthlyVolume] ?? input.monthlyVolume
    : '—'

  const messageBlock = input.message
    ? `
      <tr>
        <td style="padding:16px 32px 0;">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:${GRAY_500};margin-bottom:8px;">
            Žinutė
          </div>
          <div style="background:${GRAY_50};border-radius:12px;padding:16px 20px;font-size:14px;color:${GRAY_900};line-height:1.6;white-space:pre-wrap;">
            ${escapeHtml(input.message)}
          </div>
        </td>
      </tr>`
    : ''

  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Nauja B2B užklausa nuo ${escapeHtml(input.salonName)} · ${escapeHtml(input.contactName)}
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="padding:24px 32px;background:${BRAND_MAGENTA};">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.8);">
              Admin · Nauja B2B užklausa
            </div>
            <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:4px;">
              ${escapeHtml(input.salonName)}
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;width:40%;">Data</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;">${escapeHtml(formatDate(input.createdAt))}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Kontaktinis asmuo</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${escapeHtml(input.contactName)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">El. paštas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">
                  <a href="mailto:${escapeHtml(input.email)}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.email)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Telefonas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">
                  ${
                    input.phone
                      ? `<a href="tel:${escapeHtml(input.phone)}" style="color:${BRAND_MAGENTA};text-decoration:none;">${escapeHtml(input.phone)}</a>`
                      : '—'
                  }
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Salono adresas</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${input.address ? escapeHtml(input.address) : '—'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Mėnesinis poreikis</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${escapeHtml(volumeLabel)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:${GRAY_500};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:1px solid ${BORDER};">Svetainės kalba</td>
                <td style="padding:8px 0;color:${GRAY_900};font-size:14px;border-top:1px solid ${BORDER};">${escapeHtml(input.locale.toUpperCase())}</td>
              </tr>
            </table>
          </td>
        </tr>

        ${messageBlock}

        <tr>
          <td style="padding:24px 32px 32px;">
            <a href="${input.adminUrl}" style="display:inline-block;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px;">
              Peržiūrėti admin panelėje →
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:${GRAY_500};line-height:1.6;">
              Atsakyti klientui galite tiesiog paspaudę „Reply" — laiškas bus išsiųstas į <strong style="color:${GRAY_900};">${escapeHtml(input.email)}</strong>.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const text = `
NAUJA B2B UŽKLAUSA · ${input.salonName}

Data:              ${formatDate(input.createdAt)}
Kontaktinis asmuo: ${input.contactName}
El. paštas:        ${input.email}
Telefonas:         ${input.phone || '—'}
Salono adresas:    ${input.address || '—'}
Mėnesinis poreikis: ${volumeLabel}
Svetainės kalba:   ${input.locale.toUpperCase()}
${input.message ? `\nŽINUTĖ:\n${input.message}\n` : ''}
Peržiūrėti admin panelėje:
${input.adminUrl}
`.trim()

  return { subject, html, text }
}

// ============================================
// B2B užklausa — patvirtinimas klientui
// ============================================

type B2bInquiryCustomerEmailInput = {
  contactName: string
  salonName: string
  siteUrl: string
}

export function buildB2bInquiryCustomerEmail(
  input: B2bInquiryCustomerEmailInput
): {
  subject: string
  html: string
  text: string
} {
  const subject = 'Jūsų B2B užklausa gauta — Dažai Kirpėjams'

  const html = `<!doctype html>
<html lang="lt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Ačiū už B2B užklausą. Susisieksime artimiausiu metu su individualiu pasiūlymu.
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND_MAGENTA};">Dažai Kirpėjams</div>
          <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:${GRAY_900};line-height:1.2;">
            Ačiū už užklausą
          </h1>
          <p style="margin:12px 0 0;font-size:14px;color:${GRAY_500};line-height:1.6;">
            Sveiki, ${escapeHtml(input.contactName)}. Jūsų B2B užklausa nuo <strong style="color:${GRAY_900};">${escapeHtml(input.salonName)}</strong> sėkmingai gauta.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px;">
          <p style="margin:0 0 16px;font-size:14px;color:${GRAY_900};line-height:1.6;">
            Mūsų vadybininkas susisieks su Jumis artimiausiu metu (paprastai per 1 darbo dieną) ir pateiks individualų pasiūlymą jūsų salonui.
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:${GRAY_900};line-height:1.6;">
            Tuo tarpu galite peržiūrėti mūsų produktų asortimentą:
          </p>
          <a href="${input.siteUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Atidaryti parduotuvę →
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 32px 32px;border-top:1px solid ${BORDER};padding-top:24px;">
          <p style="margin:0;font-size:13px;color:${GRAY_500};line-height:1.6;">
            Jei turite skubų klausimą — tiesiog atsakykite į šį laišką.
          </p>
          <p style="margin:12px 0 0;font-size:12px;color:${GRAY_500};">
            <strong style="color:${GRAY_900};">Dažai Kirpėjams</strong><br>
            Profesionalūs plaukų dažai kirpėjams · 180 ml<br>
            <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${input.siteUrl.replace(/^https?:\/\//, '')}</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = `
Ačiū už užklausą — Dažai Kirpėjams

Sveiki, ${input.contactName}.

Jūsų B2B užklausa nuo ${input.salonName} sėkmingai gauta.

Mūsų vadybininkas susisieks su Jumis artimiausiu metu (paprastai per 1 darbo dieną) ir pateiks individualų pasiūlymą jūsų salonui.

Jei turite skubų klausimą — tiesiog atsakykite į šį laišką.

Dažai Kirpėjams
${input.siteUrl}
`.trim()

  return { subject, html, text }
}

function buildCancelledEmail(input: StatusChangeEmailInput): {
  subject: string
  html: string
  text: string
} {
  const subject = `Jūsų užsakymas ${input.orderNumber} atšauktas`

  const html = `<!doctype html>
<html lang="lt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND_MAGENTA};">Dažai Kirpėjams</div>
          <h1 style="margin:8px 0 0;font-size:24px;font-weight:700;color:${GRAY_900};">Užsakymas atšauktas</h1>
          <p style="margin:8px 0 0;font-size:14px;color:${GRAY_500};line-height:1.5;">
            Sveiki, ${escapeHtml(input.firstName)}. Jūsų užsakymas <strong>${escapeHtml(input.orderNumber)}</strong> buvo atšauktas.
            Jei mokėjimas jau buvo atliktas, pinigai bus grąžinti per 5 darbo dienas.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0;font-size:14px;color:${GRAY_900};line-height:1.6;">
            Jei manote, kad tai klaida, arba norite užsakyti iš naujo — susisiekite
            su mumis atsakydami į šį laišką.
          </p>
          <p style="margin:16px 0 0;">
            <a href="${input.siteUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_MAGENTA};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
              Grįžti į parduotuvę →
            </a>
          </p>
          <p style="margin:24px 0 0;font-size:12px;color:${GRAY_500};">
            <strong style="color:${GRAY_900};">Dažai Kirpėjams</strong><br>
            <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${input.siteUrl.replace(/^https?:\/\//, '')}</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const text = `
Jūsų užsakymas ${input.orderNumber} atšauktas — Dažai Kirpėjams

Sveiki, ${input.firstName}.

Jūsų užsakymas ${input.orderNumber} buvo atšauktas.
Jei mokėjimas jau buvo atliktas, pinigai bus grąžinti per 5 darbo dienas.

Jei manote, kad tai klaida — susisiekite su mumis atsakydami į šį laišką.

Dažai Kirpėjams
${input.siteUrl}
`.trim()

  return { subject, html, text }
}

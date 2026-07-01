import 'server-only'

/**
 * Marketing/relational kampanijos el. laiško šablonas. Admin'as įveda
 * subject + body (plain text); čia apvyniojama į brand'inį HTML wrapper'į.
 * `body` paragrafai (atskirti `\n\n`) tampa <p>; vienos eilutės pertrūkai
 * (`\n`) lieka kaip <br>.
 *
 * Šablonas LT only (pagal vartotojo pasirinkimą — visi 10 patvirtintų
 * profesionalų kalba LT). Pridėti EN/RU šabloną — atskira užduotis.
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

/**
 * Plain text body → HTML. Du atskiri \n\n = naujas paragrafas; vienas \n
 * paragrafe = <br>. Auto-link URL'us pradedančius http:// arba https://.
 */
function bodyToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((para) => {
      const escaped = escapeHtml(para.trim())
      const withBreaks = escaped.replace(/\n/g, '<br>')
      const linked = withBreaks.replace(
        /(https?:\/\/[^\s<]+)/g,
        (url) =>
          `<a href="${url}" style="color:${BRAND_MAGENTA};text-decoration:underline;">${url}</a>`
      )
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${GRAY_900};">${linked}</p>`
    })
    .join('')
}

export type CampaignEmailInput = {
  subject: string
  /** Admin'o įvestas plain text turinys (paragrafai atskirti \n\n). */
  body: string
  /** Vartotojo vardas (pvz. „Marius"). Jei tuščia — kreipiamasi „Sveiki". */
  firstName: string | null
  siteUrl: string
  /** Pasirinktinė nuotrauka (viešas URL). Rodoma virš teksto. */
  imageUrl?: string | null
  /** Email atidarymo tracking pixel URL — per recipient_id įterpia 1×1 PNG.
   * Jei null/undefined — pixel'is nepridedamas (pvz. testiniam siuntimui). */
  trackingPixelUrl?: string | null
  /** Atsisakymo nuoroda (HMAC, be prisijungimo). GDPR/ePrivacy reikalauja jos
   * kiekviename marketingo laiške. Jei null (pvz. testinis siuntimas adminui) —
   * footer'yje nerodoma. */
  unsubscribeUrl?: string | null
}

export function buildCampaignEmail(input: CampaignEmailInput): {
  subject: string
  html: string
  text: string
} {
  const greeting = input.firstName
    ? `Sveiki, ${escapeHtml(input.firstName)},`
    : 'Sveiki,'

  const html = `<!doctype html>
<html lang="lt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${GRAY_900};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="padding:32px 32px 16px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:${BRAND_MAGENTA};">
            Dažai Kirpėjams
          </div>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:${GRAY_900};line-height:1.3;">
            ${escapeHtml(input.subject)}
          </h1>
        </td>
      </tr>
      ${
        input.imageUrl
          ? `<tr>
        <td style="padding:0;">
          <img src="${input.imageUrl}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding:24px 32px 8px;">
          <p style="margin:0 0 16px;font-size:15px;color:${GRAY_900};font-weight:600;">
            ${greeting}
          </p>
          ${bodyToHtml(input.body)}
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px;border-top:1px solid ${BORDER};">
          <p style="margin:0 0 8px;font-size:13px;color:${GRAY_500};line-height:1.6;">
            Jei turite klausimų — tiesiog atsakykite į šį laišką.
          </p>
          <p style="margin:18px 0 0;font-size:12px;color:${GRAY_500};line-height:1.6;">
            <strong style="color:${GRAY_900};">Dažai Kirpėjams</strong> ·
            <a href="${input.siteUrl}" style="color:${BRAND_MAGENTA};text-decoration:none;">${input.siteUrl.replace(/^https?:\/\//, '')}</a>
          </p>
          ${
            input.unsubscribeUrl
              ? `<p style="margin:12px 0 0;font-size:11px;color:${GRAY_500};line-height:1.6;">
            Nebenorite gauti pasiūlymų? <a href="${input.unsubscribeUrl}" style="color:${GRAY_500};text-decoration:underline;">Atsisakyti naujienlaiškių</a>
          </p>`
              : ''
          }
        </td>
      </tr>
    </table>
  </td></tr>
</table>
${
  input.trackingPixelUrl
    ? `<img src="${input.trackingPixelUrl}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" />`
    : ''
}
</body>
</html>`

  const text = `${input.subject}

${greeting}

${input.body}

Jei turite klausimų — tiesiog atsakykite į šį laišką.

Dažai Kirpėjams
${input.siteUrl}${
    input.unsubscribeUrl
      ? `

Atsisakyti naujienlaiškių: ${input.unsubscribeUrl}`
      : ''
  }`

  return { subject: input.subject, html, text }
}

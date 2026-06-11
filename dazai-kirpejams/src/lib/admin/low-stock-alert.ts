import 'server-only'
import { getAdminProducts } from './queries'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'

/**
 * Žemo likučio įspėjimas adminui el. paštu.
 *
 * Logika ta pati kaip /admin/sandelis/uzsakyti: prekė įtraukiama, kai jai
 * nustatyta perspėjimo riba (reorder_point > 0) ir likutis <= ribos.
 * Siunčiama TIK jei tokių prekių yra (tuščių laiškų nesiunčiam).
 *
 * Kviečiama iš kasdienio event-reminders cron'o (Vercel Hobby planas leidžia
 * tik 2 cron'us — abu užimti, todėl prisikabinam prie esamo, ~8:00).
 */
export async function sendLowStockAlertIfNeeded(): Promise<{
  sent: boolean
  count: number
}> {
  const products = await getAdminProducts({ sortBy: 'stock-asc' })
  const low = products.filter(
    (p) =>
      p.isActive &&
      p.reorderPoint != null &&
      p.reorderPoint > 0 &&
      p.stockQuantity <= p.reorderPoint
  )
  if (low.length === 0) return { sent: false, count: 0 }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  const adminEmail = getAdminNotificationEmail() ?? 'info@dziuljetavebre.lt'

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const suggested = (p: (typeof low)[number]) =>
    Math.max((p.reorderPoint ?? 0) * 2 - p.stockQuantity, 1)

  const rows = low
    .map(
      (p) => `<tr>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:14px;color:#1A1A1A;">${p.colorNumber ? `${esc(p.colorNumber)} · ` : ''}${esc(p.nameLt)}</td>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:14px;text-align:center;color:${p.stockQuantity === 0 ? '#dc2626' : '#1A1A1A'};font-weight:600;">${p.stockQuantity}</td>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:14px;text-align:center;color:#6B6B6B;">${p.reorderPoint}</td>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:14px;text-align:center;font-weight:600;">${suggested(p)}</td>
      </tr>`
    )
    .join('')

  const subject = `Žemas likutis — ${low.length} prekė(s) pasiekė užsakymo ribą`
  const html = `<!doctype html>
<html lang="lt"><head><meta charset="utf-8"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:24px;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#fff;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:20px 28px;background:#E91E8C;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.85);">Sandėlis · Žemas likutis</div>
    <div style="font-size:20px;font-weight:700;color:#fff;margin-top:4px;">${low.length} prekė(s) pasiekė užsakymo ribą</div>
  </td></tr>
  <tr><td style="padding:20px 28px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th style="padding:6px 8px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B6B6B;">Prekė</th>
        <th style="padding:6px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B6B6B;">Likutis</th>
        <th style="padding:6px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B6B6B;">Riba</th>
        <th style="padding:6px 8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6B6B6B;">Siūloma užsakyti</th>
      </tr>
      ${rows}
    </table>
    <a href="${siteUrl}/admin/sandelis/uzsakyti" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#1A1A1A;color:#fff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">Atidaryti „Ką užsakyti" →</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  const text = `Žemas likutis — ${low.length} prekė(s):\n\n${low
    .map(
      (p) =>
        `${p.colorNumber ? `${p.colorNumber} · ` : ''}${p.nameLt} — likutis ${p.stockQuantity} (riba ${p.reorderPoint}), siūloma užsakyti ${suggested(p)}`
    )
    .join('\n')}\n\n${siteUrl}/admin/sandelis/uzsakyti`

  await sendEmail({ to: adminEmail, subject, html, text })
  return { sent: true, count: low.length }
}

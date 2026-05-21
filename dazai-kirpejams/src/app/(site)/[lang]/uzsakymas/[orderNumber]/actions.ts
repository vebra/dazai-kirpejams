'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildStatusChangeEmail } from '@/lib/email/templates'
import { verifyOrderViewToken } from '@/lib/orders/view-token'

/**
 * Klientui — savitarnos „Siunta gauta" mygtukas užsakymo puslapyje
 * (/uzsakymas/{nr}). Leidžia pačiam pažymėti, kad pakuotė atvyko, nelaukiant
 * admin'o veiksmo.
 *
 * Autorizacija (mažiausiai vienas turi galioti):
 *   1) HMAC žetonas URL'e (?token=...) suriša su konkrečiu order_number
 *   2) Prisijungusio vartotojo el. paštas sutampa su orders.email
 * Be šių patikrinimų bet kas, atspėjęs užsakymo numerį, galėtų falsifikuoti
 * pristatymą.
 *
 * Tik leidžia `shipped → delivered` perėjimą (idempotentiška: jei jau
 * delivered — be triukšmo grįžta į puslapį). Kitiems statusams negalima
 * šokti į delivered iš to paties mygtuko (pvz. neleidžia praleisti
 * apmokėjimo arba paslėpti cancel/refund šios formos paspaudimu).
 */
export async function markOrderReceivedAction(
  formData: FormData
): Promise<void> {
  const orderNumber = (formData.get('order_number') as string | null)?.trim() ?? ''
  const lang = ((formData.get('lang') as string | null) ?? 'lt').trim()
  const token = (formData.get('token') as string | null)?.trim() || null

  if (!orderNumber) {
    redirect(`/${lang}`)
  }

  const orderUrl = `/${lang}/uzsakymas/${orderNumber}${token ? `?token=${encodeURIComponent(token)}` : ''}`

  if (!isSupabaseServerConfigured) {
    redirect(`${orderUrl}&received-error=1`)
  }

  // Autorizacija: bent vienas iš dviejų kelių turi praeiti.
  let authorized = false
  if (token && verifyOrderViewToken(token, orderNumber)) {
    authorized = true
  }

  let userEmail: string | null = null
  if (!authorized) {
    const ssr = await createServerSupabase()
    const {
      data: { user },
    } = await ssr.auth.getUser()
    userEmail = user?.email?.trim().toLowerCase() ?? null
  }

  const admin = createServerClient()
  const { data: order, error: loadErr } = await admin
    .from('orders')
    .select(
      'id, order_number, email, first_name, status, total_cents, vat_cents, tracking_number, tracking_carrier'
    )
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (loadErr || !order) {
    redirect(`${orderUrl}${orderUrl.includes('?') ? '&' : '?'}received-error=1`)
  }

  if (!authorized && userEmail && order.email?.trim().toLowerCase() === userEmail) {
    authorized = true
  }

  if (!authorized) {
    // Tylus redirect be klaidos žinutės — nepatariame atakuotojui, kad
    // užsakymas egzistuoja.
    redirect(`/${lang}`)
  }

  // Idempotencija: jei jau pristatyta, parodom success be DB update'o.
  if (order.status === 'delivered') {
    redirect(`${orderUrl}${orderUrl.includes('?') ? '&' : '?'}received=1`)
  }

  // Saugumas: leidžiame tik shipped → delivered. Kitos transakcijos (pvz.
  // pending → delivered) būtų klaidingos arba klientui apgaulingos.
  if (order.status !== 'shipped') {
    redirect(`${orderUrl}${orderUrl.includes('?') ? '&' : '?'}received-error=1`)
  }

  const { error: updErr } = await admin
    .from('orders')
    .update({
      status: 'delivered',
      payment_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  if (updErr) {
    console.error(
      '[uzsakymas/actions] markOrderReceived update failed:',
      updErr.message
    )
    redirect(`${orderUrl}${orderUrl.includes('?') ? '&' : '?'}received-error=1`)
  }

  // Padėka klientui email'u — tas pats šablonas kaip ir admin'as mato per
  // /admin/uzsakymai (buildStatusChangeEmail su status='delivered').
  // Non-blocking — DB jau atnaujinta, klaida tik konsolėje.
  try {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
      'https://www.dazaikirpejams.lt'
    const payload = buildStatusChangeEmail({
      orderNumber: order.order_number,
      firstName: order.first_name,
      status: 'delivered',
      trackingNumber: order.tracking_number ?? null,
      trackingCarrier: order.tracking_carrier ?? null,
      siteUrl,
    })
    await sendEmail({
      to: order.email,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })
  } catch (err) {
    console.error(
      '[uzsakymas/actions] markOrderReceived email failed (non-blocking):',
      err
    )
  }

  revalidatePath(`/${lang}/uzsakymas/${orderNumber}`)
  revalidatePath('/admin/uzsakymai', 'layout')
  redirect(`${orderUrl}${orderUrl.includes('?') ? '&' : '?'}received=1`)
}

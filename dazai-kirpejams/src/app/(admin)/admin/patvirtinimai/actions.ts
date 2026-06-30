'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildRepOrderDecisionEmail } from '@/lib/email/templates'

/**
 * Pranešimas vadybininkei apie sprendimą (patvirtinta/atmesta). Service-role
 * (kad gautume rep el. paštą iš auth.users). Non-blocking: laiško klaida
 * nenutraukia veiksmo. Atmetimo priežastį skaitom iš orders (RPC ją įrašė).
 */
async function notifyRepDecision(
  orderId: string,
  decision: 'approved' | 'rejected'
): Promise<void> {
  try {
    const sb = createServerClient()
    const { data: o } = await sb
      .from('orders')
      .select('order_number, placed_by, total_cents, rejection_reason, clients(name)')
      .eq('id', orderId)
      .maybeSingle<{
        order_number: string
        placed_by: string | null
        total_cents: number
        rejection_reason: string | null
        clients: { name: string } | null
      }>()
    if (!o?.placed_by) return

    const { data: u } = await sb.auth.admin.getUserById(o.placed_by)
    const email = u?.user?.email
    if (!email) return

    const { data: prof } = await sb
      .from('user_profiles')
      .select('first_name')
      .eq('id', o.placed_by)
      .maybeSingle<{ first_name: string | null }>()

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
      'https://www.dazaikirpejams.lt'

    const payload = buildRepOrderDecisionEmail({
      orderNumber: o.order_number,
      clientName: o.clients?.name ?? '—',
      decision,
      rejectionReason: o.rejection_reason ?? null,
      totalCents: o.total_cents,
      firstName: prof?.first_name ?? '',
      repOrdersUrl: `${siteUrl}/vadybininke/uzsakymai`,
    })
    await sendEmail({ to: email, subject: payload.subject, html: payload.html, text: payload.text })
  } catch (e) {
    console.error('[admin/patvirtinimai] notifyRepDecision failed (non-blocking):', e)
  }
}

/**
 * Vadybininkės užsakymų patvirtinimo Server Action'ai.
 *
 * SVARBU: kviečiam per `createServerSupabase()` (admin SESIJOS klientą), NE per
 * service-role. RPC viduje `is_admin()` tikrina `auth.uid()` — service-role
 * klientui jis būtų NULL → NOT_ADMIN. Sesijos klientui auth.uid() = admin'as.
 *
 * Action'ai GRĄŽINA rezultatą (ne redirect), kad klientas galėtų parodyti
 * klaidą inline (pvz. „sandėlyje per mažai" approve metu) ir refetch'inti.
 */

export type ApprovalResult = { ok: boolean; error?: string }

/** RPC klaidų žinutės → suprantamas LT tekstas admin'ui. */
function humanError(raw: string | undefined): string {
  const msg = raw ?? 'Nežinoma klaida.'
  if (/NOT_ADMIN/.test(msg)) return 'Neturite administratoriaus teisių.'
  if (/NOT_PENDING/.test(msg))
    return 'Užsakymas jau apdorotas (nebėra „laukiantis"). Atnaujinkite sąrašą.'
  if (/ORDER_NOT_FOUND/.test(msg)) return 'Užsakymas nerastas.'
  if (/NO_REP_ON_ORDER/.test(msg))
    return 'Užsakymas neturi priskirtos vadybininkės — negalima nurašyti iš atsargų.'
  // Vadybininkei neužtenka prekių jos atsargose — pirma reikia jai išduoti.
  const repStock = msg.match(/INSUFFICIENT_REP_STOCK.*?name=(.*?) held=(\d+) need=(\d+)/)
  if (repStock)
    return `Vadybininkė turi tik ${repStock[2]} vnt. „${repStock[1].trim()}" (reikia ${repStock[3]}). Pirma išduokite jai trūkstamas prekes arba atmeskite užsakymą.`
  if (/INSUFFICIENT_REP_STOCK/.test(msg))
    return 'Vadybininkei neužtenka prekių atsargose. Pirma išduokite jai trūkstamas prekes arba atmeskite užsakymą.'
  return msg
}

export async function approveRepOrder(orderId: string): Promise<ApprovalResult> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Trūksta užsakymo ID.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('approve_rep_order', { p_order_id: orderId })

  if (error) {
    console.error('[admin/patvirtinimai] approve:', error.message)
    return { ok: false, error: humanError(error.message) }
  }

  await notifyRepDecision(orderId, 'approved')

  revalidatePath('/admin/patvirtinimai')
  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  return { ok: true }
}

export async function approveRepOrderFromWarehouse(
  orderId: string
): Promise<ApprovalResult> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Trūksta užsakymo ID.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('approve_rep_order_from_warehouse', {
    p_order_id: orderId,
  })

  if (error) {
    console.error('[admin/patvirtinimai] approveFromWarehouse:', error.message)
    return { ok: false, error: humanError(error.message) }
  }

  await notifyRepDecision(orderId, 'approved')

  revalidatePath('/admin/patvirtinimai')
  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  return { ok: true }
}

/**
 * Pašalina vieną eilutę iš LAUKIANČIO vadybininkės užsakymo ir perskaičiuoja
 * sumas — kad adminas galėtų patvirtinti likusį užsakymą, kai vienos prekės
 * trūksta (vietoj viso atmetimo). Service-role: order_items keitimas + sumų
 * perskaičiavimas. Paskutinės eilutės pašalinti neleidžiam (tuščias užsakymas
 * neturi prasmės — verčiau atmesti).
 */
export async function removeRepOrderLine(
  orderId: string,
  productId: string
): Promise<ApprovalResult> {
  await requireAdmin()
  if (!orderId || !productId) return { ok: false, error: 'Trūksta duomenų.' }

  const sb = createServerClient()
  const { data: o, error: oErr } = await sb
    .from('orders')
    .select('id, approval_status, subtotal_cents, delivery_cost_cents, vat_cents')
    .eq('id', orderId)
    .maybeSingle<{
      id: string
      approval_status: string | null
      subtotal_cents: number
      delivery_cost_cents: number | null
      vat_cents: number | null
    }>()
  if (oErr || !o) return { ok: false, error: 'Užsakymas nerastas.' }
  if (o.approval_status !== 'pending')
    return { ok: false, error: 'Keisti galima tik laukiantį užsakymą.' }

  const { count } = await sb
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('order_id', orderId)
  if ((count ?? 0) <= 1)
    return {
      ok: false,
      error: 'Tai paskutinė prekė — vietoj šalinimo atmeskite visą užsakymą.',
    }

  const { error: dErr } = await sb
    .from('order_items')
    .delete()
    .eq('order_id', orderId)
    .eq('product_id', productId)
  if (dErr) {
    console.error('[admin/patvirtinimai] removeLine:', dErr.message)
    return { ok: false, error: 'Nepavyko pašalinti prekės.' }
  }

  // Perskaičiuojam iš likusių eilučių (PVM proporcingai, pristatymas nekinta).
  const { data: rest } = await sb
    .from('order_items')
    .select('total_cents')
    .eq('order_id', orderId)
  const newSubtotal = (rest ?? []).reduce((s, r) => s + (r.total_cents ?? 0), 0)
  const shipping = o.delivery_cost_cents ?? 0
  const oldBase = (o.subtotal_cents ?? 0) + shipping
  const rate = oldBase > 0 ? (o.vat_cents ?? 0) / oldBase : 0
  const newVat = Math.round((newSubtotal + shipping) * rate)
  const newTotal = newSubtotal + shipping + newVat

  const { error: uErr } = await sb
    .from('orders')
    .update({
      subtotal_cents: newSubtotal,
      vat_cents: newVat,
      total_cents: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
  if (uErr) {
    console.error('[admin/patvirtinimai] removeLine update:', uErr.message)
    return { ok: false, error: 'Prekė pašalinta, bet nepavyko atnaujinti sumos.' }
  }

  revalidatePath('/admin/patvirtinimai')
  return { ok: true }
}

export async function rejectRepOrder(
  orderId: string,
  reason: string
): Promise<ApprovalResult> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Trūksta užsakymo ID.' }

  const trimmed = (reason ?? '').trim()
  if (trimmed.length === 0)
    return { ok: false, error: 'Nurodykite atmetimo priežastį.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('reject_rep_order', {
    p_order_id: orderId,
    p_reason: trimmed,
  })

  if (error) {
    console.error('[admin/patvirtinimai] reject:', error.message)
    return { ok: false, error: humanError(error.message) }
  }

  await notifyRepDecision(orderId, 'rejected')

  revalidatePath('/admin/patvirtinimai')
  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  return { ok: true }
}

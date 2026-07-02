'use server'

import { revalidatePath } from 'next/cache'
import { requireSalesRep } from '@/lib/rep/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'
import {
  deliveryPriceCents,
  vatRateFromVatCode,
  type DeliveryMethod,
} from '@/lib/commerce/constants'
import { getCompanyInfo, getShippingSettings } from '@/lib/admin/queries'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import { buildRepOrderAdminEmail } from '@/lib/email/templates'
import type { RepClient } from '@/lib/rep/types'

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  )
}

// ───────────────────────── Kliento kūrimas ─────────────────────────

export type CreateClientResult =
  | { ok: true; client: RepClient }
  | { ok: false; error: string }

/**
 * Rep sukuria klientą. Tier/PVM nustatyti negali — DB trigeris forsuoja
 * wholesale_1 + is_vat_payer=false (keičia tik admin). Telefonas privalomas,
 * nes create_rep_order ima v_cli.phone užsakymui.
 */
export async function createRepClient(input: {
  name: string
  phone: string
  email?: string
}): Promise<CreateClientResult> {
  const { user } = await requireSalesRep()

  const name = (input.name ?? '').trim()
  const phone = (input.phone ?? '').trim()
  const email = (input.email ?? '').trim() || null

  if (!name) return { ok: false, error: 'Įveskite kliento pavadinimą.' }
  if (!phone) return { ok: false, error: 'Įveskite telefono numerį.' }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('clients')
    .insert({ name, phone, email, created_by: user.id })
    .select('id, name, phone, email, pricing_tier')
    .single()

  if (error || !data) {
    console.error('[rep/actions] createRepClient:', error?.message)
    return { ok: false, error: 'Nepavyko sukurti kliento. Bandykite dar kartą.' }
  }

  revalidatePath('/vadybininke/klientai')
  return {
    ok: true,
    client: {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      pricingTier: data.pricing_tier,
    },
  }
}

// ───────────────────────── Užsakymo pateikimas ─────────────────────────

export type SubmitOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string }

function humanError(raw: string | undefined): string {
  const m = raw ?? ''
  if (/NO_PRICE_FOR_TIER/.test(m))
    return 'Vienai iš prekių nenustatyta kaina šio kliento grupei. Pašalinkite ją iš krepšelio.'
  if (/CLIENT_NOT_FOUND_OR_FORBIDDEN/.test(m)) return 'Klientas nerastas.'
  if (/EMPTY_CART/.test(m)) return 'Krepšelis tuščias.'
  if (/NOT_SALES_REP/.test(m)) return 'Neturite teisių pateikti užsakymą.'
  if (/INVALID_QUANTITY/.test(m)) return 'Neteisingas prekės kiekis.'
  return 'Nepavyko pateikti užsakymo. Bandykite dar kartą.'
}

export async function submitRepOrder(input: {
  clientId: string
  items: Array<{ product_id: string; quantity: number }>
  deliveryMethod: string
  deliveryAddress?: string
  deliveryCity?: string
  deliveryPostalCode?: string
  paymentMethod: string
  notes?: string
}): Promise<SubmitOrderResult> {
  const { user } = await requireSalesRep()

  if (!input.clientId) return { ok: false, error: 'Pasirinkite klientą.' }
  if (!input.items?.length) return { ok: false, error: 'Pridėkite bent vieną prekę.' }

  const validMethods: DeliveryMethod[] = ['courier', 'parcel_locker', 'pickup']
  if (!validMethods.includes(input.deliveryMethod as DeliveryMethod)) {
    return { ok: false, error: 'Pasirinkite pristatymo būdą.' }
  }

  // Pristatymui (ne atsiėmimui) reikia adreso
  if (input.deliveryMethod !== 'pickup') {
    if (!input.deliveryAddress?.trim() || !input.deliveryCity?.trim()) {
      return { ok: false, error: 'Įveskite pristatymo adresą ir miestą.' }
    }
  }

  // PVM tarifas — tas pats vienas šaltinis kaip viešam checkout'ui: įmonės PVM
  // kodas (shop settings). Nėra kodo (ne PVM mokėtojas) → 0. Užpildžius kodą
  // (tapus PVM mokėtoju) — automatiškai 21%, ir čia, ir viešam sraute.
  const company = await getCompanyInfo().catch(() => null)
  const vatRate = vatRateFromVatCode(company?.vatCode)
  // Pristatymo kainos/riba — iš shop_settings (tas pats šaltinis kaip checkout).
  const shipping = await getShippingSettings()

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('create_rep_order', {
    p_client_id: input.clientId,
    p_items: input.items,
    p_delivery_method: input.deliveryMethod,
    p_delivery_address: input.deliveryAddress?.trim() ?? '',
    p_delivery_city: input.deliveryCity?.trim() ?? '',
    p_delivery_postal_code: input.deliveryPostalCode?.trim() ?? '',
    p_payment_method: input.paymentMethod,
    p_locale: 'lt',
    p_notes: input.notes?.trim() || null,
    p_shipping_base_cents: deliveryPriceCents(
      input.deliveryMethod as DeliveryMethod,
      shipping
    ),
    p_free_shipping_threshold_cents: shipping.freeShippingThresholdCents,
    p_vat_rate: vatRate,
  })

  if (error || !data) {
    console.error('[rep/actions] submitRepOrder:', error?.message)
    return { ok: false, error: humanError(error?.message) }
  }

  const result = data as { order_number: string; total_cents: number }

  // Grynais / kortele — „apmokėta" žymi pats create_rep_order (migr 065).
  // Anksčiau čia darytas update per sesijos klientą nieko nepadarydavo:
  // rep turi tik SELECT policy ant orders, tad RLS tyliai nukirpdavo (0 rows).

  // Pranešimas adminui — naujas užsakymas laukia patvirtinimo. Non-blocking:
  // jei laiškas nepavyks, užsakymas vis tiek sėkmingas.
  try {
    const adminTo = getAdminNotificationEmail()
    if (adminTo) {
      const [{ data: cl }, { data: prof }] = await Promise.all([
        supabase.from('clients').select('name').eq('id', input.clientId).maybeSingle(),
        supabase.from('user_profiles').select('first_name, last_name').eq('id', user.id).maybeSingle(),
      ])
      const repName =
        `${prof?.first_name ?? ''} ${prof?.last_name ?? ''}`.trim() || user.email || 'Vadybininkė'
      const itemCount = input.items.reduce((s, i) => s + (i.quantity || 0), 0)
      const payload = buildRepOrderAdminEmail({
        orderNumber: result.order_number,
        clientName: cl?.name ?? '—',
        repName,
        totalCents: result.total_cents,
        itemCount,
        adminUrl: `${siteUrl()}/admin/patvirtinimai`,
        createdAt: new Date().toISOString(),
      })
      await sendEmail({ to: adminTo, subject: payload.subject, html: payload.html, text: payload.text })
    }
  } catch (e) {
    console.error('[rep/actions] admin notify failed (non-blocking):', e)
  }

  revalidatePath('/vadybininke/uzsakymai')
  return { ok: true, orderNumber: result.order_number }
}

// ============================================
// Atšaukti SAVO laukiantį (pending) užsakymą
// ============================================

export async function cancelMyPendingOrder(
  orderId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireSalesRep()
  if (!orderId) return { ok: false, error: 'Trūksta užsakymo.' }

  const supabase = await createServerSupabase()

  // Auditas B7: apmokėto (grynais/kortele) užsakymo rep atšaukti negali —
  // trynimas paliktų apskaitą be pėdsako. Admin atšaukia per savo srautą,
  // kuris žymi `cancelled` (įrašas lieka), o ne trina. Autoritetinga patikra —
  // pačioje RPC (migr 079); šis pre-check lieka draugiškesnei žinutei.
  const { data: ord } = await supabase
    .from('orders')
    .select('payment_status')
    .eq('id', orderId)
    .maybeSingle()
  if (ord?.payment_status === 'paid') {
    return {
      ok: false,
      error: 'Apmokėto užsakymo atšaukti negalima — kreipkitės į administratorių.',
    }
  }

  const { data, error } = await supabase.rpc('cancel_rep_pending_order', {
    p_order_id: orderId,
  })

  const res = data as { ok?: boolean; reason?: string } | null
  if (error || !res?.ok) {
    const reason = res?.reason
    const msg =
      reason === 'not_pending'
        ? 'Užsakymą galima atšaukti tik kol jis laukia patvirtinimo.'
        : reason === 'paid'
          ? 'Apmokėto užsakymo atšaukti negalima — kreipkitės į administratorių.'
          : reason === 'forbidden'
            ? 'Tai ne jūsų užsakymas.'
            : reason === 'not_found'
              ? 'Užsakymas nerastas.'
              : error?.message ?? 'Nepavyko atšaukti.'
    console.error('[rep/actions] cancelMyPendingOrder:', error?.message ?? reason)
    return { ok: false, error: msg }
  }

  revalidatePath('/vadybininke/uzsakymai')
  return { ok: true }
}

// ============================================
// Išvežimo prekybai prašymas (migr 075) — rep prašo, admin patvirtina
// ============================================

export type IssueRequestResult = { ok: true } | { ok: false; error: string }

export async function submitIssueRequest(input: {
  items: Array<{ product_id: string; qty: number; name: string }>
  note?: string
}): Promise<IssueRequestResult> {
  const { user } = await requireSalesRep()

  const items = (input.items ?? []).filter(
    (i) => i && typeof i.product_id === 'string' && Number.isInteger(i.qty) && i.qty > 0
  )
  if (!items.length) return { ok: false, error: 'Pridėkite bent vieną prekę.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.from('rep_issue_requests').insert({
    rep_id: user.id,
    items,
    note: input.note?.trim() || null,
  })
  if (error) {
    console.error('[rep/actions] submitIssueRequest:', error.message)
    return { ok: false, error: 'Nepavyko pateikti prašymo. Bandykite dar kartą.' }
  }

  // Pranešimas adminui (non-blocking)
  try {
    const adminTo = getAdminNotificationEmail()
    if (adminTo) {
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle()
      const repName =
        `${prof?.first_name ?? ''} ${prof?.last_name ?? ''}`.trim() || user.email || 'Vadybininkė'
      const totalUnits = items.reduce((s, i) => s + i.qty, 0)
      const lines = items.map((i) => `• ${i.name} × ${i.qty}`).join('\n')
      const url = `${siteUrl()}/admin/isvezimo-prasymai`
      await sendEmail({
        to: adminTo,
        subject: `Naujas išvežimo prašymas — ${repName}`,
        html: `<p>${repName} pateikė išvežimo prekybai prašymą (${totalUnits} vnt.).</p><pre style="font-family:inherit">${lines}</pre><p><a href="${url}">Peržiūrėti ir patvirtinti</a></p>`,
        text: `${repName}: ${totalUnits} vnt.\n${lines}\n${url}`,
      })
    }
  } catch (e) {
    console.error('[rep/actions] issue request notify failed (non-blocking):', e)
  }

  revalidatePath('/vadybininke/isvezimas')
  return { ok: true }
}

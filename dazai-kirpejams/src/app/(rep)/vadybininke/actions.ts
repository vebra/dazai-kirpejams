'use server'

import { revalidatePath } from 'next/cache'
import { requireSalesRep } from '@/lib/rep/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'
import {
  DELIVERY_METHODS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  vatRateFromVatCode,
} from '@/lib/commerce/constants'
import { getCompanyInfo } from '@/lib/admin/queries'
import type { RepClient } from '@/lib/rep/types'

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
  await requireSalesRep()

  if (!input.clientId) return { ok: false, error: 'Pasirinkite klientą.' }
  if (!input.items?.length) return { ok: false, error: 'Pridėkite bent vieną prekę.' }

  const dm = DELIVERY_METHODS[input.deliveryMethod as keyof typeof DELIVERY_METHODS]
  if (!dm) return { ok: false, error: 'Pasirinkite pristatymo būdą.' }

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
    p_shipping_base_cents: dm.priceCents,
    p_free_shipping_threshold_cents: FREE_SHIPPING_THRESHOLD_CENTS,
    p_vat_rate: vatRate,
  })

  if (error || !data) {
    console.error('[rep/actions] submitRepOrder:', error?.message)
    return { ok: false, error: humanError(error?.message) }
  }

  revalidatePath('/vadybininke/uzsakymai')
  return { ok: true, orderNumber: (data as { order_number: string }).order_number }
}

'use server'

import { cookies } from 'next/headers'
import {
  calculateOrderTotals,
  meetsMinimumOrder,
  type DeliveryMethod,
  type PaymentMethod,
} from './constants'
import { createServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server'

/**
 * Serializuota užsakymo prekė iš kliento (zustand store snapshot'o).
 */
export type OrderItemInput = {
  productId: string
  name: string
  sku: string | null
  priceCents: number
  quantity: number
}

export type CreateOrderInput = {
  items: OrderItemInput[]
  email: string
  firstName: string
  lastName: string
  phone: string
  isCompany: boolean
  companyName?: string
  companyCode?: string
  vatCode?: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string
  deliveryCity?: string
  deliveryPostalCode?: string
  paymentMethod: PaymentMethod
  notes?: string
  locale: 'lt' | 'en' | 'ru'
}

export type CreateOrderResult =
  | { ok: true; orderNumber: string; redirectTo: string }
  | { ok: false; error: string }

/**
 * Generuojame žmogui draugišką užsakymo numerį formato DK-YYMMDD-XXXX.
 * XXXX — 4 atsitiktiniai skaitmenys. Tikimybė dubliuotis ta pačia diena
 * maža; DB turi unique constraint, tad tikroje aplinkoje retry'intume.
 */
function generateOrderNumber(): string {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `DK-${y}${m}${day}-${rand}`
}

/**
 * Pagrindinis checkout action'as. Priima serializuotus kliento duomenis,
 * patikrina minimalią sumą, paskaičiuoja viską server-side, įrašo į Supabase
 * (jei sukonfigūruota), nustato sausainuką su paskutinio užsakymo snapshot'u
 * (kad confirmation puslapis veiktų net be DB) ir redirect'ina į patvirtinimą.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // Validacija
  if (!input.items.length) {
    return { ok: false, error: 'Krepšelis tuščias.' }
  }
  if (!input.email || !input.firstName || !input.lastName || !input.phone) {
    return { ok: false, error: 'Užpildykite visus privalomus laukus.' }
  }
  if (
    input.deliveryMethod === 'courier' &&
    (!input.deliveryAddress || !input.deliveryCity || !input.deliveryPostalCode)
  ) {
    return { ok: false, error: 'Užpildykite pristatymo adresą.' }
  }
  if (input.deliveryMethod === 'parcel_locker' && !input.deliveryAddress) {
    return { ok: false, error: 'Pasirinkite paštomatą.' }
  }

  // Skaičiavimai server-side (klientu nepasitikime)
  const subtotalCents = input.items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  )

  if (!meetsMinimumOrder(subtotalCents)) {
    return { ok: false, error: 'Nepasiekta minimali užsakymo suma.' }
  }

  const totals = calculateOrderTotals(subtotalCents, input.deliveryMethod)
  const orderNumber = generateOrderNumber()

  // Paysera kol kas nerealizuotas — visada bank_transfer flow
  // (nors UI'uje rodome Paysera variantą). Kai bus keys, keisime čia.
  const effectivePayment: PaymentMethod =
    input.paymentMethod === 'paysera' ? 'bank_transfer' : input.paymentMethod

  // Įrašas į Supabase — jei sukonfigūruota
  if (isSupabaseServerConfigured) {
    try {
      const supabase = createServerClient()
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          email: input.email,
          phone: input.phone,
          first_name: input.firstName,
          last_name: input.lastName,
          company_name: input.isCompany ? input.companyName ?? null : null,
          company_code: input.isCompany ? input.companyCode ?? null : null,
          vat_code: input.isCompany ? input.vatCode ?? null : null,
          delivery_method: input.deliveryMethod,
          delivery_address: input.deliveryAddress ?? null,
          delivery_city: input.deliveryCity ?? null,
          delivery_postal_code: input.deliveryPostalCode ?? null,
          delivery_country: 'LT',
          delivery_cost_cents: totals.shippingCents,
          payment_method: effectivePayment,
          payment_status: 'pending',
          subtotal_cents: totals.subtotalCents,
          vat_cents: totals.vatCents,
          total_cents: totals.totalCents,
          status: 'pending',
          locale: input.locale,
          notes: input.notes ?? null,
        })
        .select('id')
        .single()

      if (orderError || !order) {
        console.error('Order insert error:', orderError)
        return { ok: false, error: 'Nepavyko sukurti užsakymo. Bandykite dar kartą.' }
      }

      const { error: itemsError } = await supabase.from('order_items').insert(
        input.items.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          product_sku: i.sku,
          quantity: i.quantity,
          unit_price_cents: i.priceCents,
          total_cents: i.priceCents * i.quantity,
        }))
      )

      if (itemsError) {
        console.error('Order items insert error:', itemsError)
        // Neatšaukiame užsakymo — duomenys DB; vartotojas pamatys confirmation
      }
    } catch (err) {
      console.error('Order creation failed:', err)
      return { ok: false, error: 'Serverio klaida. Bandykite dar kartą.' }
    }
  }

  // Nustatome sausainuką su užsakymo snapshot'u — leidžia confirmation
  // puslapiui veikti net kai Supabase nėra sukonfigūruotas (dev aplinka).
  // 30 min TTL, tik šiam užsakymo numeriui.
  const cookieStore = await cookies()
  cookieStore.set({
    name: `dk-order-${orderNumber}`,
    value: JSON.stringify({
      orderNumber,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: input.deliveryAddress ?? null,
      deliveryCity: input.deliveryCity ?? null,
      deliveryPostalCode: input.deliveryPostalCode ?? null,
      paymentMethod: effectivePayment,
      items: input.items,
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      createdAt: new Date().toISOString(),
    }),
    maxAge: 60 * 30, // 30 min
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })

  return {
    ok: true,
    orderNumber,
    redirectTo: `/${input.locale}/uzsakymas/${orderNumber}`,
  }
}


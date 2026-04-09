'use server'

import { cookies } from 'next/headers'
import {
  calculateOrderTotals,
  meetsMinimumOrder,
  type DeliveryMethod,
  type PaymentMethod,
} from './constants'
import { createServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import {
  buildCustomerOrderEmail,
  buildAdminOrderEmail,
} from '@/lib/email/templates'

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

  // Užsakymo DB ID — reikalingas admin email'o nuorodai. Lieka null jei
  // Supabase nesukonfigūruotas (dev aplinka).
  let orderDbId: string | null = null

  // Įrašas į Supabase — jei sukonfigūruota.
  //
  // Srautas:
  //   1) RPC `decrement_stock_for_order` — atomiškai validuoja aktyvumą,
  //      likutį ir sumažina stock_quantity (FOR UPDATE lock'ina eilutes).
  //   2) Insert į `orders` ir `order_items`.
  //   3) Jei insert'ai nepavyko — kviečiam `restore_stock_for_order` kaip
  //      kompensacinį veiksmą, kad nepaliktume "pardavę, bet neišsaugoję"
  //      užsakymo.
  if (isSupabaseServerConfigured) {
    const supabase = createServerClient()

    // Paruošiam RPC payload'ą — tik ID ir kiekis
    const stockItems = input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    }))

    // 1) Atominiškai mažinam likučius
    const { error: stockError } = await supabase.rpc(
      'decrement_stock_for_order',
      { items: stockItems }
    )

    if (stockError) {
      // Postgres exception'as iš plpgsql funkcijos — message'as jau LT
      // (pvz. "Nepakanka likučio: Juoda (yra 2, prašoma 5)")
      console.error('Stock decrement error:', stockError)
      return {
        ok: false,
        error: stockError.message || 'Nepakanka likučio. Pabandykite vėliau.',
      }
    }

    // 2) Insert'as į orders
    try {
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
        // Rollback'inam likučius
        await supabase.rpc('restore_stock_for_order', { items: stockItems })
        return {
          ok: false,
          error: 'Nepavyko sukurti užsakymo. Bandykite dar kartą.',
        }
      }

      // 3) Insert'as į order_items
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
        // Rollback'inam ir užsakymą, ir likučius
        await supabase.from('orders').delete().eq('id', order.id)
        await supabase.rpc('restore_stock_for_order', { items: stockItems })
        return {
          ok: false,
          error: 'Nepavyko išsaugoti prekių. Bandykite dar kartą.',
        }
      }

      orderDbId = order.id
    } catch (err) {
      console.error('Order creation failed:', err)
      // Bandom rollback'inti likučius
      await supabase
        .rpc('restore_stock_for_order', { items: stockItems })
        .then(() => {}, () => {})
      return { ok: false, error: 'Serverio klaida. Bandykite dar kartą.' }
    }
  }

  // ============================================
  // Email notifikacijos — klientui ir adminui
  // ============================================
  //
  // Siunčiam PO sėkmingo DB įrašo. Email'o klaidos NEIŠMETA viso flow'o —
  // užsakymas jau sukurtas, klientas mato confirmation puslapį, o mes
  // log'inam klaidą ir paliekam adminui ranka susiekti.
  //
  // `Promise.all` — abu email'us siunčiam paraleliai, kad nelaikytume
  // vartotojo laukimo ilgiau nei reikia.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  const createdAtIso = new Date().toISOString()

  try {
    const customerEmailPayload = buildCustomerOrderEmail({
      orderNumber,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: input.deliveryAddress ?? null,
      deliveryCity: input.deliveryCity ?? null,
      deliveryPostalCode: input.deliveryPostalCode ?? null,
      paymentMethod: effectivePayment,
      items: input.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceCents: i.priceCents,
      })),
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      createdAt: createdAtIso,
      siteUrl,
    })

    const adminEmailAddress = getAdminNotificationEmail()
    const adminEmailPayload = adminEmailAddress
      ? buildAdminOrderEmail({
          orderNumber,
          orderId: orderDbId ?? '',
          customerName:
            `${input.firstName} ${input.lastName}`.trim() || input.email,
          customerEmail: input.email,
          customerPhone: input.phone,
          isB2b: input.isCompany,
          companyName: input.isCompany ? input.companyName ?? null : null,
          totalCents: totals.totalCents,
          itemCount: input.items.reduce((sum, i) => sum + i.quantity, 0),
          paymentMethod: effectivePayment,
          deliveryMethod: input.deliveryMethod,
          adminUrl: orderDbId
            ? `${siteUrl}/admin/uzsakymai/${orderDbId}`
            : `${siteUrl}/admin/uzsakymai`,
          createdAt: createdAtIso,
        })
      : null

    await Promise.all([
      sendEmail({
        to: input.email,
        subject: customerEmailPayload.subject,
        html: customerEmailPayload.html,
        text: customerEmailPayload.text,
      }),
      adminEmailPayload && adminEmailAddress
        ? sendEmail({
            to: adminEmailAddress,
            subject: adminEmailPayload.subject,
            html: adminEmailPayload.html,
            text: adminEmailPayload.text,
            replyTo: input.email,
          })
        : Promise.resolve(),
    ])
  } catch (emailErr) {
    console.error('[order] Email sending failed (non-blocking):', emailErr)
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


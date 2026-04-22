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
import { getCompanyInfo } from '@/lib/admin/queries'
import { getDictionary } from '@/i18n/dictionaries'
import { sendMetaCapiEvent } from '@/lib/analytics-capi'

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
  // Neprivaloma — jei klientas įvedė kupono kodą, mes jį iš naujo
  // validuojam server-side ir taikom atomiškai PRIEŠ užsakymo įrašą.
  discountCode?: string
}

export type CreateOrderResult =
  | { ok: true; orderNumber: string; redirectTo: string }
  | { ok: false; error: string }

/**
 * Generuojame žmogui draugišką užsakymo numerį formato DK-YYMMDD-XXXXXX.
 * XXXXXX — 6 atsitiktinių skaitmenų (100k–999k), sumažinant kolizijų
 * tikimybę iki ~0.06% net prie 1000 užsakymų per dieną.
 */
function generateOrderNumber(): string {
  const d = new Date()
  const y = String(d.getFullYear()).slice(2)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.floor(100000 + Math.random() * 900000)
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
  const errs = (await getDictionary(input.locale)).checkout.errors

  // Validacija
  if (!input.items.length) {
    return { ok: false, error: errs.cartEmpty }
  }
  if (!input.email || !input.firstName || !input.lastName || !input.phone) {
    return { ok: false, error: errs.missingFields }
  }
  if (
    input.deliveryMethod === 'courier' &&
    (!input.deliveryAddress || !input.deliveryCity || !input.deliveryPostalCode)
  ) {
    return { ok: false, error: errs.missingAddress }
  }
  if (input.deliveryMethod === 'parcel_locker' && !input.deliveryAddress) {
    return { ok: false, error: errs.missingParcelLocker }
  }

  // Skaičiavimai server-side (klientu nepasitikime)
  const subtotalCents = input.items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  )

  if (!meetsMinimumOrder(subtotalCents)) {
    return { ok: false, error: errs.minOrderNotMet }
  }

  let orderNumber = generateOrderNumber()

  // Paysera kol kas nerealizuotas — visada bank_transfer flow
  // (nors UI'uje rodome Paysera variantą). Kai bus keys, keisime čia.
  const effectivePayment: PaymentMethod =
    input.paymentMethod === 'paysera' ? 'bank_transfer' : input.paymentMethod

  // Užsakymo DB ID — reikalingas admin email'o nuorodai. Lieka null jei
  // Supabase nesukonfigūruotas (dev aplinka).
  let orderDbId: string | null = null

  // Kupono būsena — užpildoma žemiau, jei klientas pateikė kodą ir jis
  // sėkmingai praėjo `apply_discount_code`. `appliedDiscountCode` reikalingas
  // rollback'ui (jei order insert nepavyks po sėkmingo apply).
  let discountCents = 0
  let appliedDiscountCode: string | null = null
  const normalizedInputCode = input.discountCode?.trim().toUpperCase() ?? ''

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

    // 1) Nuolaidos kodas — pirmas, nes pigiausias rollback'as
    //
    // Kviečiam `apply_discount_code` RPC'ą, kuris:
    //   - atomiškai (FOR UPDATE) iš naujo validuoja kodą
    //   - inkrementuoja `used_count`
    //   - grąžina tikrą `discount_cents` (perskaičiuotą server-side)
    //
    // Jei klientas manė, kad nuolaida vienokia, o serveryje paaiškėjo kitokia
    // (pvz. tarp request'ų buvo išjungtas kuponas), pasirenkam server'io
    // tiesą. Jei kuponas atmestas — grąžinam klaidą ir user'is gauna kita
    // dar nekeistų duomenų būseną.
    if (normalizedInputCode) {
      const { data: discountResult, error: discountError } = await supabase.rpc(
        'apply_discount_code',
        {
          p_code: normalizedInputCode,
          p_cart_subtotal_cents: subtotalCents,
        }
      )

      if (discountError) {
        console.error('[order] apply_discount_code error:', discountError)
        return {
          ok: false,
          error: errs.couponApplyFailed,
        }
      }

      const dr = discountResult as {
        ok?: boolean
        reason?: string
        code?: string
        discount_cents?: number
        min_order_cents?: number
      } | null

      if (!dr || !dr.ok) {
        const reasonMap: Record<string, string> = {
          not_found: errs.couponNotFound,
          inactive: errs.couponInactive,
          too_early: errs.couponTooEarly,
          expired: errs.couponExpired,
          max_uses_reached: errs.couponMaxUses,
          min_order_not_met: dr?.min_order_cents
            ? errs.couponMinOrder.replace(
                '{amount}',
                (dr.min_order_cents / 100).toFixed(2).replace('.', ',')
              )
            : errs.couponMinOrderGeneric,
        }
        return {
          ok: false,
          error: reasonMap[dr?.reason ?? ''] ?? errs.couponGeneric,
        }
      }

      discountCents = dr.discount_cents ?? 0
      appliedDiscountCode = dr.code ?? normalizedInputCode
    }

    // 2) Atominiškai mažinam likučius
    const stockItems = input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    }))

    const { error: stockError } = await supabase.rpc(
      'decrement_stock_for_order',
      { items: stockItems }
    )

    if (stockError) {
      // Postgres exception'as iš plpgsql funkcijos — message'as jau LT
      // (pvz. "Nepakanka likučio: Juoda (yra 2, prašoma 5)")
      console.error('Stock decrement error:', stockError)
      // Rollback'inam kuponą, jei jį jau pritaikėm
      if (appliedDiscountCode) {
        await supabase
          .rpc('revert_discount_code', { p_code: appliedDiscountCode })
          .then(() => {}, () => {})
      }
      return {
        ok: false,
        error: stockError.message || errs.stockShortageGeneric,
      }
    }

    // 3) Skaičiuojam galutinius totals SU nuolaida — serveris yra tiesos
    //    šaltinis.
    const computedTotals = calculateOrderTotals(
      subtotalCents,
      input.deliveryMethod,
      discountCents
    )

    // 4) Insert'as į orders — su retry dėl order_number kolizijų
    //    (unique constraint). Pergeneruojam numerį ir bandome dar kartą.
    const ORDER_INSERT_RETRIES = 3
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: { id: string } | null = null

    try {
      for (let attempt = 0; attempt < ORDER_INSERT_RETRIES; attempt++) {
        const { data, error: orderError } = await supabase
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
            delivery_cost_cents: computedTotals.shippingCents,
            payment_method: effectivePayment,
            payment_status: 'pending',
            subtotal_cents: computedTotals.subtotalCents,
            discount_code: appliedDiscountCode,
            discount_cents: computedTotals.discountCents,
            vat_cents: computedTotals.vatCents,
            total_cents: computedTotals.totalCents,
            status: 'pending',
            locale: input.locale,
            notes: input.notes ?? null,
          })
          .select('id')
          .single()

        if (!orderError && data) {
          order = data
          break
        }

        // Unique violation (23505) — retry su nauju numeriu
        if (orderError?.code === '23505' && attempt < ORDER_INSERT_RETRIES - 1) {
          orderNumber = generateOrderNumber()
          continue
        }

        console.error('Order insert error:', orderError)
        // Rollback'inam likučius + kuponą
        await supabase.rpc('restore_stock_for_order', { items: stockItems })
        if (appliedDiscountCode) {
          await supabase
            .rpc('revert_discount_code', { p_code: appliedDiscountCode })
            .then(() => {}, () => {})
        }
        return {
          ok: false,
          error: errs.orderCreateFailed,
        }
      }

      // Jei po visų bandymų order vis dar null — neturėtų nutikti,
      // nes paskutinis attempt'as grąžina klaidą, bet dėl saugumo:
      if (!order) {
        await supabase.rpc('restore_stock_for_order', { items: stockItems })
        if (appliedDiscountCode) {
          await supabase
            .rpc('revert_discount_code', { p_code: appliedDiscountCode })
            .then(() => {}, () => {})
        }
        return {
          ok: false,
          error: errs.orderCreateFailed,
        }
      }

      // 5) Insert'as į order_items
      const { error: itemsError } = await supabase.from('order_items').insert(
        input.items.map((i) => ({
          order_id: order!.id,
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
        // Rollback'inam: užsakymą, likučius, kuponą
        await supabase.from('orders').delete().eq('id', order!.id)
        await supabase.rpc('restore_stock_for_order', { items: stockItems })
        if (appliedDiscountCode) {
          await supabase
            .rpc('revert_discount_code', { p_code: appliedDiscountCode })
            .then(() => {}, () => {})
        }
        return {
          ok: false,
          error: errs.itemsSaveFailed,
        }
      }

      orderDbId = order!.id
    } catch (err) {
      console.error('Order creation failed:', err)
      // Bandom rollback'inti viską
      await supabase
        .rpc('restore_stock_for_order', { items: stockItems })
        .then(() => {}, () => {})
      if (appliedDiscountCode) {
        await supabase
          .rpc('revert_discount_code', { p_code: appliedDiscountCode })
          .then(() => {}, () => {})
      }
      return { ok: false, error: errs.serverError }
    }
  }

  // Server-side tiesa — totals perskaičiuojam, net jei Supabase'o nėra
  // (dev aplinka be DB'o). Šie skaičiai eina į email'us ir cookie snapshot.
  const totals = calculateOrderTotals(
    subtotalCents,
    input.deliveryMethod,
    discountCents
  )

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
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'
  const createdAtIso = new Date().toISOString()

  // Įmonės rekvizitai iš Nustatymų — tiesos šaltinis banko pavedimo blokui.
  // Jei DB nesukonfigūruota arba laukai tušti, template graceful'iai neparodys
  // banko duomenų (vartotojui bus pranešta, kad instrukcijos ateis atskiru
  // laišku).
  let companyInfo: Awaited<ReturnType<typeof getCompanyInfo>> | null = null
  if (isSupabaseServerConfigured) {
    try {
      companyInfo = await getCompanyInfo()
    } catch (err) {
      console.error('[order] getCompanyInfo failed (non-blocking):', err)
    }
  }

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
      discountCode: appliedDiscountCode,
      discountCents: totals.discountCents,
      shippingCents: totals.shippingCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      createdAt: createdAtIso,
      siteUrl,
      company: companyInfo
        ? {
            legalName: companyInfo.legalName,
            address: companyInfo.address,
            email: companyInfo.email,
            phone: companyInfo.phone,
            bankRecipient: companyInfo.bankRecipient,
            bankIban: companyInfo.bankIban,
            bankName: companyInfo.bankName,
          }
        : undefined,
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

  // ============================================
  // Meta CAPI Purchase event (server-side)
  // ============================================
  //
  // event_id = orderNumber — tas pats ID naudojamas ir client Pixel'yje
  // (trackPurchase), todėl Meta dedupe'ina abu signalus per 48h.
  // CAPI padengia iOS 14.5+, Safari ITP ir ad-blocker'ių prarastus event'us.
  await sendMetaCapiEvent({
    eventName: 'Purchase',
    eventId: orderNumber,
    userData: {
      email: input.email,
      phone: input.phone,
      firstName: input.firstName,
      lastName: input.lastName,
      city: input.deliveryCity,
      postalCode: input.deliveryPostalCode,
      country: 'lt',
    },
    customData: {
      currency: 'EUR',
      value: totals.totalCents / 100,
      content_ids: input.items.map((i) => i.productId),
      content_type: 'product',
      contents: input.items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.priceCents / 100,
      })),
      num_items: input.items.reduce((sum, i) => sum + i.quantity, 0),
      order_id: orderNumber,
    },
  })

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
      discountCode: appliedDiscountCode,
      discountCents: totals.discountCents,
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


'use server'

import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import {
  calculateOrderTotals,
  meetsMinimumOrder,
  vatRateFromVatCode,
  deliveryPriceCents,
  type DeliveryMethod,
  type PaymentMethod,
} from './constants'
import { createServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import {
  buildCustomerOrderEmail,
  buildAdminOrderEmail,
} from '@/lib/email/templates'
import { getCompanyInfo, getShippingSettings } from '@/lib/admin/queries'
import { getDictionary } from '@/i18n/dictionaries'
import { sendMetaCapiEvent } from '@/lib/analytics-capi'
import { createOrderViewToken } from '@/lib/orders/view-token'

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
  input: CreateOrderInput,
  // Admino sukurtam užsakymui (telefonu/el. paštu) NEsiunčiam Meta CAPI
  // „Purchase" evento — tai ne web konversija, kitaip terštų reklamos duomenis.
  opts?: { skipAnalytics?: boolean }
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

  // Skaičiavimai server-side (klientu nepasitikime). Kainos/ribos — iš
  // shop_settings DB (admin → Kainos); klaidos atveju funkcija grąžina
  // kodo fallback'us, tad checkout'as niekada neužstringa.
  const shippingSettings = await getShippingSettings()

  const subtotalCents = input.items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  )

  if (!meetsMinimumOrder(subtotalCents, shippingSettings.minOrderCents)) {
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

  // Įmonės rekvizitai — tiesos šaltinis ir PVM statusui, ir el. laiško
  // banko blokui. Paimam VIENĄ kartą čia (anksčiau buvo fetch'inama vėliau
  // tik email'ui). Jei DB nesukonfigūruota arba `company_vat_code` tuščias —
  // įmonė laikoma ne PVM mokėtoja, todėl `vatRate` = 0 ir PVM neišskiriamas.
  let companyInfo: Awaited<ReturnType<typeof getCompanyInfo>> | null = null
  if (isSupabaseServerConfigured) {
    try {
      companyInfo = await getCompanyInfo()
    } catch (err) {
      console.error('[order] getCompanyInfo failed (non-blocking):', err)
    }
  }
  const vatRate = vatRateFromVatCode(companyInfo?.vatCode)

  // Komercinės reikšmės perduodamos į RPC — vienas tiesos šaltinis (shop_settings).
  const shippingBaseCents = deliveryPriceCents(
    input.deliveryMethod,
    shippingSettings
  )

  // ============================================
  // Atominis užsakymo kūrimas — VIENAS RPC, VIENA transakcija.
  // discount + stock + orders + order_items vyksta `create_order_atomic`
  // plpgsql funkcijoje; bet kokia klaida → pilnas DB rollback'as. Jokios
  // JS kompensacijos (anksčiau „best-effort" rollback'as galėjo pats
  // nepavykti ir palikti nenuoseklią būseną). order_number kolizijos
  // atveju (23505) pergeneruojam numerį ir bandom dar kartą — kiekvienas
  // bandymas atomiškai rollback'inasi, todėl dublikatų nelieka.
  // ============================================
  if (isSupabaseServerConfigured) {
    const supabase = createServerClient()
    const ATTEMPTS = 3
    let created: {
      orderId: string
      discountCents: number
      discountCode: string | null
    } | null = null

    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const { data, error } = await supabase.rpc('create_order_atomic', {
        p_order_number: orderNumber,
        p_items: input.items.map((i) => ({
          product_id: i.productId,
          name: i.name,
          sku: i.sku,
          unit_price_cents: i.priceCents,
          quantity: i.quantity,
        })),
        p_email: input.email,
        p_phone: input.phone,
        p_first_name: input.firstName,
        p_last_name: input.lastName,
        p_company_name: input.isCompany ? input.companyName ?? null : null,
        p_company_code: input.isCompany ? input.companyCode ?? null : null,
        p_vat_code: input.isCompany ? input.vatCode ?? null : null,
        p_delivery_method: input.deliveryMethod,
        p_delivery_address: input.deliveryAddress ?? null,
        p_delivery_city: input.deliveryCity ?? null,
        p_delivery_postal_code: input.deliveryPostalCode ?? null,
        p_payment_method: effectivePayment,
        p_locale: input.locale,
        p_notes: input.notes ?? null,
        p_discount_code: normalizedInputCode || null,
        p_shipping_base_cents: shippingBaseCents,
        p_free_shipping_threshold_cents:
          shippingSettings.freeShippingThresholdCents,
        p_vat_rate: vatRate,
      })

      if (error) {
        // 23505 = order_number unique violation → naujas numeris, retry.
        if (error.code === '23505' && attempt < ATTEMPTS - 1) {
          orderNumber = generateOrderNumber()
          continue
        }
        // Likučio trūkumas / produktas neaktyvus ir kt. plpgsql RAISE —
        // message jau LT (pvz. "Nepakanka likučio: Juoda (yra 2, prašoma 5)").
        // Visa transakcija jau rollback'inta DB pusėje.
        console.error('[order] create_order_atomic error:', error)
        return {
          ok: false,
          error: error.message || errs.stockShortageGeneric,
        }
      }

      const res = data as {
        ok?: boolean
        reason?: string
        min_order_cents?: number | null
        order_id?: string
        discount_cents?: number
        discount_code?: string | null
      } | null

      if (!res || !res.ok) {
        const reason = res?.reason ?? ''
        if (reason === 'empty_cart') {
          return { ok: false, error: errs.cartEmpty }
        }
        // RPC (065) kainas ima iš DB: nesutampanti kliento suma arba
        // nebeaktyvi prekė — krepšelis pasenęs, prašom atsinaujinti.
        if (reason === 'price_mismatch') {
          return { ok: false, error: errs.priceMismatch }
        }
        if (reason === 'product_unavailable') {
          return { ok: false, error: errs.productUnavailable }
        }
        const reasonMap: Record<string, string> = {
          not_found: errs.couponNotFound,
          inactive: errs.couponInactive,
          too_early: errs.couponTooEarly,
          expired: errs.couponExpired,
          max_uses_reached: errs.couponMaxUses,
          min_order_not_met: res?.min_order_cents
            ? errs.couponMinOrder.replace(
                '{amount}',
                (res.min_order_cents / 100).toFixed(2).replace('.', ',')
              )
            : errs.couponMinOrderGeneric,
        }
        return {
          ok: false,
          error: reasonMap[reason] ?? errs.couponGeneric,
        }
      }

      created = {
        orderId: res.order_id ?? '',
        discountCents: res.discount_cents ?? 0,
        discountCode: res.discount_code ?? null,
      }
      break
    }

    if (!created) {
      return { ok: false, error: errs.orderCreateFailed }
    }

    orderDbId = created.orderId
    discountCents = created.discountCents
    appliedDiscountCode = created.discountCode
  }

  // Server-side tiesa — totals perskaičiuojam, net jei Supabase'o nėra
  // (dev aplinka be DB'o). Šie skaičiai eina į email'us ir cookie snapshot.
  const totals = calculateOrderTotals(
    subtotalCents,
    input.deliveryMethod,
    discountCents,
    vatRate,
    shippingSettings
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

  // Įrašom pristatymo pasirinkimą į user_profiles.last_delivery_data, kad
  // kitam užsakymui pre-fill'intų tuos pačius laukus (nuolatinis klientas
  // nuolat užsako į tą patį paštomatą / adresą — sutaupom rankų darbą).
  // Best-effort: klaida nesustabdo srauto (DB klaidos, neprisijungusi
  // sesija dėl edge case'o — viskas tylėdama praeina).
  if (isSupabaseServerConfigured && orderDbId) {
    try {
      const ssr = await createServerSupabase()
      const {
        data: { user },
      } = await ssr.auth.getUser()
      if (user) {
        const admin = createServerClient()
        await admin
          .from('user_profiles')
          .update({
            last_delivery_data: {
              method: input.deliveryMethod,
              address: input.deliveryAddress ?? null,
              city: input.deliveryCity ?? null,
              postalCode: input.deliveryPostalCode ?? null,
              parcelLocker:
                input.deliveryMethod === 'parcel_locker'
                  ? input.deliveryAddress ?? null
                  : null,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }
    } catch (err) {
      console.error(
        '[order-actions] last_delivery_data update failed (non-blocking):',
        err
      )
    }
  }

  // Magic-link žetonas, kad klientas galėtų grįžti į patvirtinimo puslapį
  // iš bet kurio įrenginio be prisijungimo (30 d. galiojimas). Jei
  // SERVICE_ROLE_KEY nesukonfigūruotas — `createOrderViewToken` grąžina
  // null, ir email'as siunčiamas be mygtuko (graceful degradation).
  const viewToken = createOrderViewToken(orderNumber)
  const viewOrderUrl = viewToken
    ? `${siteUrl}/uzsakymas/${orderNumber}?token=${encodeURIComponent(viewToken)}`
    : null

  // `companyInfo` jau paimtas viršuje (PVM statusui) — tas pats objektas
  // naudojamas el. laiško banko pavedimo blokui. Jei DB nesukonfigūruota
  // arba laukai tušti, template graceful'iai neparodys banko duomenų.

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
      viewOrderUrl,
      lang: input.locale,
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
    // Užsakymas jau įrašytas — klientas liks be patvirtinimo laiško, o
    // adminas be pranešimo apie naują užsakymą. Turim apie tai sužinoti.
    Sentry.captureException(emailErr, {
      tags: { area: 'checkout-email' },
      extra: { orderNumber },
    })
  }

  // ============================================
  // Meta CAPI Purchase event (server-side)
  // ============================================
  //
  // event_id = orderNumber — tas pats ID naudojamas ir client Pixel'yje
  // (trackPurchase), todėl Meta dedupe'ina abu signalus per 48h.
  // CAPI padengia iOS 14.5+, Safari ITP ir ad-blocker'ių prarastus event'us.
  //
  // SVARBU: užsakymas jau įrašytas ir likutis sumažintas. Jei CAPI mes
  // klaidą NEAPGAUBTAS — visa funkcija krenta PO commit'o, klientas mato
  // klaidą, krepšelis neišvalomas, ir pakartotinis bandymas sukuria
  // dublikatą. Todėl, kaip ir el. laiškai, tai non-blocking.
  if (!opts?.skipAnalytics) try {
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
  } catch (capiErr) {
    console.error('[order] Meta CAPI failed (non-blocking):', capiErr)
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


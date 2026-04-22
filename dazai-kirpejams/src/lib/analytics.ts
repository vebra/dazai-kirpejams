/**
 * Centralizuotas analytics entry point. UI komponentai kviečia TIK šias
 * semantines funkcijas — tiesiogiai `fbq()` ar `gtag()` nenaudoti niekur
 * kitur projekte.
 *
 * Kiekviena `track*` funkcija:
 *  1. patikrina `canTrack()` (consent + env flag)
 *  2. suformuoja Meta + GA4 payload'us su jiems tinkamais raktais
 *  3. paralelę siunčia abu kanalus per `safeCall`
 *
 * Meta naudoja big-camel event names (ViewContent, AddToCart),
 * GA4 — snake_case (view_item, add_to_cart). Čia daromas mapping'as.
 */

import { metaTrack, metaTrackCustom } from './analytics-meta'
import { ga4Event, ga4PageView } from './analytics-ga4'
import { canTrack, dedupeOncePerSession } from './analytics-utils'
import type {
  AddToCartPayload,
  BeginCheckoutPayload,
  CalculatorContext,
  CheckoutItem,
  ContactClickContext,
  LeadPayload,
  LoginContext,
  PriceUnlockContext,
  PriceViewPayload,
  PurchasePayload,
  RegistrationContext,
  SubscribePayload,
  ViewCartPayload,
  ViewContentPayload,
} from './analytics-types'

// ──────────────────────────────────────────────────────────────────
//  Pagalbinės — item'ų mapping'as į Meta ir GA4 formas
// ──────────────────────────────────────────────────────────────────

function metaItemsFromCheckout(items: CheckoutItem[]) {
  return {
    content_ids: items.map((i) => i.productId),
    contents: items.map((i) => ({
      id: i.productId,
      quantity: i.quantity,
      item_price: i.price,
    })),
    content_type: 'product',
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
  }
}

function ga4ItemsFromCheckout(items: CheckoutItem[]) {
  return items.map((i) => ({
    item_id: i.productId,
    item_name: i.name,
    item_category: i.category,
    price: i.price,
    quantity: i.quantity,
    // pack_size ir kiti custom parametrai — atskiri GA4 laukai
    pack_size: i.packSize,
  }))
}

// ──────────────────────────────────────────────────────────────────
//  PageView — kviečiama iš RouteTracker kiekvieno route change'o metu
// ──────────────────────────────────────────────────────────────────

export function trackPageView(path: string): void {
  if (!canTrack()) return
  metaTrack('PageView')
  ga4PageView(path)
}

// ──────────────────────────────────────────────────────────────────
//  Produkto peržiūra
// ──────────────────────────────────────────────────────────────────

export function trackViewContent(payload: ViewContentPayload): void {
  if (!canTrack()) return

  metaTrack('ViewContent', {
    content_ids: [payload.productId],
    content_name: payload.name,
    content_category: payload.category,
    content_type: 'product',
    value: payload.price,
    currency: payload.currency,
    // custom parametrai — Meta leis juos naudoti Custom Audiences'uose
    locale: payload.locale,
    user_type: payload.userType,
    pack_size: payload.packSize,
  })

  ga4Event('view_item', {
    currency: payload.currency,
    value: payload.price,
    items: [
      {
        item_id: payload.productId,
        item_name: payload.name,
        item_category: payload.category,
        price: payload.price,
        quantity: 1,
        pack_size: payload.packSize,
      },
    ],
    locale: payload.locale,
    user_type: payload.userType,
  })
}

/**
 * Kai profesionalas pamato realią kainą (po login + approval). Dedupe per
 * sesiją per produktą — kad refresh'ai ir navigacijos atgal nepumpuotų
 * to paties signalo.
 */
export function trackPriceView(payload: PriceViewPayload): void {
  if (!canTrack()) return
  if (!dedupeOncePerSession(`price-view-${payload.productId}`)) return

  metaTrackCustom('PriceView', {
    content_ids: [payload.productId],
    content_name: payload.name,
    content_category: payload.category,
    value: payload.price,
    currency: payload.currency,
    locale: payload.locale,
    pack_size: payload.packSize,
  })

  ga4Event('price_view', {
    currency: payload.currency,
    value: payload.price,
    item_id: payload.productId,
    item_name: payload.name,
    item_category: payload.category,
    locale: payload.locale,
    pack_size: payload.packSize,
  })
}

export function trackPriceUnlockClick(context: PriceUnlockContext): void {
  if (!canTrack()) return

  metaTrackCustom('PriceUnlockClick', {
    content_ids: context.productId ? [context.productId] : undefined,
    content_category: context.category,
    source: context.source,
    locale: context.locale,
  })

  ga4Event('price_unlock_click', {
    item_id: context.productId,
    item_category: context.category,
    source: context.source,
    locale: context.locale,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Krepšelis
// ──────────────────────────────────────────────────────────────────

export function trackAddToCart(payload: AddToCartPayload): void {
  if (!canTrack()) return

  const value = payload.price * payload.quantity

  metaTrack('AddToCart', {
    content_ids: [payload.productId],
    content_name: payload.name,
    content_category: payload.category,
    content_type: 'product',
    contents: [
      {
        id: payload.productId,
        quantity: payload.quantity,
        item_price: payload.price,
      },
    ],
    value,
    currency: payload.currency,
    locale: payload.locale,
    user_type: payload.userType,
    pack_size: payload.packSize,
  })

  ga4Event('add_to_cart', {
    currency: payload.currency,
    value,
    items: [
      {
        item_id: payload.productId,
        item_name: payload.name,
        item_category: payload.category,
        price: payload.price,
        quantity: payload.quantity,
        pack_size: payload.packSize,
      },
    ],
    locale: payload.locale,
    user_type: payload.userType,
  })
}

export function trackViewCart(payload: ViewCartPayload): void {
  if (!canTrack()) return

  // Meta neturi ViewCart standard event'o — naudojam ViewContent su cart items.
  // GA4 turi `view_cart` — jis optimalus.
  metaTrackCustom('ViewCart', {
    ...metaItemsFromCheckout(payload.items),
    value: payload.value,
    currency: payload.currency,
    locale: payload.locale,
    user_type: payload.userType,
  })

  ga4Event('view_cart', {
    currency: payload.currency,
    value: payload.value,
    items: ga4ItemsFromCheckout(payload.items),
    locale: payload.locale,
    user_type: payload.userType,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Checkout + Purchase
// ──────────────────────────────────────────────────────────────────

/**
 * Vienintelė vieta, kur fire'inasi InitiateCheckout. Kviečiama iš krepšelio
 * mygtuko „Tęsti atsiskaitymą" — NE iš CheckoutForm mount'o, kad nebūtų
 * dubliavimo.
 */
export function trackBeginCheckout(payload: BeginCheckoutPayload): void {
  if (!canTrack()) return

  metaTrack('InitiateCheckout', {
    ...metaItemsFromCheckout(payload.items),
    value: payload.value,
    currency: payload.currency,
    locale: payload.locale,
    user_type: payload.userType,
  })

  ga4Event('begin_checkout', {
    currency: payload.currency,
    value: payload.value,
    items: ga4ItemsFromCheckout(payload.items),
    locale: payload.locale,
    user_type: payload.userType,
  })
}

/**
 * Purchase fire'inamas TIK sėkmingo užsakymo success puslapyje, su
 * dedupe apsauga per `orderNumber` — refresh'as / back / tiesioginis URL
 * užsuko nedubliuos event'o.
 *
 * `orderNumber` naudojamas ir kaip Pixel↔CAPI `eventID` — server'io
 * siunčiamas Purchase CAPI event'as gauna tą patį ID, Meta juos match'ina.
 */
export function trackPurchase(payload: PurchasePayload): void {
  if (!canTrack()) return
  if (!dedupeOncePerSession(`tracked_order_${payload.orderNumber}`)) return

  metaTrack(
    'Purchase',
    {
      ...metaItemsFromCheckout(payload.items),
      value: payload.value,
      currency: payload.currency,
      order_id: payload.orderNumber,
      locale: payload.locale,
      user_type: payload.userType,
    },
    payload.orderNumber
  )

  ga4Event('purchase', {
    transaction_id: payload.orderNumber,
    currency: payload.currency,
    value: payload.value,
    shipping: payload.shipping,
    tax: payload.tax,
    items: ga4ItemsFromCheckout(payload.items),
    locale: payload.locale,
    user_type: payload.userType,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Lead'ai (B2B + kontaktų forma)
// ──────────────────────────────────────────────────────────────────

export function trackLead(payload: LeadPayload): void {
  if (!canTrack()) return

  metaTrack(
    'Lead',
    {
      lead_type: payload.leadType,
      locale: payload.locale,
      user_type: payload.userType,
    },
    payload.eventId
  )

  ga4Event('generate_lead', {
    lead_type: payload.leadType,
    locale: payload.locale,
    user_type: payload.userType,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Auth — registracija + login
// ──────────────────────────────────────────────────────────────────

export function trackCompleteRegistration(context: RegistrationContext): void {
  if (!canTrack()) return

  metaTrack('CompleteRegistration', {
    business_type: context.businessType,
    locale: context.locale,
  })

  ga4Event('sign_up', {
    method: 'email',
    business_type: context.businessType,
    locale: context.locale,
  })
}

export function trackLogin(context: LoginContext): void {
  if (!canTrack()) return

  metaTrackCustom('Login', {
    locale: context.locale,
  })

  ga4Event('login', {
    method: 'email',
    locale: context.locale,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Subscribe
// ──────────────────────────────────────────────────────────────────

export function trackSubscribe(payload: SubscribePayload): void {
  if (!canTrack()) return

  metaTrack('Subscribe', {
    source: payload.source,
    locale: payload.locale,
  })

  ga4Event('newsletter_signup', {
    source: payload.source,
    locale: payload.locale,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Kontaktų click'ai (phone / email / WhatsApp)
// ──────────────────────────────────────────────────────────────────

export function trackPhoneClick(context: ContactClickContext): void {
  if (!canTrack()) return

  metaTrackCustom('PhoneClick', {
    location: context.location,
    locale: context.locale,
  })

  ga4Event('phone_click', {
    location: context.location,
    locale: context.locale,
  })
}

export function trackEmailClick(context: ContactClickContext): void {
  if (!canTrack()) return

  metaTrackCustom('EmailClick', {
    location: context.location,
    locale: context.locale,
  })

  ga4Event('email_click', {
    location: context.location,
    locale: context.locale,
  })
}

export function trackWhatsAppClick(context: ContactClickContext): void {
  if (!canTrack()) return

  metaTrackCustom('WhatsAppClick', {
    location: context.location,
    locale: context.locale,
  })

  ga4Event('whatsapp_click', {
    location: context.location,
    locale: context.locale,
  })
}

// ──────────────────────────────────────────────────────────────────
//  Skaičiuoklė — kartą per sesiją (vartotojas gali keisti input'us
//  dešimtis kartų, bet event'ą įskaitom vieną kartą)
// ──────────────────────────────────────────────────────────────────

export function trackCalculatorUsed(context: CalculatorContext): void {
  if (!canTrack()) return
  if (!dedupeOncePerSession('calculator-used')) return

  metaTrackCustom('CalculatorUsed', {
    dyeings_per_week: context.dyeingsPerWeek,
    ml_per_dyeing: context.mlPerDyeing,
    savings_per_month: context.savingsPerMonth,
    locale: context.locale,
  })

  ga4Event('calculator_used', {
    dyeings_per_week: context.dyeingsPerWeek,
    ml_per_dyeing: context.mlPerDyeing,
    savings_per_month: context.savingsPerMonth,
    locale: context.locale,
  })
}

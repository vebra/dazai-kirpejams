'use server'

import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'
import { getDictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'

/**
 * Nuolaidų kodų validacija krepšelyje.
 *
 * Klientas kviečia `validateDiscountCodeAction` kai įveda kuponą — mes
 * kviečiame `validate_discount_code` RPC'ą (read-only) ir grąžinam struktūrą,
 * kurią krepšelis gali rodyti tiesiai UI.
 *
 * SVARBU: tai nėra galutinis panaudojimas — kai user'is pateikia užsakymą,
 * checkout flow iš naujo kviečia `apply_discount_code` RPC'ą atomiškai su
 * `used_count` inkrementavimu. Ši funkcija egzistuoja tik tam, kad UI galėtų
 * parodyti „Jūsų nuolaida −€5" dar prieš pateikiant užsakymą.
 */

export type ValidateDiscountResult =
  | {
      ok: true
      code: string
      discountType: 'percent' | 'fixed_cents'
      value: number
      discountCents: number
    }
  | { ok: false; error: string }

type CheckoutErrors = Awaited<
  ReturnType<typeof getDictionary>
>['checkout']['errors']

function reasonToMessage(
  errs: CheckoutErrors,
  reason: string | undefined,
  extra?: { minOrderCents?: number }
): string {
  switch (reason) {
    case 'not_found':
      return errs.couponNotFound
    case 'inactive':
      return errs.couponInactive
    case 'too_early':
      return errs.couponTooEarly
    case 'expired':
      return errs.couponExpired
    case 'max_uses_reached':
      return errs.couponMaxUses
    case 'min_order_not_met': {
      const eur = extra?.minOrderCents
        ? (extra.minOrderCents / 100).toFixed(2).replace('.', ',')
        : null
      return eur
        ? errs.couponMinOrder.replace('{amount}', eur)
        : errs.couponMinOrderGeneric
    }
    case 'invalid_cart':
      return errs.couponInvalidCart
    default:
      return errs.couponGeneric
  }
}

export async function validateDiscountCodeAction(
  code: string,
  subtotalCents: number,
  locale: Locale
): Promise<ValidateDiscountResult> {
  const checkout = (await getDictionary(locale)).checkout
  const errs = checkout.errors

  // Greita client-side-like validacija prieš network call'ą
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) {
    return { ok: false, error: checkout.enterCouponCode }
  }
  if (trimmed.length < 3 || trimmed.length > 32) {
    return { ok: false, error: errs.couponCodeLength }
  }
  if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
    return { ok: false, error: errs.couponInvalidCart }
  }

  if (!isSupabaseServerConfigured) {
    return { ok: false, error: errs.discountSystemUnavailable }
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('validate_discount_code', {
    p_code: trimmed,
    p_cart_subtotal_cents: subtotalCents,
  })

  if (error) {
    console.error('[discount] validate RPC error:', error)
    return { ok: false, error: errs.couponCheckFailed }
  }

  // RPC grąžina jsonb — Supabase pateikia kaip objektą
  const result = data as {
    ok?: boolean
    reason?: string
    code?: string
    discount_type?: 'percent' | 'fixed_cents'
    value?: number
    discount_cents?: number
    min_order_cents?: number
  } | null

  if (!result || !result.ok) {
    return {
      ok: false,
      error: reasonToMessage(errs, result?.reason, {
        minOrderCents: result?.min_order_cents,
      }),
    }
  }

  return {
    ok: true,
    code: result.code ?? trimmed,
    discountType: result.discount_type ?? 'percent',
    value: result.value ?? 0,
    discountCents: result.discount_cents ?? 0,
  }
}

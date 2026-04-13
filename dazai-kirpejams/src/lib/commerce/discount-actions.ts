'use server'

import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'

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

/**
 * LT vartotojo žinutės pagal backend'o `reason` kodą. Visos žinutės yra
 * aiškios, be jargono, kad klientas iš karto suprastų ką daryti.
 */
function reasonToMessage(
  reason: string | undefined,
  extra?: { minOrderCents?: number }
): string {
  switch (reason) {
    case 'not_found':
      return 'Toks kuponas neegzistuoja. Patikrinkite, ar nėra rašybos klaidų.'
    case 'inactive':
      return 'Kuponas nebegalioja.'
    case 'too_early':
      return 'Kuponas dar neaktyvus.'
    case 'expired':
      return 'Kuponas nebegalioja — pasibaigė galiojimo laikas.'
    case 'max_uses_reached':
      return 'Šis kuponas jau panaudotas maksimalų skaičių kartų.'
    case 'min_order_not_met': {
      const eur = extra?.minOrderCents
        ? (extra.minOrderCents / 100).toFixed(2).replace('.', ',')
        : null
      return eur
        ? `Kuponui pritaikyti reikia mažiausiai ${eur} € užsakymo sumos.`
        : 'Nepasiekta minimali kupono suma.'
    }
    case 'invalid_cart':
      return 'Neteisingi krepšelio duomenys.'
    default:
      return 'Nepavyko pritaikyti kupono.'
  }
}

export async function validateDiscountCodeAction(
  code: string,
  subtotalCents: number
): Promise<ValidateDiscountResult> {
  // Greita client-side-like validacija prieš network call'ą
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) {
    return { ok: false, error: 'Įveskite kupono kodą.' }
  }
  if (trimmed.length < 3 || trimmed.length > 32) {
    return { ok: false, error: 'Kupono kodas yra 3–32 simbolių ilgio.' }
  }
  if (!Number.isFinite(subtotalCents) || subtotalCents < 0) {
    return { ok: false, error: 'Neteisingi krepšelio duomenys.' }
  }

  if (!isSupabaseServerConfigured) {
    return { ok: false, error: 'Nuolaidų sistema šiuo metu neprieinama.' }
  }

  const supabase = createServerClient()
  const { data, error } = await supabase.rpc('validate_discount_code', {
    p_code: trimmed,
    p_cart_subtotal_cents: subtotalCents,
  })

  if (error) {
    console.error('[discount] validate RPC error:', error)
    return { ok: false, error: 'Nepavyko patikrinti kupono. Bandykite dar kartą.' }
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
      error: reasonToMessage(result?.reason, {
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

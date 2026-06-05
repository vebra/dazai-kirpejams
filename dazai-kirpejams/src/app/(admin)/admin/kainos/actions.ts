'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Visi „Kainos ir nuolaidos" sekcijos Server Action'ai.
 *
 * Reikalavimai:
 *   - `requireAdmin()` pirmoje eilutėje kiekviename action'e
 *   - revalidatePath('/admin/kainos') po mutacijos
 *   - klaidos grąžinamos per query param'us (nes dauguma action'ų yra
 *     paprasti redirect'ai, ne useActionState)
 */

function toCentsFromEur(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const num = Number(trimmed)
  if (!Number.isFinite(num) || num < 0) return null
  return Math.round(num * 100)
}

function toInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const num = Number(trimmed)
  if (!Number.isInteger(num) || num < 0) return null
  return num
}

function toPositiveInt(value: string): number | null {
  const n = toInt(value)
  if (n === null || n === 0) return null
  return n
}

// ============================================
// Nuolaidų kodai
// ============================================

export type CreateDiscountCodeState = {
  error?: string
  success?: boolean
}

export async function createDiscountCodeAction(
  _prev: CreateDiscountCodeState,
  formData: FormData
): Promise<CreateDiscountCodeState> {
  await requireAdmin()
  const supabase = createServerClient()

  const code = ((formData.get('code') as string) ?? '').trim().toUpperCase()
  if (!code || !/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return {
      error:
        'Kodas turi būti 3–32 simbolių, tik raidės (A-Z), skaičiai, „-" arba „_".',
    }
  }

  const discountType = formData.get('discount_type') as string
  if (discountType !== 'percent' && discountType !== 'fixed_cents') {
    return { error: 'Pasirinkite nuolaidos tipą.' }
  }

  const valueRaw = (formData.get('value') as string) ?? ''

  let value: number | null
  if (discountType === 'percent') {
    value = toPositiveInt(valueRaw)
    if (value === null || value > 100) {
      return { error: 'Procentai turi būti nuo 1 iki 100.' }
    }
  } else {
    value = toCentsFromEur(valueRaw)
    if (value === null || value === 0) {
      return { error: 'Nurodykite nuolaidos sumą EUR.' }
    }
  }

  const minOrderRaw = ((formData.get('min_order_eur') as string) ?? '').trim()
  const minOrderCents =
    minOrderRaw === '' ? 0 : toCentsFromEur(minOrderRaw) ?? -1
  if (minOrderCents < 0) {
    return { error: 'Neteisinga minimali užsakymo suma.' }
  }

  const maxUsesRaw = ((formData.get('max_uses') as string) ?? '').trim()
  const maxUses = maxUsesRaw === '' ? null : toPositiveInt(maxUsesRaw)
  if (maxUsesRaw !== '' && maxUses === null) {
    return { error: 'Maks. panaudojimų skaičius turi būti teigiamas skaičius.' }
  }

  const validFromRaw = ((formData.get('valid_from') as string) ?? '').trim()
  const validUntilRaw = ((formData.get('valid_until') as string) ?? '').trim()
  const validFrom = validFromRaw ? `${validFromRaw}T00:00:00.000Z` : null
  const validUntil = validUntilRaw ? `${validUntilRaw}T23:59:59.999Z` : null

  if (validFrom && validUntil && validFrom > validUntil) {
    return { error: 'Pabaigos data turi būti vėlesnė už pradžios.' }
  }

  const description = ((formData.get('description') as string) || '').trim() || null

  // Apimtis: visoms prekėms (all) arba tik išrinktoms prekėms/kategorijoms.
  const scope = (formData.get('scope') as string) ?? 'all'
  let productIds: string[] | null = null
  let categoryIds: string[] | null = null
  if (scope === 'scoped') {
    const pIds = formData
      .getAll('product_ids')
      .map((v) => String(v).trim())
      .filter(Boolean)
    const cIds = formData
      .getAll('category_ids')
      .map((v) => String(v).trim())
      .filter(Boolean)
    if (pIds.length === 0 && cIds.length === 0) {
      return {
        error: 'Pažymėkite bent vieną prekę arba kategoriją, arba pasirinkite „Visoms prekėms".',
      }
    }
    productIds = pIds.length > 0 ? pIds : null
    categoryIds = cIds.length > 0 ? cIds : null
  }

  const { error } = await supabase.from('discount_codes').insert({
    code,
    description,
    discount_type: discountType,
    value,
    min_order_cents: minOrderCents,
    max_uses: maxUses,
    valid_from: validFrom,
    valid_until: validUntil,
    product_ids: productIds,
    category_ids: categoryIds,
    is_active: true,
  })

  if (error) {
    console.error('[admin/kainos/actions] createDiscountCode:', error.message)
    if (error.code === '23505') {
      return { error: `Kodas „${code}" jau egzistuoja.` }
    }
    return { error: `Nepavyko išsaugoti: ${error.message}` }
  }

  revalidatePath('/admin/kainos')
  return { success: true }
}

export async function toggleDiscountCodeAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string
  const nextActive = formData.get('next_active') === 'true'
  if (!id) redirect('/admin/kainos?error=invalid-id')

  const { error } = await supabase
    .from('discount_codes')
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/kainos/actions] toggleDiscountCode:', error.message)
    redirect('/admin/kainos?error=update-failed')
  }

  revalidatePath('/admin/kainos')
}

export async function deleteDiscountCodeAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string
  if (!id) redirect('/admin/kainos?error=invalid-id')

  const { error } = await supabase.from('discount_codes').delete().eq('id', id)

  if (error) {
    console.error('[admin/kainos/actions] deleteDiscountCode:', error.message)
    redirect('/admin/kainos?error=delete-failed')
  }

  revalidatePath('/admin/kainos')
}

// ============================================
// Parduotuvės nustatymai
// ============================================

export type UpdateSettingsState = {
  error?: string
  success?: boolean
}

export async function updateShopSettingsAction(
  _prev: UpdateSettingsState,
  formData: FormData
): Promise<UpdateSettingsState> {
  await requireAdmin()
  const supabase = createServerClient()

  type SettingInput = {
    key: string
    label: string
    formKey: string
  }

  const settings: SettingInput[] = [
    {
      key: 'free_shipping_threshold_cents',
      label: 'Nemokamo pristatymo riba',
      formKey: 'free_shipping_threshold_eur',
    },
    {
      key: 'min_order_cents',
      label: 'Minimali užsakymo suma',
      formKey: 'min_order_eur',
    },
    {
      key: 'delivery_cost_courier_cents',
      label: 'Kurjerio kaina',
      formKey: 'delivery_cost_courier_eur',
    },
    {
      key: 'delivery_cost_parcel_locker_cents',
      label: 'Paštomato kaina',
      formKey: 'delivery_cost_parcel_locker_eur',
    },
    {
      key: 'delivery_cost_pickup_cents',
      label: 'Atsiėmimo kaina',
      formKey: 'delivery_cost_pickup_eur',
    },
  ]

  // Konvertuojam visus į cent'us prieš rašant — nei vienas nesuklysta ≥ visi
  // atmetami. Kitaip turėtume pusiau išsaugotą būseną.
  const toWrite: Array<{ key: string; value: number }> = []
  for (const s of settings) {
    const raw = (formData.get(s.formKey) as string) ?? ''
    const cents = toCentsFromEur(raw)
    if (cents === null) {
      return { error: `Neteisinga reikšmė: ${s.label}` }
    }
    toWrite.push({ key: s.key, value: cents })
  }

  // Upsert po vieną — Supabase upsert su key'u reikalauja primary key'o,
  // čia jis yra `key`, tad veikia nativus upsert
  const { error } = await supabase.from('shop_settings').upsert(
    toWrite.map((s) => ({
      key: s.key,
      value: s.value,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'key' }
  )

  if (error) {
    console.error('[admin/kainos/actions] updateShopSettings:', error.message)
    return { error: `Nepavyko išsaugoti: ${error.message}` }
  }

  revalidatePath('/admin/kainos')
  return { success: true }
}

// ============================================
// Masinis kainų atnaujinimas
// ============================================

export type BulkPriceUpdateState = {
  error?: string
  success?: boolean
  updatedCount?: number
}

type PriceField = 'price_cents' | 'cost_price_cents' | 'b2b_price_cents'

function isPriceField(v: unknown): v is PriceField {
  return (
    v === 'price_cents' || v === 'cost_price_cents' || v === 'b2b_price_cents'
  )
}

type Operation = 'increase_pct' | 'decrease_pct' | 'set_fixed'

function isOperation(v: unknown): v is Operation {
  return v === 'increase_pct' || v === 'decrease_pct' || v === 'set_fixed'
}

/**
 * Masinis kainų atnaujinimas — % didinimas/mažinimas arba fiksuota reikšmė.
 *
 * Veikia ant aktyvių produktų, optionally filtruotų pagal kategoriją.
 * Skaičiuojam NAUJAS vertes JavaScript'e (ne SQL), nes Supabase PostgREST
 * negali daryti `update set price = price * 1.1`. Tai reiškia per-row read +
 * write ciklą, kuris MVP'ui (≤500 produktų) yra visiškai priimtinas.
 */
export async function bulkUpdatePricesAction(
  _prev: BulkPriceUpdateState,
  formData: FormData
): Promise<BulkPriceUpdateState> {
  await requireAdmin()
  const supabase = createServerClient()

  const field = formData.get('field')
  if (!isPriceField(field)) {
    return { error: 'Pasirinkite, kurią kainą atnaujinti.' }
  }

  const operation = formData.get('operation')
  if (!isOperation(operation)) {
    return { error: 'Pasirinkite operaciją.' }
  }

  const valueRaw = ((formData.get('value') as string) ?? '').trim()
  const numericValue = Number(valueRaw.replace(',', '.'))
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return { error: 'Reikšmė turi būti teigiamas skaičius.' }
  }
  if (operation !== 'set_fixed' && numericValue > 500) {
    return { error: 'Procentai apriboti iki 500 (apsauga nuo klaidų).' }
  }

  const categoryId = ((formData.get('category_id') as string) ?? '').trim()

  // Fetch'inam produktus, kuriuos liesim
  let query = supabase
    .from('products')
    .select(`id, price_cents, cost_price_cents, b2b_price_cents`)
    .eq('is_active', true)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: products, error: fetchError } = await query

  if (fetchError) {
    console.error('[admin/kainos/actions] bulkUpdate fetch:', fetchError.message)
    return { error: `Nepavyko gauti produktų: ${fetchError.message}` }
  }

  if (!products || products.length === 0) {
    return { error: 'Nerasta produktų pagal pasirinktą filtrą.' }
  }

  // Skaičiuojam naujas reikšmes
  const updates: Array<{ id: string; newValue: number }> = []
  for (const p of products) {
    const current = (p[field] as number | null) ?? null

    // Jei operacija % bet dabartinė reikšmė null — praleidžiam (nėra nuo ko
    // skaičiuoti). set_fixed visada rašom.
    if (operation !== 'set_fixed' && current === null) continue

    let newValue: number
    if (operation === 'set_fixed') {
      // Reikšmė ateina EUR, konvertuojam į cent'us
      newValue = Math.round(numericValue * 100)
    } else if (operation === 'increase_pct') {
      newValue = Math.round((current as number) * (1 + numericValue / 100))
    } else {
      // decrease_pct
      newValue = Math.round((current as number) * (1 - numericValue / 100))
    }

    // Negali būti neigiama
    if (newValue < 0) newValue = 0

    // Jei reikšmė nepasikeitė — praleidžiam (mažinam UPDATE kiekį)
    if (newValue === current) continue

    updates.push({ id: p.id, newValue })
  }

  if (updates.length === 0) {
    return { error: 'Joks produktas nepasikeistų (rezultatas būtų toks pat).' }
  }

  // Update'ai po vieną per Supabase — sub-optimal, bet ≤500 produktų
  // paraleliai per Promise.all vykdysim baigtai greitai (<2s).
  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from('products')
        .update({
          [field]: u.newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', u.id)
    )
  )

  const failed = results.filter((r) => r.error)
  if (failed.length > 0) {
    console.error(
      '[admin/kainos/actions] bulkUpdate failures:',
      failed.map((r) => r.error?.message)
    )
    return {
      error: `Nepavyko atnaujinti ${failed.length} iš ${updates.length} produktų.`,
    }
  }

  revalidatePath('/admin/kainos')
  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  revalidateTag('products', 'max')
  return { success: true, updatedCount: updates.length }
}

// ============================================
// Akcijos (sale_price_cents) — visos / kategorija / išrinktos prekės
// ============================================

export type SaleActionState = {
  error?: string
  success?: boolean
  updatedCount?: number
  message?: string
}

type SaleScope = 'all' | 'category' | 'products'

function isSaleScope(v: unknown): v is SaleScope {
  return v === 'all' || v === 'category' || v === 'products'
}

function readProductIds(formData: FormData): string[] {
  return formData
    .getAll('product_ids')
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
}

/**
 * Uždeda akcijos kainą pasirinktoms prekėms.
 *  - scope: all | category | products
 *  - discount_type: percent (sumažina X%) | fixed (sumažina X €)
 * Akcijos kaina = round(price * (1 - %/100)) arba price - €. Jei rezultatas
 * nemažesnis už įprastą kainą — praleidžiam (akcijos nebūtų).
 */
export async function applySaleAction(
  _prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  await requireAdmin()
  const supabase = createServerClient()

  const scope = formData.get('scope')
  if (!isSaleScope(scope)) {
    return { error: 'Pasirinkite, kurioms prekėms taikyti akciją.' }
  }

  const discountType = formData.get('discount_type')
  if (discountType !== 'percent' && discountType !== 'fixed') {
    return { error: 'Pasirinkite nuolaidos tipą.' }
  }

  const valueRaw = ((formData.get('value') as string) ?? '').trim()
  const numericValue = Number(valueRaw.replace(',', '.'))
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return { error: 'Nuolaidos dydis turi būti teigiamas skaičius.' }
  }
  if (discountType === 'percent' && numericValue >= 100) {
    return { error: 'Procentas turi būti nuo 1 iki 99.' }
  }

  let query = supabase
    .from('products')
    .select('id, price_cents')
    .eq('is_active', true)

  if (scope === 'category') {
    const categoryId = ((formData.get('category_id') as string) ?? '').trim()
    if (!categoryId) return { error: 'Pasirinkite kategoriją.' }
    query = query.eq('category_id', categoryId)
  } else if (scope === 'products') {
    const ids = readProductIds(formData)
    if (ids.length === 0) return { error: 'Pažymėkite bent vieną prekę.' }
    query = query.in('id', ids)
  }

  const { data: products, error: fetchError } = await query
  if (fetchError) {
    console.error('[admin/kainos] applySale fetch:', fetchError.message)
    return { error: `Nepavyko gauti prekių: ${fetchError.message}` }
  }
  if (!products || products.length === 0) {
    return { error: 'Nerasta prekių pagal pasirinkimą.' }
  }

  const fixedCents = Math.round(numericValue * 100)
  const updates: Array<{ id: string; sale: number }> = []
  for (const p of products) {
    const base = p.price_cents as number
    let sale: number
    if (discountType === 'percent') {
      sale = Math.round(base * (1 - numericValue / 100))
    } else {
      sale = base - fixedCents
    }
    if (sale < 0) sale = 0
    // Jei akcija nesumažintų kainos — praleidžiam
    if (sale >= base) continue
    updates.push({ id: p.id, sale })
  }

  if (updates.length === 0) {
    return { error: 'Akcija nesumažintų nė vienos prekės kainos.' }
  }

  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from('products')
        .update({
          sale_price_cents: u.sale,
          updated_at: new Date().toISOString(),
        })
        .eq('id', u.id)
    )
  )

  const failed = results.filter((r) => r.error)
  if (failed.length > 0) {
    console.error(
      '[admin/kainos] applySale failures:',
      failed.map((r) => r.error?.message)
    )
    return { error: `Nepavyko atnaujinti ${failed.length} iš ${updates.length} prekių.` }
  }

  revalidatePath('/admin/kainos')
  revalidatePath('/admin/sandelis', 'layout')
  revalidateTag('products', 'max')
  return {
    success: true,
    updatedCount: updates.length,
    message: `Akcija uždėta ${updates.length} prek(ėms).`,
  }
}

/**
 * Vienas action formai su dviem mygtukais (intent=apply|remove).
 */
export async function saleAction(
  prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  return formData.get('intent') === 'remove'
    ? removeSaleAction(prev, formData)
    : applySaleAction(prev, formData)
}

/**
 * Nuima akciją (sale_price_cents = null) pasirinktoms prekėms.
 */
export async function removeSaleAction(
  _prev: SaleActionState,
  formData: FormData
): Promise<SaleActionState> {
  await requireAdmin()
  const supabase = createServerClient()

  const scope = formData.get('scope')
  if (!isSaleScope(scope)) {
    return { error: 'Pasirinkite, kurioms prekėms nuimti akciją.' }
  }

  let query = supabase
    .from('products')
    .update({ sale_price_cents: null, updated_at: new Date().toISOString() })
    .not('sale_price_cents', 'is', null)

  if (scope === 'category') {
    const categoryId = ((formData.get('category_id') as string) ?? '').trim()
    if (!categoryId) return { error: 'Pasirinkite kategoriją.' }
    query = query.eq('category_id', categoryId)
  } else if (scope === 'products') {
    const ids = readProductIds(formData)
    if (ids.length === 0) return { error: 'Pažymėkite bent vieną prekę.' }
    query = query.in('id', ids)
  }

  const { error } = await query
  if (error) {
    console.error('[admin/kainos] removeSale:', error.message)
    return { error: `Nepavyko nuimti akcijos: ${error.message}` }
  }

  revalidatePath('/admin/kainos')
  revalidatePath('/admin/sandelis', 'layout')
  revalidateTag('products', 'max')
  return { success: true, message: 'Akcija nuimta.' }
}

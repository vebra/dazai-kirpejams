'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'

/**
 * Produkto redagavimo Server Action'ai.
 *
 * Visi pradeda nuo `requireAdmin()` — be to RLS grąžintų permission denied,
 * bet tada klientas matytų bendrą klaidą vietoj redirect'o į login.
 *
 * Po mutacijos kviečiam `revalidatePath('/admin/sandelis', 'layout')` kad
 * tiek sąrašas, tiek edit puslapis atsinaujintų. Naudojam 'layout' vietoj
 * 'page', nes apžvalgos puslapis (/admin) taip pat rodo low-stock sąrašą.
 */

function toCents(value: string): number | null {
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

export type UpdateProductState = {
  error?: string
  success?: boolean
}

// ============================================
// Pilnas produkto redagavimas
// ============================================

export async function updateProductAction(
  _prev: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const id = formData.get('id') as string
  if (!id) return { error: 'Trūksta produkto ID.' }

  const nameLt = (formData.get('name_lt') as string)?.trim() ?? ''
  const nameEn = (formData.get('name_en') as string)?.trim() ?? ''
  const nameRu = (formData.get('name_ru') as string)?.trim() ?? ''

  if (!nameLt || !nameEn || !nameRu) {
    return { error: 'Pavadinimas privalomas visomis kalbomis (LT/EN/RU).' }
  }

  const priceCents = toCents((formData.get('price_eur') as string) ?? '')
  if (priceCents === null) {
    return { error: 'Neteisinga kaina. Pavyzdys: 18.50' }
  }

  const comparePriceRaw = (formData.get('compare_price_eur') as string) ?? ''
  const comparePriceCents =
    comparePriceRaw.trim() === '' ? null : toCents(comparePriceRaw)
  if (comparePriceRaw.trim() !== '' && comparePriceCents === null) {
    return { error: 'Neteisinga sena kaina.' }
  }

  const b2bPriceRaw = (formData.get('b2b_price_eur') as string) ?? ''
  const b2bPriceCents = b2bPriceRaw.trim() === '' ? null : toCents(b2bPriceRaw)
  if (b2bPriceRaw.trim() !== '' && b2bPriceCents === null) {
    return { error: 'Neteisinga B2B kaina.' }
  }

  const costPriceRaw = (formData.get('cost_price_eur') as string) ?? ''
  const costPriceCents =
    costPriceRaw.trim() === '' ? null : toCents(costPriceRaw)
  if (costPriceRaw.trim() !== '' && costPriceCents === null) {
    return { error: 'Neteisinga savikaina.' }
  }

  const stockQuantity = toInt((formData.get('stock_quantity') as string) ?? '')
  if (stockQuantity === null) {
    return { error: 'Likutis turi būti sveikas skaičius ≥ 0.' }
  }

  const volumeRaw = (formData.get('volume_ml') as string) ?? ''
  const volumeMl = volumeRaw.trim() === '' ? null : toInt(volumeRaw)
  if (volumeRaw.trim() !== '' && volumeMl === null) {
    return { error: 'Talpa turi būti sveikas skaičius.' }
  }

  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'

  const descriptionLt =
    ((formData.get('description_lt') as string) || '').trim() || null
  const descriptionEn =
    ((formData.get('description_en') as string) || '').trim() || null
  const descriptionRu =
    ((formData.get('description_ru') as string) || '').trim() || null

  const sku = ((formData.get('sku') as string) || '').trim() || null
  const ean = ((formData.get('ean') as string) || '').trim() || null

  const { error } = await supabase
    .from('products')
    .update({
      name_lt: nameLt,
      name_en: nameEn,
      name_ru: nameRu,
      description_lt: descriptionLt,
      description_en: descriptionEn,
      description_ru: descriptionRu,
      price_cents: priceCents,
      compare_price_cents: comparePriceCents,
      b2b_price_cents: b2bPriceCents,
      cost_price_cents: costPriceCents,
      volume_ml: volumeMl,
      stock_quantity: stockQuantity,
      is_in_stock: stockQuantity > 0,
      is_active: isActive,
      is_featured: isFeatured,
      sku,
      ean,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/sandelis/actions] updateProduct:', error.message)
    return { error: `Nepavyko išsaugoti: ${error.message}` }
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  return { success: true }
}

// ============================================
// Greitas stock atnaujinimas (sąrašo puslapyje)
// ============================================

export async function quickUpdateStockAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const id = formData.get('id') as string
  const stock = toInt((formData.get('stock_quantity') as string) ?? '')

  if (!id || stock === null) {
    // Server Action be state'o — redirect atgal su klaida paprasčiau per query param
    redirect('/admin/sandelis?error=invalid-stock')
  }

  const { error } = await supabase
    .from('products')
    .update({
      stock_quantity: stock,
      is_in_stock: stock > 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/sandelis/actions] quickUpdateStock:', error.message)
    redirect('/admin/sandelis?error=update-failed')
  }

  revalidatePath('/admin/sandelis')
  revalidatePath('/admin')
}

// ============================================
// Įjungti/išjungti produktą (soft delete)
// ============================================

export async function toggleProductActiveAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const id = formData.get('id') as string
  const nextActive = formData.get('next_active') === 'true'

  if (!id) redirect('/admin/sandelis?error=invalid-id')

  const { error } = await supabase
    .from('products')
    .update({
      is_active: nextActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/sandelis/actions] toggleActive:', error.message)
    redirect('/admin/sandelis?error=update-failed')
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
}

// ============================================
// Masinis aktyvavimas — paruošti importuotus produktus pardavimui
// ============================================

/**
 * Naudojam po supplier importo, kad per vieną veiksmą perjungtume visus
 * `is_active=false` produktus į aktyvius ir suteiktume jiems pradinį
 * likutį. Jei `stock_quantity` lauke paliekame tuščią — likučio nekeičiam
 * (leidžia aktyvuoti produktus, kurių likutį jau suvedėm ranka).
 */
export async function bulkActivateInactiveAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const stockRaw = (formData.get('stock_quantity') as string) ?? ''
  const stockTrimmed = stockRaw.trim()
  const initialStock =
    stockTrimmed === '' ? null : toInt(stockTrimmed)

  if (stockTrimmed !== '' && initialStock === null) {
    redirect('/admin/sandelis?error=invalid-stock')
  }

  // Tik neaktyvūs — kitų neliečiam
  const update: Record<string, unknown> = {
    is_active: true,
    updated_at: new Date().toISOString(),
  }
  if (initialStock !== null) {
    update.stock_quantity = initialStock
    update.is_in_stock = initialStock > 0
  }

  const { error, count } = await supabase
    .from('products')
    .update(update, { count: 'exact' })
    .eq('is_active', false)

  if (error) {
    console.error('[admin/sandelis/actions] bulkActivate:', error.message)
    redirect('/admin/sandelis?error=update-failed')
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  redirect(`/admin/sandelis?activated=${count ?? 0}`)
}

// ============================================
// Masinis deaktyvavimas — išjungti visus aktyvius produktus
// ============================================

export async function bulkDeactivateActiveAction(): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const { error, count } = await supabase
    .from('products')
    .update(
      {
        is_active: false,
        updated_at: new Date().toISOString(),
      },
      { count: 'exact' }
    )
    .eq('is_active', true)

  if (error) {
    console.error('[admin/sandelis/actions] bulkDeactivate:', error.message)
    redirect('/admin/sandelis?error=update-failed')
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  redirect(`/admin/sandelis?deactivated=${count ?? 0}`)
}

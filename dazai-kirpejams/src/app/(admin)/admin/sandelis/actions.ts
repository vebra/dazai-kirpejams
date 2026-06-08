'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
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
  const supabase = createServerClient()

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

  const infoBrand = ((formData.get('info_brand') as string) || '').trim() || null
  const infoType = ((formData.get('info_type') as string) || '').trim() || null
  const infoMixingRatio = ((formData.get('info_mixing_ratio') as string) || '').trim() || null
  const infoShelfLife = ((formData.get('info_shelf_life') as string) || '').trim() || null
  const infoCountry = ((formData.get('info_country') as string) || '').trim() || null

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
      info_brand: infoBrand,
      info_type: infoType,
      info_mixing_ratio: infoMixingRatio,
      info_shelf_life: infoShelfLife,
      info_country: infoCountry,
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

  // Variantų (dydžių) sinchronizacija — jei prekė priklauso variantų grupei,
  // BENDRUS laukus (pavadinimas, aprašymas, kainos, talpa, papildoma info)
  // pritaikom ir kitiems tos grupės dydžiams. Taip redaguojant vieną dydį
  // automatiškai atsinaujina visi. PER-DYDĮ laukai NEKEIČIAMI: likutis,
  // SKU, EAN, aktyvumas — kiekvienas dydis juos turi savo.
  const { data: groupRow } = await supabase
    .from('products')
    .select('variant_group')
    .eq('id', id)
    .maybeSingle()

  if (groupRow?.variant_group) {
    const { error: syncError } = await supabase
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
        info_brand: infoBrand,
        info_type: infoType,
        info_mixing_ratio: infoMixingRatio,
        info_shelf_life: infoShelfLife,
        info_country: infoCountry,
        is_featured: isFeatured,
        updated_at: new Date().toISOString(),
      })
      .eq('variant_group', groupRow.variant_group)
      .neq('id', id)

    if (syncError) {
      console.error(
        '[admin/sandelis/actions] updateProduct variant sync:',
        syncError.message
      )
    }
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  revalidateTag('products', 'max')
  return { success: true }
}

// ============================================
// Naujo produkto kūrimas
// ============================================

const LT_MAP: Record<string, string> = {
  ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z',
}
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ąčęėįšųūž]/g, (c) => LT_MAP[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function createProductAction(
  _prev: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
  await requireAdmin()
  const supabase = createServerClient()

  const nameLt = (formData.get('name_lt') as string)?.trim() ?? ''
  const nameEn = (formData.get('name_en') as string)?.trim() ?? ''
  const nameRu = (formData.get('name_ru') as string)?.trim() ?? ''
  if (!nameLt || !nameEn || !nameRu) {
    return { error: 'Pavadinimas privalomas visomis kalbomis (LT/EN/RU).' }
  }

  const categoryId = ((formData.get('category_id') as string) || '').trim()
  if (!categoryId) return { error: 'Pasirinkite kategoriją.' }

  const priceCents = toCents((formData.get('price_eur') as string) ?? '')
  if (priceCents === null || priceCents <= 0) {
    return { error: 'Neteisinga kaina. Pavyzdys: 7.90' }
  }

  const comparePriceRaw = (formData.get('compare_price_eur') as string) ?? ''
  const comparePriceCents = comparePriceRaw.trim() === '' ? null : toCents(comparePriceRaw)
  if (comparePriceRaw.trim() !== '' && comparePriceCents === null) {
    return { error: 'Neteisinga sena kaina.' }
  }
  const b2bPriceRaw = (formData.get('b2b_price_eur') as string) ?? ''
  const b2bPriceCents = b2bPriceRaw.trim() === '' ? null : toCents(b2bPriceRaw)
  if (b2bPriceRaw.trim() !== '' && b2bPriceCents === null) {
    return { error: 'Neteisinga B2B kaina.' }
  }
  const costPriceRaw = (formData.get('cost_price_eur') as string) ?? ''
  const costPriceCents = costPriceRaw.trim() === '' ? null : toCents(costPriceRaw)
  if (costPriceRaw.trim() !== '' && costPriceCents === null) {
    return { error: 'Neteisinga savikaina.' }
  }

  const stockQuantity = toInt((formData.get('stock_quantity') as string) ?? '0') ?? 0
  const volumeRaw = (formData.get('volume_ml') as string) ?? ''
  const volumeMl = volumeRaw.trim() === '' ? null : toInt(volumeRaw)

  const sku = ((formData.get('sku') as string) || '').trim() || null
  const ean = ((formData.get('ean') as string) || '').trim() || null
  const colorNumber = ((formData.get('color_number') as string) || '').trim() || null
  const colorName = ((formData.get('color_name') as string) || '').trim() || null
  const colorHex = ((formData.get('color_hex') as string) || '').trim() || null
  const descriptionLt = ((formData.get('description_lt') as string) || '').trim() || null
  const descriptionEn = ((formData.get('description_en') as string) || '').trim() || null
  const descriptionRu = ((formData.get('description_ru') as string) || '').trim() || null
  const isActive = formData.get('is_active') === 'on'
  const isFeatured = formData.get('is_featured') === 'on'

  // Nuotraukos — validuojam PRIEŠ insertą (kad nesukurtume produkto, jei failas blogas)
  const files = formData
    .getAll('images')
    .filter((f): f is File => f instanceof File && f.size > 0)
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { error: `Nuotrauka „${file.name}" per didelė (max 10 MB).` }
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return { error: `Nuotrauka „${file.name}" — netinkamas formatas (JPG, PNG, WebP, AVIF).` }
    }
  }

  // Slug: iš formos arba generuojam iš LT pavadinimo; užtikrinam unikalumą
  let baseSlug = ((formData.get('slug') as string) || '').trim()
  baseSlug = baseSlug ? slugify(baseSlug) : slugify(nameLt)
  if (!baseSlug) baseSlug = 'produktas'
  let slug = baseSlug
  for (let i = 2; i < 100; i++) {
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${i}`
  }

  const infoBrand = ((formData.get('info_brand') as string) || '').trim() || null
  const infoType = ((formData.get('info_type') as string) || '').trim() || null
  const infoMixingRatio = ((formData.get('info_mixing_ratio') as string) || '').trim() || null
  const infoShelfLife = ((formData.get('info_shelf_life') as string) || '').trim() || null
  const infoCountry = ((formData.get('info_country') as string) || '').trim() || null

  const { data, error } = await supabase
    .from('products')
    .insert({
      slug,
      sku,
      ean,
      category_id: categoryId,
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
      color_number: colorNumber,
      color_name: colorName,
      color_hex: colorHex,
      info_brand: infoBrand,
      info_type: infoType,
      info_mixing_ratio: infoMixingRatio,
      info_shelf_life: infoShelfLife,
      info_country: infoCountry,
      stock_quantity: stockQuantity,
      is_in_stock: stockQuantity > 0,
      is_active: isActive,
      is_featured: isFeatured,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[admin/sandelis/actions] createProduct:', error?.message)
    if ((error?.message ?? '').includes('products_sku_key')) {
      return { error: 'Toks SKU jau egzistuoja. Naudokite kitą.' }
    }
    if ((error?.message ?? '').includes('products_ean')) {
      return { error: 'Toks EAN jau egzistuoja. Naudokite kitą.' }
    }
    return { error: `Nepavyko sukurti: ${error?.message ?? 'klaida'}` }
  }

  // Nuotraukos — įkeliam į Storage ir užpildom image_urls (best-effort: produktas
  // jau sukurtas, tad įkėlimo klaida neblokuoja — nuotraukas galima pridėti ir
  // redagavimo lange).
  if (files.length > 0) {
    const urls: string[] = []
    for (const file of files) {
      try {
        const path = buildStoragePath(data.id, file)
        const buffer = Buffer.from(await file.arrayBuffer())
        const { error: upErr } = await supabase.storage
          .from(PRODUCTS_BUCKET)
          .upload(path, buffer, { contentType: file.type, upsert: true })
        if (upErr) {
          console.error('[admin/sandelis/actions] create image upload:', upErr.message)
          continue
        }
        urls.push(supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path).data.publicUrl)
      } catch (e) {
        console.error('[admin/sandelis/actions] create image exception:', e)
      }
    }
    if (urls.length > 0) {
      await supabase
        .from('products')
        .update({ image_urls: urls, updated_at: new Date().toISOString() })
        .eq('id', data.id)
    }
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin')
  revalidateTag('products', 'max')
  // Į redagavimo puslapį — ten admin gali pridėti daugiau nuotraukų, didmenos kainas
  redirect(`/admin/sandelis/${data.id}?created=1`)
}

// ============================================
// Greitas stock atnaujinimas (sąrašo puslapyje)
// ============================================

export async function quickUpdateStockAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string
  const stock = toInt((formData.get('stock_quantity') as string) ?? '')

  if (!id || stock === null) {
    // Server Action be state'o — redirect atgal su klaida paprasčiau per query param
    redirect('/admin/sandelis?error=invalid-stock')
  }

  // Per RPC — atominis likučio nustatymas + įrašas į judėjimo žurnalą (korekcija)
  const { data, error } = await supabase.rpc('set_product_stock', {
    p_product_id: id,
    p_new_stock: stock,
    p_source: 'admin',
    p_note: 'Rankinė korekcija (sąrašas)',
  })

  if (error || (data && (data as { ok?: boolean }).ok === false)) {
    console.error(
      '[admin/sandelis/actions] quickUpdateStock:',
      error?.message ?? JSON.stringify(data)
    )
    redirect('/admin/sandelis?error=update-failed')
  }

  revalidatePath('/admin/sandelis')
  revalidatePath('/admin')
  revalidateTag('products', 'max')
}

// ============================================
// Įjungti/išjungti produktą (soft delete)
// ============================================

export async function toggleProductActiveAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

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
  revalidateTag('products', 'max')
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
  const supabase = createServerClient()

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
  revalidateTag('products', 'max')
  redirect(`/admin/sandelis?activated=${count ?? 0}`)
}

// ============================================
// Masinis deaktyvavimas — išjungti visus aktyvius produktus
// ============================================

// ============================================
// Produktų nuotraukos — upload / delete / set primary
// ============================================

/** Storage bucket'as, kuriame saugom produktų paveikslėlius. */
const PRODUCTS_BUCKET = 'products'

/** Maksimalus failo dydis baitais (10MB — atitinka bucket konfigūraciją). */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/** Leidžiami MIME tipai (taip pat atitinka bucket konfigūraciją). */
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
])

/**
 * Iš public URL išgauna storage path'ą bucket'e.
 * Pvz. `https://xxx.supabase.co/storage/v1/object/public/products/abc/1.jpg`
 * → `abc/1.jpg`
 */
function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${PRODUCTS_BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.substring(idx + marker.length)
}

/**
 * Sugeneruoja saugų failo pavadinimą — timestamp + random suffix + plėtinys.
 * Produkto ID naudojam kaip aplanką, kad visos vieno produkto nuotraukos
 * gyventų kartu (lengviau daryti cleanup).
 */
function buildStoragePath(productId: string, file: File): string {
  const ext = (() => {
    const fromName = file.name.split('.').pop()?.toLowerCase()
    if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
    // Fallback pagal MIME
    if (file.type === 'image/jpeg') return 'jpg'
    if (file.type === 'image/png') return 'png'
    if (file.type === 'image/webp') return 'webp'
    if (file.type === 'image/avif') return 'avif'
    return 'bin'
  })()
  const ts = Date.now()
  const rand = Math.random().toString(36).substring(2, 8)
  return `${productId}/${ts}-${rand}.${ext}`
}

export type UploadImagesState = {
  error?: string
  success?: boolean
  uploadedCount?: number
}

/**
 * Įkelia vieną ar kelis produktų paveikslėlius į Supabase Storage ir
 * prijungia jų public URL'us prie `products.image_urls` masyvo pabaigos.
 *
 * Naudojam service role klientą vietoj SSR kliento, nes:
 *   1) Storage RLS policy reikalauja `auth.role() = 'authenticated'`, o
 *      server-side SSR sesija šioje vietoje formaliai laikoma serveriu.
 *   2) DB rašymui jau ir taip validavom admin'ą per `requireAdmin()`.
 */
export async function uploadProductImagesAction(
  _prev: UploadImagesState,
  formData: FormData
): Promise<UploadImagesState> {
  await requireAdmin()

  const productId = formData.get('product_id') as string
  if (!productId) return { error: 'Trūksta produkto ID.' }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    return { error: 'Pasirinkite bent vieną paveikslėlį.' }
  }

  // Validacija kiekvienam failui prieš pradedant įkelti
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return {
        error: `Failas „${file.name}" per didelis (max 10 MB).`,
      }
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return {
        error: `Failas „${file.name}" — netinkamas formatas. Leidžiama: JPG, PNG, WebP, AVIF.`,
      }
    }
  }

  const admin = createServerClient()

  // Įkeliam visus failus paraleliai
  const uploadResults = await Promise.all(
    files.map(async (file) => {
      const path = buildStoragePath(productId, file)
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error: uploadError } = await admin.storage
        .from(PRODUCTS_BUCKET)
        .upload(path, buffer, {
          contentType: file.type,
          upsert: true,
        })
      if (uploadError) {
        console.error('[upload] Storage error:', file.name, uploadError.message, uploadError)
        return { ok: false as const, fileName: file.name, message: uploadError.message }
      }
      const { data: publicData } = admin.storage
        .from(PRODUCTS_BUCKET)
        .getPublicUrl(path)
      return { ok: true as const, url: publicData.publicUrl, path }
    })
  )

  const failed = uploadResults.find((r) => !r.ok)
  if (failed && !failed.ok) {
    console.error('[admin/sandelis/actions] upload failed:', failed)
    // Išvalom jau įkeltus, kad neliktų orphan failų
    const uploadedPaths = uploadResults
      .filter((r): r is { ok: true; url: string; path: string } => r.ok)
      .map((r) => r.path)
    if (uploadedPaths.length > 0) {
      await admin.storage.from(PRODUCTS_BUCKET).remove(uploadedPaths)
    }
    return { error: `Nepavyko įkelti „${failed.fileName}": ${failed.message}` }
  }

  const newUrls = uploadResults
    .filter((r): r is { ok: true; url: string; path: string } => r.ok)
    .map((r) => r.url)

  // Pridedam prie esamo masyvo — skaitom, modifikuojam, rašom
  const { data: current, error: fetchError } = await admin
    .from('products')
    .select('image_urls')
    .eq('id', productId)
    .maybeSingle()

  if (fetchError || !current) {
    console.error('[admin/sandelis/actions] fetch product:', fetchError?.message)
    // Rollback — ištrinam ką tik įkeltus failus
    await admin.storage
      .from(PRODUCTS_BUCKET)
      .remove(uploadResults.filter((r) => r.ok).map((r) => (r as { path: string }).path))
    return { error: 'Produktas nerastas.' }
  }

  const existing = Array.isArray(current.image_urls) ? (current.image_urls as string[]) : []
  const merged = [...existing, ...newUrls]

  const { error: updateError } = await admin
    .from('products')
    .update({ image_urls: merged, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (updateError) {
    console.error('[admin/sandelis/actions] update image_urls:', updateError.message)
    await admin.storage
      .from(PRODUCTS_BUCKET)
      .remove(uploadResults.filter((r) => r.ok).map((r) => (r as { path: string }).path))
    return { error: `Nepavyko išsaugoti: ${updateError.message}` }
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath(`/admin/sandelis/${productId}`)
  revalidateTag('products', 'max')
  return { success: true, uploadedCount: newUrls.length }
}

/**
 * Ištrina vieną nuotrauką — tiek iš storage, tiek iš `image_urls` masyvo.
 */
export async function deleteProductImageAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const productId = formData.get('product_id') as string
  const url = formData.get('url') as string

  if (!productId || !url) {
    redirect(`/admin/sandelis/${productId}?image_error=invalid`)
  }

  const admin = createServerClient()

  // Pašalinam iš masyvo
  const { data: current, error: fetchError } = await admin
    .from('products')
    .select('image_urls')
    .eq('id', productId)
    .maybeSingle()

  if (fetchError || !current) {
    console.error('[admin/sandelis/actions] deleteImage fetch:', fetchError?.message)
    redirect(`/admin/sandelis/${productId}?image_error=not-found`)
  }

  const existing = Array.isArray(current.image_urls)
    ? (current.image_urls as string[])
    : []
  const filtered = existing.filter((u) => u !== url)

  const { error: updateError } = await admin
    .from('products')
    .update({ image_urls: filtered, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (updateError) {
    console.error('[admin/sandelis/actions] deleteImage update:', updateError.message)
    redirect(`/admin/sandelis/${productId}?image_error=update-failed`)
  }

  // Bandom pašalinti ir iš storage (nekritiška — jei nepavyko, URL jau
  // pašalintas iš DB, failas liks kaip orphan, bet nematomas vartotojui)
  const path = extractStoragePath(url)
  if (path) {
    await admin.storage.from(PRODUCTS_BUCKET).remove([path])
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath(`/admin/sandelis/${productId}`)
  revalidateTag('products', 'max')
}

/**
 * Perkelia paveikslėlį į masyvo pradžią — taip jis tampa pagrindiniu
 * (pirmas rodomas kataloge, produkto kortelėje ir kt.).
 */
export async function setPrimaryProductImageAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()

  const productId = formData.get('product_id') as string
  const url = formData.get('url') as string

  if (!productId || !url) {
    redirect(`/admin/sandelis/${productId}?image_error=invalid`)
  }

  const admin = createServerClient()

  const { data: current, error: fetchError } = await admin
    .from('products')
    .select('image_urls')
    .eq('id', productId)
    .maybeSingle()

  if (fetchError || !current) {
    redirect(`/admin/sandelis/${productId}?image_error=not-found`)
  }

  const existing = Array.isArray(current.image_urls)
    ? (current.image_urls as string[])
    : []
  if (!existing.includes(url)) {
    redirect(`/admin/sandelis/${productId}?image_error=not-found`)
  }

  const reordered = [url, ...existing.filter((u) => u !== url)]

  const { error: updateError } = await admin
    .from('products')
    .update({ image_urls: reordered, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (updateError) {
    console.error('[admin/sandelis/actions] setPrimary update:', updateError.message)
    redirect(`/admin/sandelis/${productId}?image_error=update-failed`)
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath(`/admin/sandelis/${productId}`)
  revalidateTag('products', 'max')
}

// ============================================
// Masinis deaktyvavimas — išjungti visus aktyvius produktus
// ============================================

export async function bulkDeactivateActiveAction(): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

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
  revalidateTag('products', 'max')
  redirect(`/admin/sandelis?deactivated=${count ?? 0}`)
}

// ============================================
// Prekių priėmimas barkodu (skaneris) — +1 likučio pagal EAN
// ============================================

export type ReceiveScanResult =
  | { ok: true; found: true; name: string; sku: string | null; stock: number; added: number }
  | { ok: true; found: false; ean: string }
  | { ok: false; error: string }

/**
 * Priima nuskenuotą barkodą: atomiškai +qty prie likučio pagal EAN (qty=1 pagal
 * nutylėjimą; dėžėms galima perduoti pvz. 24). Kviečiama per admin SESIJOS
 * klientą (RPC viduje is_admin() pagal auth.uid()).
 */
export async function receiveScannedItem(
  ean: string,
  qty = 1
): Promise<ReceiveScanResult> {
  await requireAdmin()
  const code = (ean ?? '').trim()
  if (!code) return { ok: false, error: 'Tuščias barkodas.' }
  const delta = Number.isInteger(qty) && qty > 0 && qty <= 100000 ? qty : 1

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('receive_stock_by_ean', {
    p_ean: code,
    p_delta: delta,
  })
  if (error) {
    console.error('[admin/sandelis/actions] receiveScannedItem:', error.message)
    return { ok: false, error: 'Nepavyko atnaujinti likučio.' }
  }

  const r = data as { found?: boolean; name?: string; sku?: string | null; stock?: number }
  if (!r?.found) return { ok: true, found: false, ean: code }

  revalidatePath('/admin/sandelis', 'layout')
  revalidateTag('products', 'max')
  return {
    ok: true,
    found: true,
    name: r.name ?? '—',
    sku: r.sku ?? null,
    stock: r.stock ?? 0,
    added: delta,
  }
}

// ============================================
// Rankinis nurašymas / išvežimas
// ============================================

export type WriteOffState = {
  error?: string
  success?: boolean
  message?: string
}

export async function writeOffStockAction(
  _prev: WriteOffState,
  formData: FormData
): Promise<WriteOffState> {
  await requireAdmin()
  const supabase = createServerClient()

  const productId = ((formData.get('product_id') as string) ?? '').trim()
  const qty = toInt((formData.get('qty') as string) ?? '')
  const category = ((formData.get('category') as string) ?? 'Kita').trim() || 'Kita'
  const note = ((formData.get('note') as string) ?? '').trim() || null

  if (!productId) return { error: 'Pasirinkite prekę.' }
  if (qty === null || qty <= 0) return { error: 'Kiekis turi būti teigiamas skaičius.' }

  const { data, error } = await supabase.rpc('write_off_stock', {
    p_product_id: productId,
    p_qty: qty,
    p_category: category,
    p_note: note,
  })

  const res = data as { ok?: boolean; reason?: string; removed?: number; stock?: number } | null
  if (error || !res?.ok) {
    const reason = res?.reason
    const msg =
      reason === 'no_stock'
        ? 'Prekės likutis jau 0 — nėra ką nurašyti.'
        : reason === 'not_found'
          ? 'Prekė nerasta.'
          : reason === 'invalid_qty'
            ? 'Neteisingas kiekis.'
            : error?.message ?? 'Nepavyko nurašyti.'
    console.error('[admin/sandelis] writeOff:', error?.message ?? reason)
    return { error: msg }
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin/sandelis/zurnalas')
  revalidateTag('products', 'max')
  return {
    success: true,
    message: `Nurašyta ${res.removed} vnt. Likutis: ${res.stock}.`,
  }
}

// ============================================
// Atsargų perspėjimo riba (reorder_point)
// ============================================

export async function quickSetReorderAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string
  const raw = ((formData.get('reorder_point') as string) ?? '').trim()
  // Tuščia = pašalinam ribą (null)
  const reorder = raw === '' ? null : toInt(raw)

  if (!id || (raw !== '' && (reorder === null || reorder < 0))) {
    redirect('/admin/sandelis/uzsakyti?error=invalid')
  }

  const { error } = await supabase
    .from('products')
    .update({ reorder_point: reorder, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/sandelis] quickSetReorder:', error.message)
    redirect('/admin/sandelis/uzsakyti?error=update-failed')
  }

  revalidatePath('/admin/sandelis/uzsakyti')
  revalidatePath('/admin/sandelis', 'layout')
  revalidateTag('products', 'max')
}

// ============================================
// Rankinis priėmimas pagal prekės ID (be EAN)
// ============================================

export type ReceiveManualResult =
  | { ok: true; name: string; sku: string | null; stock: number; added: number }
  | { ok: false; error: string }

export async function receiveManualItem(
  productId: string,
  qty = 1,
  supplier?: string
): Promise<ReceiveManualResult> {
  await requireAdmin()
  const id = (productId ?? '').trim()
  if (!id) return { ok: false, error: 'Nepasirinkta prekė.' }
  const delta = Number.isInteger(qty) && qty > 0 && qty <= 100000 ? qty : 1
  const source = (supplier ?? '').trim() || 'Rankinis'

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('receive_stock_by_product_id', {
    p_product_id: id,
    p_delta: delta,
    p_source: source,
  })
  if (error) {
    console.error('[admin/sandelis/actions] receiveManualItem:', error.message)
    return { ok: false, error: 'Nepavyko atnaujinti likučio.' }
  }
  const r = data as { found?: boolean; name?: string; sku?: string | null; stock?: number }
  if (!r?.found) return { ok: false, error: 'Prekė nerasta.' }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin/sandelis/zurnalas')
  revalidateTag('products', 'max')
  return { ok: true, name: r.name ?? '—', sku: r.sku ?? null, stock: r.stock ?? 0, added: delta }
}

// ============================================
// Prekių išdavimas vadybininkei (išvažiavimas iš sandėlio)
// ============================================

export type IssueToRepState = { error?: string; success?: boolean; message?: string }

export async function issueStockToRepAction(
  _prev: IssueToRepState,
  formData: FormData
): Promise<IssueToRepState> {
  await requireAdmin()
  const supabase = createServerClient()

  const productId = ((formData.get('product_id') as string) ?? '').trim()
  const rep = ((formData.get('rep') as string) ?? '').trim()
  const repId = ((formData.get('rep_id') as string) ?? '').trim() || null
  const qty = toInt((formData.get('qty') as string) ?? '')

  if (!rep) return { error: 'Pasirinkite vadybininkę.' }
  if (!productId) return { error: 'Pasirinkite prekę.' }
  if (qty === null || qty <= 0) return { error: 'Kiekis turi būti teigiamas skaičius.' }

  const { data, error } = await supabase.rpc('issue_stock_to_rep', {
    p_product_id: productId,
    p_qty: qty,
    p_rep: rep,
    p_rep_id: repId,
  })

  const res = data as { ok?: boolean; reason?: string; stock?: number; removed?: number } | null
  if (error || !res?.ok) {
    const reason = res?.reason
    const msg =
      reason === 'insufficient_stock'
        ? `Nepakanka likučio (yra ${res?.stock ?? 0}).`
        : reason === 'not_found'
          ? 'Prekė nerasta.'
          : reason === 'invalid_qty'
            ? 'Neteisingas kiekis.'
            : error?.message ?? 'Nepavyko išduoti.'
    console.error('[admin/sandelis] issueToRep:', error?.message ?? reason)
    return { error: msg }
  }

  revalidatePath('/admin/sandelis', 'layout')
  revalidatePath('/admin/sandelis/zurnalas')
  revalidateTag('products', 'max')
  return { success: true, message: `Išduota ${res.removed} vnt. vadybininkei „${rep}". Sandelio likutis: ${res.stock}.` }
}

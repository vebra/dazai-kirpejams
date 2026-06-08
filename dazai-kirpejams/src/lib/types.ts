import type { Locale } from '@/i18n/config'

export type Category = {
  id: string
  slug: string
  name_lt: string
  name_en: string
  name_ru: string
  description_lt: string | null
  description_en: string | null
  description_ru: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export type Brand = {
  id: string
  slug: string
  name: string
  description_lt: string | null
  description_en: string | null
  description_ru: string | null
  logo_url: string | null
}

export type Product = {
  id: string
  slug: string
  sku: string | null
  category_id: string
  brand_id: string | null

  name_lt: string
  name_en: string
  name_ru: string
  description_lt: string | null
  description_en: string | null
  description_ru: string | null
  ingredients_lt: string | null
  ingredients_en: string | null
  ingredients_ru: string | null
  usage_lt: string | null
  usage_en: string | null
  usage_ru: string | null

  price_cents: number
  compare_price_cents: number | null
  b2b_price_cents: number | null
  sale_price_cents: number | null

  volume_ml: number | null
  weight_g: number | null

  color_number: string | null
  color_name: string | null
  color_hex: string | null
  color_tone: string | null
  color_family: string | null

  info_brand: string | null
  info_type: string | null
  info_mixing_ratio: string | null
  info_shelf_life: string | null
  info_country: string | null

  stock_quantity: number
  is_in_stock: boolean
  is_active: boolean
  is_featured: boolean

  image_urls: string[]

  // Variantai (pvz. pirštinių dydžiai). null = paprasta prekė be variantų.
  // Visi vieno `variant_group` produktai rodomi viename puslapyje su
  // dydžio pasirinkimu; kataloge „sulipdomi" į vieną kortelę.
  variant_group?: string | null
  variant_size?: string | null
  variant_sort?: number | null

  created_at: string
  updated_at: string

  // Optional joined data
  category?: Category
  brand?: Brand
}

export function localizedField<
  T extends Record<string, unknown>,
  K extends string
>(obj: T, field: K, locale: Locale): string {
  const key = `${field}_${locale}` as keyof T
  return (obj[key] as string) || (obj[`${field}_lt` as keyof T] as string) || ''
}

export function getProductName(product: Product, locale: Locale): string {
  return localizedField(product, 'name', locale)
}

/** Ar prekė turi galiojančią akcijos kainą (mažesnę už įprastą). */
export function isOnSale(product: {
  sale_price_cents: number | null
  price_cents: number
}): boolean {
  return (
    product.sale_price_cents != null &&
    product.sale_price_cents > 0 &&
    product.sale_price_cents < product.price_cents
  )
}

/** Galiojanti kaina centais — akcijos kaina, jei aktyvi, kitaip įprasta. */
export function getEffectivePriceCents(product: {
  sale_price_cents: number | null
  price_cents: number
}): number {
  return isOnSale(product) ? (product.sale_price_cents as number) : product.price_cents
}

export function getProductDescription(
  product: Product,
  locale: Locale
): string {
  return localizedField(product, 'description', locale)
}

/**
 * Lokalizuotas spalvos pavadinimas (be „nr Color SHOCK —" priešdėlio).
 * `color_name` laukas yra tik LT, todėl EN/RU pavadinimas išvedamas iš
 * lokalizuoto `name_en`/`name_ru`, nukerpant viską iki em brūkšnio „—".
 * LT — naudojam švarų `color_name` lauką.
 */
export function getColorName(product: Product, locale: Locale): string {
  if (locale === 'lt' && product.color_name) return product.color_name
  const full = getProductName(product, locale)
  const idx = full.indexOf('—')
  const derived = idx >= 0 ? full.slice(idx + 1).trim() : full.trim()
  return derived || product.color_name || ''
}

export function getCategoryName(category: Category, locale: Locale): string {
  return localizedField(category, 'name', locale)
}

export function getCategoryDescription(
  category: Category,
  locale: Locale
): string {
  return localizedField(category, 'description', locale)
}

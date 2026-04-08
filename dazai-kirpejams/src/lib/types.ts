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

  volume_ml: number | null
  weight_g: number | null

  color_number: string | null
  color_name: string | null
  color_hex: string | null
  color_tone: string | null
  color_family: string | null

  stock_quantity: number
  is_in_stock: boolean
  is_active: boolean
  is_featured: boolean

  image_urls: string[]

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

export function getProductDescription(
  product: Product,
  locale: Locale
): string {
  return localizedField(product, 'description', locale)
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

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { mockCategories, mockProducts } from './mock-products'
import type { Category, Product } from '@/lib/types'

/**
 * Duomenų prieigos sluoksnis.
 *
 * Kai Supabase sukonfigūruotas (env kintamieji su realiomis reikšmėmis),
 * funkcijos vykdo užklausas į Supabase. Kitu atveju — grąžina mock duomenis.
 * Tai leidžia kurti lokaliai be DB ir deploy'inti produkciją su realiomis
 * užklausomis naudojant tą patį kodą.
 */

type SortBy =
  | 'popular'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'number'
  | 'name'

type GetProductsOptions = {
  categorySlug?: string
  featured?: boolean
  limit?: number
  colorTone?: string
  colorFamily?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: SortBy
}

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(): Promise<Category[]> {
  const supabase = getSupabase()

  if (!supabase) {
    return mockCategories
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[queries.getCategories]', error)
    return []
  }
  return (data || []) as Category[]
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const supabase = getSupabase()

  if (!supabase) {
    return mockCategories.find((c) => c.slug === slug && c.is_active) || null
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[queries.getCategoryBySlug]', error)
    return null
  }
  return (data as Category) || null
}

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(
  options?: GetProductsOptions
): Promise<Product[]> {
  const supabase = getSupabase()

  if (!supabase) {
    return filterMockProducts(options)
  }

  let query = supabase.from('products').select('*').eq('is_active', true)

  // Kategorijos filtras — per slug reikia pirma gauti kategorijos id
  if (options?.categorySlug) {
    const category = await getCategoryBySlug(options.categorySlug)
    if (!category) return []
    query = query.eq('category_id', category.id)
  }

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  if (options?.colorTone) {
    query = query.eq('color_tone', options.colorTone)
  }

  if (options?.colorFamily) {
    query = query.eq('color_family', options.colorFamily)
  }

  if (options?.minPrice !== undefined) {
    query = query.gte('price_cents', options.minPrice * 100)
  }

  if (options?.maxPrice !== undefined) {
    query = query.lte('price_cents', options.maxPrice * 100)
  }

  // Rūšiavimas
  switch (options?.sortBy) {
    case 'price-asc':
      query = query.order('price_cents', { ascending: true })
      break
    case 'price-desc':
      query = query.order('price_cents', { ascending: false })
      break
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'number':
      query = query.order('color_number', {
        ascending: true,
        nullsFirst: false,
      })
      break
    case 'name':
      query = query.order('name_lt', { ascending: true })
      break
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[queries.getProducts]', error)
    return []
  }
  return (data || []) as Product[]
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabase()

  if (!supabase) {
    return mockProducts.find((p) => p.slug === slug && p.is_active) || null
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[queries.getProductBySlug]', error)
    return null
  }
  return (data as Product) || null
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const supabase = getSupabase()

  if (!supabase) {
    return mockProducts
      .filter(
        (p) =>
          p.is_active &&
          p.id !== product.id &&
          p.category_id === product.category_id
      )
      .slice(0, limit)
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(limit)

  if (error) {
    console.error('[queries.getRelatedProducts]', error)
    return []
  }
  return (data || []) as Product[]
}

// ============================================
// Mock fallback filtravimo helper'is
// ============================================

function filterMockProducts(options?: GetProductsOptions): Product[] {
  let products = mockProducts.filter((p) => p.is_active)

  if (options?.categorySlug) {
    const category = mockCategories.find(
      (c) => c.slug === options.categorySlug
    )
    if (!category) return []
    products = products.filter((p) => p.category_id === category.id)
  }

  if (options?.featured) {
    products = products.filter((p) => p.is_featured)
  }

  if (options?.colorTone) {
    products = products.filter((p) => p.color_tone === options.colorTone)
  }

  if (options?.colorFamily) {
    products = products.filter((p) => p.color_family === options.colorFamily)
  }

  if (options?.minPrice !== undefined) {
    products = products.filter((p) => p.price_cents >= options.minPrice! * 100)
  }

  if (options?.maxPrice !== undefined) {
    products = products.filter((p) => p.price_cents <= options.maxPrice! * 100)
  }

  if (options?.sortBy) {
    switch (options.sortBy) {
      case 'price-asc':
        products = [...products].sort((a, b) => a.price_cents - b.price_cents)
        break
      case 'price-desc':
        products = [...products].sort((a, b) => b.price_cents - a.price_cents)
        break
      case 'newest':
        products = [...products].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        break
      case 'number':
        products = [...products].sort((a, b) =>
          (a.color_number || '').localeCompare(b.color_number || '', undefined, {
            numeric: true,
          })
        )
        break
      case 'name':
        products = [...products].sort((a, b) =>
          a.name_lt.localeCompare(b.name_lt)
        )
        break
    }
  }

  if (options?.limit) {
    products = products.slice(0, options.limit)
  }

  return products
}

// ============================================
// BANERIAI (public)
// ============================================

export type Banner = {
  id: string
  placement: string
  title: string
  subtitle: string | null
  badge: string | null
  ctaText: string | null
  ctaUrl: string | null
  ctaSecondaryText: string | null
  ctaSecondaryUrl: string | null
  imageUrl: string | null
  backgroundColor: string | null
  sortOrder: number
}

export async function getActiveBanners(
  placement: string,
  lang: 'lt' | 'en' | 'ru' = 'lt'
): Promise<Banner[]> {
  if (!isSupabaseConfigured) return []
  const supabase = getSupabase()
  if (!supabase) return []

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .eq('placement', placement)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[queries.getActiveBanners]', error)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    placement: r.placement,
    title: lang === 'en' ? r.title_en : lang === 'ru' ? r.title_ru : r.title_lt,
    subtitle: lang === 'en' ? r.subtitle_en : lang === 'ru' ? r.subtitle_ru : r.subtitle_lt,
    badge: lang === 'en' ? r.badge_en : lang === 'ru' ? r.badge_ru : r.badge_lt,
    ctaText: lang === 'en' ? r.cta_text_en : lang === 'ru' ? r.cta_text_ru : r.cta_text_lt,
    ctaUrl: r.cta_url,
    ctaSecondaryText: lang === 'en' ? r.cta_secondary_text_en : lang === 'ru' ? r.cta_secondary_text_ru : r.cta_secondary_text_lt,
    ctaSecondaryUrl: r.cta_secondary_url,
    imageUrl: r.image_url,
    backgroundColor: r.background_color,
    sortOrder: r.sort_order,
  }))
}

// ============================================
// BLOGAS (public)
// ============================================

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  coverImageUrl: string | null
  author: string | null
  category: string | null
  publishedAt: string | null
  createdAt: string
}

type Locale = 'lt' | 'en' | 'ru'

function pickLang<T>(lt: T, en: T, ru: T, lang: Locale): T {
  return lang === 'en' ? en : lang === 'ru' ? ru : lt
}

export async function getBlogPosts(lang: Locale = 'lt'): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return []
  const supabase = getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('[queries.getBlogPosts]', error)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: pickLang(r.title_lt, r.title_en, r.title_ru, lang),
    excerpt: pickLang(r.excerpt_lt, r.excerpt_en, r.excerpt_ru, lang),
    content: pickLang(r.content_lt, r.content_en, r.content_ru, lang),
    coverImageUrl: r.cover_image_url,
    author: r.author,
    category: r.category,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  }))
}

export async function getBlogPostBySlug(
  slug: string,
  lang: Locale = 'lt'
): Promise<BlogPost | null> {
  if (!isSupabaseConfigured) return null
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    slug: data.slug,
    title: pickLang(data.title_lt, data.title_en, data.title_ru, lang),
    excerpt: pickLang(data.excerpt_lt, data.excerpt_en, data.excerpt_ru, lang),
    content: pickLang(data.content_lt, data.content_en, data.content_ru, lang),
    coverImageUrl: data.cover_image_url,
    author: data.author,
    category: data.category,
    publishedAt: data.published_at,
    createdAt: data.created_at,
  }
}

// ============================================
// Info helper'is — ar DB prijungta
// ============================================

export function getDataSourceInfo(): 'supabase' | 'mock' {
  return isSupabaseConfigured ? 'supabase' : 'mock'
}

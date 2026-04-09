import 'server-only'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { DYE_CATEGORIES, type DyeCategoryKey } from '@/lib/data/dye-categories'

/**
 * Admin'o duomenų užklausos — VISOS per `createServerSupabase()`, kuris
 * naudoja autentifikuoto vartotojo sesiją. RLS politikos (004_admin_access.sql)
 * įleidžia tik admin_users lentelėje esančius vartotojus.
 *
 * Saugumas: prieš kviečiant bet kurią šių funkcijų puslapio top-level'yje
 * turi būti iškviesta `requireAdmin()`. Jei ne — RLS grąžins tuščią rezultatą
 * (SELECT'ams) arba permission denied (mutacijoms), bet neparodys klaidos
 * vartotojui iš karto. requireAdmin() užtikrina aiškų redirect'ą į login.
 */

// ============================================
// Helper'iai datoms
// ============================================

/** Dabartinės dienos pradžia serverio time zone'e — Europe/Vilnius */
function startOfDayVilnius(): Date {
  // Next.js serveris gali būti UTC'e. Europe/Vilnius = UTC+2/+3.
  // Supaprastinu — grąžinu UTC vidurnakčio reikšmę ir priimu, kad
  // skirtumas per 2-3 val. yra priimtinas KPI tikslumui. Vėliau
  // perėsim į date-fns-tz jei reikės tiksliai.
  const now = new Date()
  const startUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  return startUtc
}

// ============================================
// Tipai
// ============================================

export type OverviewKpis = {
  ordersToday: number
  revenueTodayCents: number
  ordersTotal: number
  productsActive: number
  b2bInquiriesNew: number
  newsletterSubscribers: number
}

export type RecentOrder = {
  id: string
  orderNumber: string
  customerName: string
  totalCents: number
  status: string
  createdAt: string
}

export type LowStockProduct = {
  id: string
  slug: string
  nameLt: string
  sku: string | null
  stockQuantity: number
  colorNumber: string | null
}

export type AdminProductListRow = {
  id: string
  slug: string
  sku: string | null
  ean: string | null
  nameLt: string
  colorNumber: string | null
  colorHex: string | null
  priceCents: number
  costPriceCents: number | null
  stockQuantity: number
  isActive: boolean
  categorySlug: string | null
  categoryNameLt: string | null
}

export type AdminCategoryOption = {
  id: string
  slug: string
  nameLt: string
}

export type AdminProductDetail = {
  id: string
  slug: string
  sku: string | null
  ean: string | null
  categoryId: string
  nameLt: string
  nameEn: string
  nameRu: string
  descriptionLt: string | null
  descriptionEn: string | null
  descriptionRu: string | null
  priceCents: number
  comparePriceCents: number | null
  b2bPriceCents: number | null
  costPriceCents: number | null
  volumeMl: number | null
  colorNumber: string | null
  colorName: string | null
  colorHex: string | null
  stockQuantity: number
  isActive: boolean
  isFeatured: boolean
}

// ============================================
// KPI kortelės viršuje
// ============================================

export async function getOverviewKpis(): Promise<OverviewKpis> {
  const supabase = await createServerSupabase()
  const todayIso = startOfDayVilnius().toISOString()

  // Vykdom paraleliai — kiekviena užklausa nepriklauso nuo kitos
  const [
    ordersTodayRes,
    revenueTodayRes,
    ordersTotalRes,
    productsActiveRes,
    b2bNewRes,
    newsletterRes,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayIso),
    supabase
      .from('orders')
      .select('total_cents')
      .gte('created_at', todayIso)
      .in('status', ['paid', 'processing', 'shipped', 'delivered']),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('b2b_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase
      .from('newsletter_subscribers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const revenueTodayCents = (revenueTodayRes.data ?? []).reduce(
    (sum, row: { total_cents: number | null }) => sum + (row.total_cents ?? 0),
    0
  )

  return {
    ordersToday: ordersTodayRes.count ?? 0,
    revenueTodayCents,
    ordersTotal: ordersTotalRes.count ?? 0,
    productsActive: productsActiveRes.count ?? 0,
    b2bInquiriesNew: b2bNewRes.count ?? 0,
    newsletterSubscribers: newsletterRes.count ?? 0,
  }
}

// ============================================
// Paskutiniai užsakymai (apžvalgos lentelė)
// ============================================

export async function getRecentOrders(limit = 5): Promise<RecentOrder[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, first_name, last_name, total_cents, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[admin/queries] getRecentOrders:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    customerName: `${row.first_name} ${row.last_name}`.trim(),
    totalCents: row.total_cents,
    status: row.status,
    createdAt: row.created_at,
  }))
}

// ============================================
// Žemo likučio produktai
// ============================================

export async function getLowStockProducts(
  threshold = 50,
  limit = 10
): Promise<LowStockProduct[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name_lt, sku, stock_quantity, color_number')
    .eq('is_active', true)
    .lt('stock_quantity', threshold)
    .order('stock_quantity', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[admin/queries] getLowStockProducts:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    nameLt: row.name_lt,
    sku: row.sku,
    stockQuantity: row.stock_quantity ?? 0,
    colorNumber: row.color_number,
  }))
}

// ============================================
// Sandėlis — produktų sąrašas ir redagavimas
// ============================================

export type AdminProductListOptions = {
  search?: string
  categoryId?: string
  dyeGroup?: DyeCategoryKey
  onlyInactive?: boolean
  onlyLowStock?: boolean
  sortBy?: 'name' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc'
}

export async function getAdminProducts(
  options: AdminProductListOptions = {}
): Promise<AdminProductListRow[]> {
  const supabase = await createServerSupabase()

  let query = supabase
    .from('products')
    .select(
      `id, slug, sku, ean, name_lt, color_number, color_hex, price_cents,
       cost_price_cents, stock_quantity, is_active,
       category:categories(id, slug, name_lt)`
    )
    .limit(500) // MVP'ui užtenka — realiai ~50 dažų + keli šampūnai/oksidantai

  if (options.search) {
    // Paieška per visus lokalizuotus pavadinimus, SKU, spalvos numerį ir
    // spalvos vardą — ilike (case-insensitive). Produktai DB'je vadinasi
    // lietuviškai (Juoda, Kaštoninė…), bet vartotojas gali rašyti ir EN/RU.
    const term = `%${options.search}%`
    query = query.or(
      `name_lt.ilike.${term},name_en.ilike.${term},name_ru.ilike.${term},` +
        `sku.ilike.${term},color_number.ilike.${term},color_name.ilike.${term}`
    )
  }

  if (options.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }

  // Dažų grupė (Natural, Ash, Copper…) — filtruojam per slug sąrašą iš
  // `DYE_CATEGORIES`. Tai atitinka HTML katalogo grupavimą.
  if (options.dyeGroup) {
    const group = DYE_CATEGORIES.find((c) => c.key === options.dyeGroup)
    if (group && group.slugs.length > 0) {
      query = query.in('slug', group.slugs)
    }
  }

  if (options.onlyInactive) {
    query = query.eq('is_active', false)
  }

  if (options.onlyLowStock) {
    query = query.lt('stock_quantity', 50)
  }

  switch (options.sortBy) {
    case 'stock-asc':
      query = query.order('stock_quantity', { ascending: true })
      break
    case 'stock-desc':
      query = query.order('stock_quantity', { ascending: false })
      break
    case 'price-asc':
      query = query.order('price_cents', { ascending: true })
      break
    case 'price-desc':
      query = query.order('price_cents', { ascending: false })
      break
    case 'name':
    default:
      query = query.order('name_lt', { ascending: true })
  }

  const { data, error } = await query

  if (error) {
    console.error('[admin/queries] getAdminProducts:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    // Supabase grąžina join'intą category kaip objektą ARBA masyvą (pvz. .select('*, cat:categories(*)')).
    // Normalizuojam — tikimės 0..1 eilutės.
    const rawCat = row.category as
      | { id: string; slug: string; name_lt: string }
      | { id: string; slug: string; name_lt: string }[]
      | null
    const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat
    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      ean: row.ean ?? null,
      nameLt: row.name_lt,
      colorNumber: row.color_number,
      colorHex: row.color_hex,
      priceCents: row.price_cents,
      costPriceCents: row.cost_price_cents ?? null,
      stockQuantity: row.stock_quantity ?? 0,
      isActive: row.is_active ?? true,
      categorySlug: cat?.slug ?? null,
      categoryNameLt: cat?.name_lt ?? null,
    }
  })
}

/** Kiek produktų yra aktyvių (is_active=true). Naudojam bulk-deactivate mygtukui. */
export async function getActiveProductsCount(): Promise<number> {
  const supabase = await createServerSupabase()
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) {
    console.error('[admin/queries] getActiveProductsCount:', error.message)
    return 0
  }
  return count ?? 0
}

/** Kiek produktų yra išjungtų (is_active=false). Naudojam bulk-activate mygtukui. */
export async function getInactiveProductsCount(): Promise<number> {
  const supabase = await createServerSupabase()
  const { count, error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', false)

  if (error) {
    console.error('[admin/queries] getInactiveProductsCount:', error.message)
    return 0
  }
  return count ?? 0
}

export async function getAdminCategories(): Promise<AdminCategoryOption[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_lt')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[admin/queries] getAdminCategories:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    nameLt: row.name_lt,
  }))
}

// ============================================
// Užsakymai — sąrašas ir detalės
// ============================================

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Lietuviški etikečių pavadinimai būsenoms */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Naujas',
  paid: 'Apmokėtas',
  processing: 'Ruošiamas',
  shipped: 'Išsiųstas',
  delivered: 'Pristatytas',
  cancelled: 'Atšauktas',
  refunded: 'Grąžintas',
}

/** Spalvų schemos kiekvienai būsenai — Tailwind klasės */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  refunded: 'bg-red-50 text-red-700 border-red-200',
}

export type AdminOrderListRow = {
  id: string
  orderNumber: string
  customerName: string
  email: string
  totalCents: number
  itemCount: number
  status: OrderStatus
  paymentMethod: string
  deliveryMethod: string
  isB2b: boolean
  createdAt: string
}

export type AdminOrderListOptions = {
  search?: string
  status?: OrderStatus
  dateFrom?: string
  dateTo?: string
}

export async function getAdminOrders(
  options: AdminOrderListOptions = {}
): Promise<AdminOrderListRow[]> {
  const supabase = await createServerSupabase()

  let query = supabase
    .from('orders')
    .select(
      `id, order_number, email, first_name, last_name, company_name,
       total_cents, status, payment_method, delivery_method, created_at,
       order_items(id)`
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (options.search) {
    const term = `%${options.search}%`
    query = query.or(
      `order_number.ilike.${term},email.ilike.${term},` +
        `first_name.ilike.${term},last_name.ilike.${term},company_name.ilike.${term}`
    )
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }
  if (options.dateTo) {
    query = query.lte('created_at', options.dateTo)
  }

  const { data, error } = await query

  if (error) {
    console.error('[admin/queries] getAdminOrders:', error.message)
    return []
  }

  return (data ?? []).map((row) => {
    const items = Array.isArray(row.order_items) ? row.order_items : []
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerName:
        row.company_name ||
        `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() ||
        '—',
      email: row.email,
      totalCents: row.total_cents,
      itemCount: items.length,
      status: row.status as OrderStatus,
      paymentMethod: row.payment_method,
      deliveryMethod: row.delivery_method,
      isB2b: Boolean(row.company_name),
      createdAt: row.created_at,
    }
  })
}

export type AdminOrderItem = {
  id: string
  productId: string | null
  productName: string
  productSku: string | null
  quantity: number
  unitPriceCents: number
  totalCents: number
}

export type AdminOrderDetail = {
  id: string
  orderNumber: string
  status: OrderStatus
  createdAt: string
  updatedAt: string | null

  // Customer
  email: string
  phone: string | null
  firstName: string
  lastName: string
  companyName: string | null
  companyCode: string | null
  vatCode: string | null

  // Delivery
  deliveryMethod: string
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  deliveryCountry: string | null
  deliveryNotes: string | null
  deliveryCostCents: number

  // Payment
  paymentMethod: string
  paymentStatus: string | null
  paymentReference: string | null

  // Totals
  subtotalCents: number
  vatCents: number
  totalCents: number

  // Tracking
  trackingNumber: string | null
  trackingCarrier: string | null

  // Metadata
  locale: string | null
  notes: string | null

  items: AdminOrderItem[]
}

export async function getAdminOrderById(
  id: string
): Promise<AdminOrderDetail | null> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, created_at, updated_at,
       email, phone, first_name, last_name, company_name, company_code, vat_code,
       delivery_method, delivery_address, delivery_city, delivery_postal_code,
       delivery_country, delivery_notes, delivery_cost_cents,
       payment_method, payment_status, payment_reference,
       subtotal_cents, vat_cents, total_cents,
       tracking_number, tracking_carrier,
       locale, notes,
       order_items(id, product_id, product_name, product_sku, quantity, unit_price_cents, total_cents)`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/queries] getAdminOrderById:', error.message)
    return null
  }
  if (!data) return null

  const items = Array.isArray(data.order_items) ? data.order_items : []

  return {
    id: data.id,
    orderNumber: data.order_number,
    status: data.status as OrderStatus,
    createdAt: data.created_at,
    updatedAt: data.updated_at ?? null,

    email: data.email,
    phone: data.phone ?? null,
    firstName: data.first_name,
    lastName: data.last_name,
    companyName: data.company_name ?? null,
    companyCode: data.company_code ?? null,
    vatCode: data.vat_code ?? null,

    deliveryMethod: data.delivery_method,
    deliveryAddress: data.delivery_address ?? null,
    deliveryCity: data.delivery_city ?? null,
    deliveryPostalCode: data.delivery_postal_code ?? null,
    deliveryCountry: data.delivery_country ?? null,
    deliveryNotes: data.delivery_notes ?? null,
    deliveryCostCents: data.delivery_cost_cents ?? 0,

    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status ?? null,
    paymentReference: data.payment_reference ?? null,

    subtotalCents: data.subtotal_cents,
    vatCents: data.vat_cents,
    totalCents: data.total_cents,

    trackingNumber: data.tracking_number ?? null,
    trackingCarrier: data.tracking_carrier ?? null,

    locale: data.locale ?? null,
    notes: data.notes ?? null,

    items: items.map((it: {
      id: string
      product_id: string | null
      product_name: string
      product_sku: string | null
      quantity: number
      unit_price_cents: number
      total_cents: number
    }) => ({
      id: it.id,
      productId: it.product_id ?? null,
      productName: it.product_name,
      productSku: it.product_sku ?? null,
      quantity: it.quantity,
      unitPriceCents: it.unit_price_cents,
      totalCents: it.total_cents,
    })),
  }
}

export async function getAdminProductById(
  id: string
): Promise<AdminProductDetail | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, slug, sku, ean, category_id, name_lt, name_en, name_ru,
       description_lt, description_en, description_ru,
       price_cents, compare_price_cents, b2b_price_cents, cost_price_cents,
       volume_ml, color_number, color_name, color_hex,
       stock_quantity, is_active, is_featured`
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[admin/queries] getAdminProductById:', error.message)
    return null
  }
  if (!data) return null

  return {
    id: data.id,
    slug: data.slug,
    sku: data.sku,
    ean: data.ean ?? null,
    categoryId: data.category_id,
    nameLt: data.name_lt,
    nameEn: data.name_en,
    nameRu: data.name_ru,
    descriptionLt: data.description_lt,
    descriptionEn: data.description_en,
    descriptionRu: data.description_ru,
    priceCents: data.price_cents,
    comparePriceCents: data.compare_price_cents,
    b2bPriceCents: data.b2b_price_cents,
    costPriceCents: data.cost_price_cents ?? null,
    volumeMl: data.volume_ml,
    colorNumber: data.color_number,
    colorName: data.color_name,
    colorHex: data.color_hex,
    stockQuantity: data.stock_quantity ?? 0,
    isActive: data.is_active ?? true,
    isFeatured: data.is_featured ?? false,
  }
}

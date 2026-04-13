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
  imageUrls: string[]
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
       stock_quantity, is_active, is_featured, image_urls`
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
    imageUrls: Array.isArray(data.image_urls) ? data.image_urls : [],
  }
}

// ============================================
// Klientai — agregacija iš `orders` lentelės
// ============================================
//
// Atskiros `customers` lentelės nėra — klientas yra visi užsakymai su tuo
// pačiu email'u. Tai reiškia:
//   • klientai atsiranda tik po pirmo užsakymo (nėra „potencialių");
//   • jei tas pats žmogus užsako skirtingais email'ais — skaičiuosim kaip
//     du klientus (MVP kompromisas);
//   • email'as yra kliento „ID" URL'e (`/admin/klientai/[email]`).
//
// LTV / bendra suma skaičiuojama tik iš NE-cancelled/NE-refunded užsakymų,
// kad atšaukti užsakymai nedidintų kliento vertės.

export type AdminCustomerListRow = {
  email: string
  name: string
  phone: string | null
  companyName: string | null
  isB2b: boolean
  orderCount: number
  totalSpentCents: number
  firstOrderAt: string
  lastOrderAt: string
}

export type AdminCustomerListOptions = {
  search?: string
  type?: 'all' | 'b2c' | 'b2b'
  sortBy?: 'spent-desc' | 'orders-desc' | 'recent' | 'name'
}

/** Statusai, kurie laikomi „realiomis pajamomis" LTV skaičiavimui. */
const REVENUE_STATUSES = new Set(['pending', 'paid', 'processing', 'shipped', 'delivered'])

type CustomerAggregate = {
  email: string
  // Paskutinio užsakymo kontaktinė info (gali keistis tarp užsakymų)
  latestFirstName: string
  latestLastName: string
  latestPhone: string | null
  latestCompanyName: string | null
  latestCreatedAt: string
  hasB2bOrder: boolean
  orderCount: number
  totalSpentCents: number
  firstCreatedAt: string
}

export async function getAdminCustomers(
  options: AdminCustomerListOptions = {}
): Promise<AdminCustomerListRow[]> {
  const supabase = await createServerSupabase()

  // Fetch'inam visus užsakymus ir agreguojam JS'e. Tinka MVP dydžio
  // shop'ui (<1000 užsakymų). Jei augs — perkelsim į materialized view.
  const { data, error } = await supabase
    .from('orders')
    .select(
      `email, first_name, last_name, phone, company_name,
       total_cents, status, created_at`
    )
    .order('created_at', { ascending: false })
    .limit(2000)

  if (error) {
    console.error('[admin/queries] getAdminCustomers:', error.message)
    return []
  }

  // Grupavimas pagal lowercase email — kad „Vartotojas@Example.com" ir
  // „vartotojas@example.com" būtų tas pats klientas
  const byEmail = new Map<string, CustomerAggregate>()

  for (const row of data ?? []) {
    const normalizedEmail = (row.email ?? '').trim().toLowerCase()
    if (!normalizedEmail) continue

    const existing = byEmail.get(normalizedEmail)
    const countsAsRevenue = REVENUE_STATUSES.has(row.status)
    const orderTotal = countsAsRevenue ? (row.total_cents ?? 0) : 0

    if (!existing) {
      // Užsakymai jau rūšiuoti DESC pagal datą, tad pirmas sutiktas = latest
      byEmail.set(normalizedEmail, {
        email: normalizedEmail,
        latestFirstName: row.first_name ?? '',
        latestLastName: row.last_name ?? '',
        latestPhone: row.phone ?? null,
        latestCompanyName: row.company_name ?? null,
        latestCreatedAt: row.created_at,
        hasB2bOrder: Boolean(row.company_name),
        orderCount: 1,
        totalSpentCents: orderTotal,
        firstCreatedAt: row.created_at,
      })
    } else {
      existing.orderCount += 1
      existing.totalSpentCents += orderTotal
      existing.firstCreatedAt = row.created_at // perrašom vėliau = ankstesnis
      if (row.company_name) existing.hasB2bOrder = true
    }
  }

  let customers: AdminCustomerListRow[] = Array.from(byEmail.values()).map(
    (c) => ({
      email: c.email,
      name:
        c.latestCompanyName ||
        `${c.latestFirstName} ${c.latestLastName}`.trim() ||
        c.email,
      phone: c.latestPhone,
      companyName: c.latestCompanyName,
      isB2b: c.hasB2bOrder,
      orderCount: c.orderCount,
      totalSpentCents: c.totalSpentCents,
      firstOrderAt: c.firstCreatedAt,
      lastOrderAt: c.latestCreatedAt,
    })
  )

  // Filtravimas
  if (options.type === 'b2b') {
    customers = customers.filter((c) => c.isB2b)
  } else if (options.type === 'b2c') {
    customers = customers.filter((c) => !c.isB2b)
  }

  if (options.search) {
    const term = options.search.toLowerCase()
    customers = customers.filter(
      (c) =>
        c.email.includes(term) ||
        c.name.toLowerCase().includes(term) ||
        (c.phone && c.phone.toLowerCase().includes(term)) ||
        (c.companyName && c.companyName.toLowerCase().includes(term))
    )
  }

  // Rūšiavimas — default 'spent-desc' (vertingiausi pirmi)
  const sortBy = options.sortBy ?? 'spent-desc'
  customers.sort((a, b) => {
    switch (sortBy) {
      case 'orders-desc':
        return b.orderCount - a.orderCount
      case 'recent':
        return (
          new Date(b.lastOrderAt).getTime() -
          new Date(a.lastOrderAt).getTime()
        )
      case 'name':
        return a.name.localeCompare(b.name, 'lt')
      case 'spent-desc':
      default:
        return b.totalSpentCents - a.totalSpentCents
    }
  })

  return customers
}

/** Kliento detali informacija — naudojama `/admin/klientai/[email]` puslapyje. */
export type AdminCustomerDetail = {
  email: string
  // Kontaktinė info (iš naujausio užsakymo)
  firstName: string
  lastName: string
  phone: string | null
  companyName: string | null
  companyCode: string | null
  vatCode: string | null

  // Statistika
  orderCount: number
  totalSpentCents: number
  avgOrderValueCents: number
  firstOrderAt: string
  lastOrderAt: string
  isB2b: boolean

  // Skirtingi adresai, kuriais prašyta pristatyti
  deliveryAddresses: Array<{
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
    usedCount: number
  }>

  // Pilna užsakymų istorija
  orders: Array<{
    id: string
    orderNumber: string
    status: OrderStatus
    totalCents: number
    itemCount: number
    paymentMethod: string
    deliveryMethod: string
    createdAt: string
  }>
}

export async function getAdminCustomerByEmail(
  email: string
): Promise<AdminCustomerDetail | null> {
  const supabase = await createServerSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) return null

  // Visi šio kliento užsakymai — gaunam tiek statistiką, tiek istorijos lentelę
  // vienu call'u. Lyginimas case-insensitive per ilike (exact match).
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, total_cents, payment_method, delivery_method,
       created_at, email, first_name, last_name, phone,
       company_name, company_code, vat_code,
       delivery_address, delivery_city, delivery_postal_code, delivery_country,
       order_items(id)`
    )
    .ilike('email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('[admin/queries] getAdminCustomerByEmail:', error.message)
    return null
  }

  if (!data || data.length === 0) return null

  const latest = data[0]
  const oldest = data[data.length - 1]

  // Suskaičiuojam LTV (be cancelled/refunded)
  let totalSpentCents = 0
  let revenueOrdersCount = 0
  for (const row of data) {
    if (REVENUE_STATUSES.has(row.status)) {
      totalSpentCents += row.total_cents ?? 0
      revenueOrdersCount += 1
    }
  }

  // Surinkti unikalius adresus
  const addressKey = (r: typeof latest) =>
    `${r.delivery_address ?? ''}|${r.delivery_city ?? ''}|${r.delivery_postal_code ?? ''}|${r.delivery_country ?? ''}`

  const addressCounts = new Map<
    string,
    {
      address: string | null
      city: string | null
      postalCode: string | null
      country: string | null
      usedCount: number
    }
  >()
  for (const row of data) {
    if (!row.delivery_address && !row.delivery_city) continue
    const key = addressKey(row)
    const existing = addressCounts.get(key)
    if (existing) {
      existing.usedCount += 1
    } else {
      addressCounts.set(key, {
        address: row.delivery_address ?? null,
        city: row.delivery_city ?? null,
        postalCode: row.delivery_postal_code ?? null,
        country: row.delivery_country ?? null,
        usedCount: 1,
      })
    }
  }

  const isB2b = data.some((r) => Boolean(r.company_name))

  return {
    email: normalizedEmail,
    firstName: latest.first_name ?? '',
    lastName: latest.last_name ?? '',
    phone: latest.phone ?? null,
    companyName: latest.company_name ?? null,
    companyCode: latest.company_code ?? null,
    vatCode: latest.vat_code ?? null,

    orderCount: data.length,
    totalSpentCents,
    avgOrderValueCents:
      revenueOrdersCount > 0
        ? Math.round(totalSpentCents / revenueOrdersCount)
        : 0,
    firstOrderAt: oldest.created_at,
    lastOrderAt: latest.created_at,
    isB2b,

    deliveryAddresses: Array.from(addressCounts.values()).sort(
      (a, b) => b.usedCount - a.usedCount
    ),

    orders: data.map((row) => {
      const items = Array.isArray(row.order_items) ? row.order_items : []
      return {
        id: row.id,
        orderNumber: row.order_number,
        status: row.status as OrderStatus,
        totalCents: row.total_cents,
        itemCount: items.length,
        paymentMethod: row.payment_method,
        deliveryMethod: row.delivery_method,
        createdAt: row.created_at,
      }
    }),
  }
}

// ============================================
// Nuolaidų kodai
// ============================================

export type DiscountType = 'percent' | 'fixed_cents'

export type AdminDiscountCode = {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  value: number
  minOrderCents: number
  maxUses: number | null
  usedCount: number
  validFrom: string | null
  validUntil: string | null
  isActive: boolean
  createdAt: string
}

export async function getAdminDiscountCodes(): Promise<AdminDiscountCode[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('discount_codes')
    .select(
      `id, code, description, discount_type, value, min_order_cents,
       max_uses, used_count, valid_from, valid_until, is_active, created_at`
    )
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/queries] getAdminDiscountCodes:', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description ?? null,
    discountType: row.discount_type as DiscountType,
    value: row.value,
    minOrderCents: row.min_order_cents ?? 0,
    maxUses: row.max_uses ?? null,
    usedCount: row.used_count ?? 0,
    validFrom: row.valid_from ?? null,
    validUntil: row.valid_until ?? null,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
  }))
}

// ============================================
// Parduotuvės nustatymai (key-value)
// ============================================

export type ShopSettings = {
  freeShippingThresholdCents: number
  minOrderCents: number
  deliveryCostCourierCents: number
  deliveryCostParcelLockerCents: number
  deliveryCostPickupCents: number
}

/**
 * Įmonės rekvizitai + banko duomenys — atskiras tipas, nes jie rodomi
 * Nustatymų puslapyje ir naudojami email šablonuose bei užsakymo confirmation
 * puslapyje kaip tiesos šaltinis (nebe hardcoded stringai).
 */
export type CompanyInfo = {
  legalName: string
  regCode: string
  vatCode: string
  address: string
  email: string
  phone: string
  bankRecipient: string
  bankIban: string
  bankName: string
}

/**
 * Default'ai, kurie naudojami kai DB arba setting'as dar neegzistuoja.
 * Atitinka MVP hardcoded reikšmes, kad nieko nesugadintume migracijos
 * pritaikymo metu.
 */
const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  freeShippingThresholdCents: 5000, // €50
  minOrderCents: 0,
  deliveryCostCourierCents: 499,
  deliveryCostParcelLockerCents: 299,
  deliveryCostPickupCents: 0,
}

/**
 * Įmonės default reikšmės — tušti stringai, kad formoje rodytųsi tušti laukai
 * ir admin'as juos užpildytų per UI. Buvo „MB Dažai Kirpėjams / LT00 0000..."
 * placeholder'iai hardcoded email šablonuose — dabar jie gyvena DB.
 */
const DEFAULT_COMPANY_INFO: CompanyInfo = {
  legalName: '',
  regCode: '',
  vatCode: '',
  address: '',
  email: '',
  phone: '',
  bankRecipient: '',
  bankIban: '',
  bankName: '',
}

function parseNumericSetting(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

/**
 * `shop_settings.value` yra jsonb — tekstinės reikšmės saugomos kaip JSON
 * string'as (`"LT00 0000 0000 0000 0000"` → `"LT00 0000..."` po parse'o).
 * Null/tuštumas grąžinamas kaip tuščias string'as.
 */
function parseStringSetting(raw: unknown, fallback: string = ''): string {
  if (typeof raw === 'string') return raw
  if (raw === null || raw === undefined) return fallback
  // jsonb gali grąžinti jau parsed objektą — bandom stringify tik primityvus
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)
  return fallback
}

export async function getShopSettings(): Promise<ShopSettings> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('shop_settings')
    .select('key, value')

  if (error) {
    console.error('[admin/queries] getShopSettings:', error.message)
    return DEFAULT_SHOP_SETTINGS
  }

  const map = new Map<string, unknown>()
  for (const row of data ?? []) {
    map.set(row.key, row.value)
  }

  return {
    freeShippingThresholdCents: parseNumericSetting(
      map.get('free_shipping_threshold_cents'),
      DEFAULT_SHOP_SETTINGS.freeShippingThresholdCents
    ),
    minOrderCents: parseNumericSetting(
      map.get('min_order_cents'),
      DEFAULT_SHOP_SETTINGS.minOrderCents
    ),
    deliveryCostCourierCents: parseNumericSetting(
      map.get('delivery_cost_courier_cents'),
      DEFAULT_SHOP_SETTINGS.deliveryCostCourierCents
    ),
    deliveryCostParcelLockerCents: parseNumericSetting(
      map.get('delivery_cost_parcel_locker_cents'),
      DEFAULT_SHOP_SETTINGS.deliveryCostParcelLockerCents
    ),
    deliveryCostPickupCents: parseNumericSetting(
      map.get('delivery_cost_pickup_cents'),
      DEFAULT_SHOP_SETTINGS.deliveryCostPickupCents
    ),
  }
}

/**
 * Įmonės rekvizitų gavimas iš `shop_settings`. Visi laukai optional —
 * jei migracija dar nepritaikyta arba admin'as jų dar neužpildė, grąžinam
 * tuščius stringus (email šablonas tuomet neparodys banko bloko).
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('shop_settings')
    .select('key, value')
    .in('key', [
      'company_legal_name',
      'company_reg_code',
      'company_vat_code',
      'company_address',
      'company_email',
      'company_phone',
      'bank_recipient',
      'bank_iban',
      'bank_name',
    ])

  if (error) {
    console.error('[admin/queries] getCompanyInfo:', error.message)
    return DEFAULT_COMPANY_INFO
  }

  const map = new Map<string, unknown>()
  for (const row of data ?? []) {
    map.set(row.key, row.value)
  }

  return {
    legalName: parseStringSetting(map.get('company_legal_name')),
    regCode: parseStringSetting(map.get('company_reg_code')),
    vatCode: parseStringSetting(map.get('company_vat_code')),
    address: parseStringSetting(map.get('company_address')),
    email: parseStringSetting(map.get('company_email')),
    phone: parseStringSetting(map.get('company_phone')),
    bankRecipient: parseStringSetting(map.get('bank_recipient')),
    bankIban: parseStringSetting(map.get('bank_iban')),
    bankName: parseStringSetting(map.get('bank_name')),
  }
}

// ============================================
// Administratoriai
// ============================================

export type AdminUserRow = {
  id: string
  email: string
  createdAt: string
}

/**
 * Grąžina visus admin'us. RLS leis matyti tik savo eilutę standartiniam
 * klientui, todėl čia naudojam service role klientą — admin'as turi matyti
 * visą sąrašą.
 */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  // Service role klientas importuojamas dinamiškai, kad neįtrauktume jo į
  // client bundle'us kartu su kitomis query'omis.
  const { createServerClient } = await import('@/lib/supabase/server')
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin/queries] getAdminUsers:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    createdAt: r.created_at,
  }))
}

// ============================================
// Statistika bulk kainų atnaujinimui
// ============================================

/**
 * Naudojam „Masinis kainų atnaujinimas" blokui — kiek produktų atitinka
 * pasirinktą filtrą ir koks jų kainos diapazonas.
 */
export async function getProductsCountByCategory(): Promise<
  Array<{ categoryId: string; categoryNameLt: string; count: number }>
> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('category_id, category:categories(id, name_lt)')
    .eq('is_active', true)

  if (error) {
    console.error('[admin/queries] getProductsCountByCategory:', error.message)
    return []
  }

  const counts = new Map<string, { categoryNameLt: string; count: number }>()
  for (const row of data ?? []) {
    const cat = Array.isArray(row.category) ? row.category[0] : row.category
    if (!cat) continue
    const existing = counts.get(cat.id)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(cat.id, { categoryNameLt: cat.name_lt, count: 1 })
    }
  }

  return Array.from(counts.entries())
    .map(([categoryId, v]) => ({ categoryId, ...v }))
    .sort((a, b) => a.categoryNameLt.localeCompare(b.categoryNameLt, 'lt'))
}

// ============================================
// B2B užklausos
// ============================================

export type B2bInquiryRow = {
  id: string
  salonName: string
  contactName: string
  email: string
  phone: string
  address: string | null
  monthlyVolume: string | null
  message: string | null
  status: string
  locale: string
  createdAt: string
  updatedAt: string
}

export async function getB2bInquiries(): Promise<B2bInquiryRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('b2b_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/queries] getB2bInquiries:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    salonName: r.salon_name,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    monthlyVolume: r.monthly_volume,
    message: r.message,
    status: r.status,
    locale: r.locale,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

// ============================================
// Vartotojų verifikacija
// ============================================

export type UserProfileRow = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  businessType: string | null
  salonName: string | null
  companyCode: string | null
  verificationStatus: 'pending' | 'approved' | 'rejected'
  verificationDocumentUrl: string | null
  verificationNotes: string | null
  rejectionReason: string | null
  verifiedAt: string | null
  createdAt: string
}

export type GetUserProfilesOptions = {
  status?: 'pending' | 'approved' | 'rejected'
}

export async function getUserProfiles(
  opts: GetUserProfilesOptions = {}
): Promise<UserProfileRow[]> {
  // Naudojam service role, nes RLS leidžia skaityti tik savo profilį
  const { createServerClient } = await import('@/lib/supabase/server')
  const supabase = createServerClient()

  let query = supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (opts.status) {
    query = query.eq('verification_status', opts.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('[admin/queries] getUserProfiles:', error.message)
    return []
  }

  // Email'ą gaunam iš auth.users per admin API — user_profiles
  // nesaugo email'o (jis yra auth.users.email).
  // Čia MVP supaprastinimas: gaunam visų user'ių email'us vienu kart.
  const userIds = (data ?? []).map((r) => r.id)
  let emailMap = new Map<string, string>()

  if (userIds.length > 0) {
    const { data: usersData } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (usersData?.users) {
      emailMap = new Map(
        usersData.users
          .filter((u) => userIds.includes(u.id))
          .map((u) => [u.id, u.email ?? ''])
      )
    }
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    email: emailMap.get(r.id) ?? '',
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    phone: r.phone ?? '',
    businessType: r.business_type,
    salonName: r.salon_name,
    companyCode: r.company_code,
    verificationStatus: r.verification_status,
    verificationDocumentUrl: r.verification_document_url,
    verificationNotes: r.verification_notes,
    rejectionReason: r.rejection_reason,
    verifiedAt: r.verified_at,
    createdAt: r.created_at,
  }))
}

// ============================================
// NAUJIENLAIŠKIAI (Newsletter subscribers)
// ============================================

export type NewsletterSubscriberRow = {
  id: string
  email: string
  locale: string | null
  isActive: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

export async function getNewsletterSubscribers(): Promise<
  NewsletterSubscriberRow[]
> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  if (error) {
    console.error('[admin/queries] getNewsletterSubscribers:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    locale: r.locale,
    isActive: r.is_active,
    subscribedAt: r.subscribed_at,
    unsubscribedAt: r.unsubscribed_at,
  }))
}

// ============================================
// BANERIAI (Banners)
// ============================================

export type BannerRow = {
  id: string
  placement: string
  titleLt: string
  titleEn: string
  titleRu: string
  subtitleLt: string | null
  subtitleEn: string | null
  subtitleRu: string | null
  badgeLt: string | null
  badgeEn: string | null
  badgeRu: string | null
  ctaTextLt: string | null
  ctaTextEn: string | null
  ctaTextRu: string | null
  ctaUrl: string | null
  ctaSecondaryTextLt: string | null
  ctaSecondaryTextEn: string | null
  ctaSecondaryTextRu: string | null
  ctaSecondaryUrl: string | null
  imageUrl: string | null
  backgroundColor: string | null
  sortOrder: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

function mapBannerRow(r: Record<string, unknown>): BannerRow {
  return {
    id: r.id as string,
    placement: r.placement as string,
    titleLt: r.title_lt as string,
    titleEn: r.title_en as string,
    titleRu: r.title_ru as string,
    subtitleLt: r.subtitle_lt as string | null,
    subtitleEn: r.subtitle_en as string | null,
    subtitleRu: r.subtitle_ru as string | null,
    badgeLt: r.badge_lt as string | null,
    badgeEn: r.badge_en as string | null,
    badgeRu: r.badge_ru as string | null,
    ctaTextLt: r.cta_text_lt as string | null,
    ctaTextEn: r.cta_text_en as string | null,
    ctaTextRu: r.cta_text_ru as string | null,
    ctaUrl: r.cta_url as string | null,
    ctaSecondaryTextLt: r.cta_secondary_text_lt as string | null,
    ctaSecondaryTextEn: r.cta_secondary_text_en as string | null,
    ctaSecondaryTextRu: r.cta_secondary_text_ru as string | null,
    ctaSecondaryUrl: r.cta_secondary_url as string | null,
    imageUrl: r.image_url as string | null,
    backgroundColor: r.background_color as string | null,
    sortOrder: r.sort_order as number,
    isActive: r.is_active as boolean,
    startsAt: r.starts_at as string | null,
    endsAt: r.ends_at as string | null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export async function getBanners(): Promise<BannerRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[admin/queries] getBanners:', error.message)
    return []
  }

  return (data ?? []).map((r) => mapBannerRow(r as Record<string, unknown>))
}

export async function getBannerById(id: string): Promise<BannerRow | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return mapBannerRow(data as Record<string, unknown>)
}

// ============================================
// BLOGAS (Blog)
// ============================================

export type BlogPostRow = {
  id: string
  slug: string
  titleLt: string
  titleEn: string
  titleRu: string
  excerptLt: string | null
  excerptEn: string | null
  excerptRu: string | null
  contentLt: string | null
  contentEn: string | null
  contentRu: string | null
  coverImageUrl: string | null
  author: string | null
  category: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function getBlogPosts(): Promise<BlogPostRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/queries] getBlogPosts:', error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    titleLt: r.title_lt,
    titleEn: r.title_en,
    titleRu: r.title_ru,
    excerptLt: r.excerpt_lt,
    excerptEn: r.excerpt_en,
    excerptRu: r.excerpt_ru,
    contentLt: r.content_lt,
    contentEn: r.content_en,
    contentRu: r.content_ru,
    coverImageUrl: r.cover_image_url,
    author: r.author,
    category: r.category,
    isPublished: r.is_published,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))
}

export async function getBlogPostById(
  id: string
): Promise<BlogPostRow | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    slug: data.slug,
    titleLt: data.title_lt,
    titleEn: data.title_en,
    titleRu: data.title_ru,
    excerptLt: data.excerpt_lt,
    excerptEn: data.excerpt_en,
    excerptRu: data.excerpt_ru,
    contentLt: data.content_lt,
    contentEn: data.content_en,
    contentRu: data.content_ru,
    coverImageUrl: data.cover_image_url,
    author: data.author,
    category: data.category,
    isPublished: data.is_published,
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// ============================================
// ATASKAITOS (Reports)
// ============================================

/** Pardavimų ataskaita pagal dieną — naudojam orders lentelę */
export type DailyRevenue = {
  date: string // YYYY-MM-DD
  orderCount: number
  revenueCents: number
}

export type TopProduct = {
  productName: string
  sku: string | null
  totalQuantity: number
  totalCents: number
}

export type StatusBreakdown = {
  status: string
  count: number
}

export type ReportPeriod = '7d' | '30d' | '90d' | '365d' | 'all'

function getDateOffset(period: ReportPeriod): string | null {
  const now = new Date()
  switch (period) {
    case '7d':
      now.setDate(now.getDate() - 7)
      return now.toISOString()
    case '30d':
      now.setDate(now.getDate() - 30)
      return now.toISOString()
    case '90d':
      now.setDate(now.getDate() - 90)
      return now.toISOString()
    case '365d':
      now.setDate(now.getDate() - 365)
      return now.toISOString()
    case 'all':
      return null
  }
}

export type ReportsData = {
  totalOrders: number
  totalRevenueCents: number
  avgOrderCents: number
  dailyRevenue: DailyRevenue[]
  topProducts: TopProduct[]
  statusBreakdown: StatusBreakdown[]
  deliveryBreakdown: StatusBreakdown[]
  paymentBreakdown: StatusBreakdown[]
}

export async function getReportsData(
  period: ReportPeriod = '30d'
): Promise<ReportsData> {
  const supabase = await createServerSupabase()
  const since = getDateOffset(period)

  // Build base query filters
  let ordersQuery = supabase
    .from('orders')
    .select('id, total_cents, status, delivery_method, payment_method, created_at')
  let itemsQuery = supabase
    .from('order_items')
    .select('product_name, product_sku, quantity, total_cents, order_id')

  if (since) {
    ordersQuery = ordersQuery.gte('created_at', since)
  }

  const [ordersRes, allOrderIdsRes] = await Promise.all([
    ordersQuery.order('created_at', { ascending: true }),
    since
      ? supabase
          .from('orders')
          .select('id')
          .gte('created_at', since)
      : supabase.from('orders').select('id'),
  ])

  const orders = ordersRes.data ?? []
  const orderIds = (allOrderIdsRes.data ?? []).map((r) => r.id)

  // Fetch items for these orders (in batches if needed)
  let items: { product_name: string; product_sku: string | null; quantity: number; total_cents: number }[] = []
  if (orderIds.length > 0) {
    // Supabase .in() supports up to ~300 ids
    const batchSize = 200
    for (let i = 0; i < orderIds.length; i += batchSize) {
      const batch = orderIds.slice(i, i + batchSize)
      const { data } = await itemsQuery.in('order_id', batch)
      if (data) items = items.concat(data)
      // Reset query for next batch
      itemsQuery = supabase
        .from('order_items')
        .select('product_name, product_sku, quantity, total_cents, order_id')
    }
  }

  // --- Aggregate ---

  // Only count paid/processing/shipped/delivered for revenue
  const revenueStatuses = ['paid', 'processing', 'shipped', 'delivered']
  const revenueOrders = orders.filter((o) => revenueStatuses.includes(o.status))

  const totalOrders = orders.length
  const totalRevenueCents = revenueOrders.reduce(
    (sum, o) => sum + (o.total_cents ?? 0),
    0
  )
  const avgOrderCents =
    revenueOrders.length > 0
      ? Math.round(totalRevenueCents / revenueOrders.length)
      : 0

  // Daily revenue
  const dailyMap = new Map<string, { orderCount: number; revenueCents: number }>()
  for (const o of revenueOrders) {
    const day = o.created_at.substring(0, 10) // YYYY-MM-DD
    const entry = dailyMap.get(day) ?? { orderCount: 0, revenueCents: 0 }
    entry.orderCount++
    entry.revenueCents += o.total_cents ?? 0
    dailyMap.set(day, entry)
  }
  const dailyRevenue: DailyRevenue[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  // Top products by quantity
  const productMap = new Map<string, TopProduct>()
  for (const item of items) {
    const key = item.product_sku ?? item.product_name
    const entry = productMap.get(key) ?? {
      productName: item.product_name,
      sku: item.product_sku,
      totalQuantity: 0,
      totalCents: 0,
    }
    entry.totalQuantity += item.quantity
    entry.totalCents += item.total_cents
    productMap.set(key, entry)
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10)

  // Status breakdown
  const statusMap = new Map<string, number>()
  for (const o of orders) {
    statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1)
  }
  const statusBreakdown: StatusBreakdown[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // Delivery method breakdown
  const deliveryMap = new Map<string, number>()
  for (const o of orders) {
    const m = o.delivery_method ?? 'unknown'
    deliveryMap.set(m, (deliveryMap.get(m) ?? 0) + 1)
  }
  const deliveryBreakdown: StatusBreakdown[] = Array.from(deliveryMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  // Payment method breakdown
  const paymentMap = new Map<string, number>()
  for (const o of orders) {
    const m = o.payment_method ?? 'unknown'
    paymentMap.set(m, (paymentMap.get(m) ?? 0) + 1)
  }
  const paymentBreakdown: StatusBreakdown[] = Array.from(paymentMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalOrders,
    totalRevenueCents,
    avgOrderCents,
    dailyRevenue,
    topProducts,
    statusBreakdown,
    deliveryBreakdown,
    paymentBreakdown,
  }
}

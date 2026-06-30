import 'server-only'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient } from '@/lib/supabase/server'
import type { RepClient, RepProduct, RepOrderListItem } from './types'

/**
 * Rep duomenų užklausos — per createServerSupabase() (rep sesija + RLS).
 * Klientus mato tik savininkas (RLS clients_rep_select), product_prices skaito
 * sales_rep, orders — savo (orders_rep_select_own). Prieš kviečiant puslapyje
 * turi būti requireSalesRep().
 */

/** Rep'o klientai (RLS → tik savo). Naudojama paieškai užsakyme ir Klientų sąraše. */
export async function getMyClients(): Promise<RepClient[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, email, pricing_tier')
    .order('name', { ascending: true })

  if (error) {
    console.error('[rep/queries] getMyClients:', error.message)
    return []
  }
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    pricingTier: c.pricing_tier,
  }))
}

/**
 * Aktyvūs produktai su VISOMIS tier kainomis (product_prices). Client'as pasirinkus
 * klientą pats pasiima reikiamą tier kainą. Produktai be jokios kainos vis tiek
 * rodomi (UI išjungia „pridėti").
 */
export async function getRepOrderProducts(): Promise<RepProduct[]> {
  // Service role — po migr 067 authenticated rolei produktų skaitymas
  // grąžindavo tuščią (vadybininkė nematytų prekių kurdama užsakymą). Prekių
  // katalogas globalus (ne rep-nuosavybė), tad service role saugu; puslapis
  // gating'inamas requireSalesRep().
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select(
      `id, name_lt, sku, color_number, stock_quantity, is_active,
       product_prices ( tier, price_cents )`
    )
    .eq('is_active', true)
    .order('name_lt', { ascending: true })
    .limit(500)

  if (error) {
    console.error('[rep/queries] getRepOrderProducts:', error.message)
    return []
  }

  type Row = {
    id: string
    name_lt: string
    sku: string | null
    color_number: string | null
    stock_quantity: number | null
    product_prices: Array<{ tier: string; price_cents: number }> | null
  }

  return (data as unknown as Row[]).map((p) => {
    const prices: Record<string, number> = {}
    for (const pp of p.product_prices ?? []) prices[pp.tier] = pp.price_cents
    return {
      id: p.id,
      nameLt: p.name_lt,
      sku: p.sku,
      colorNumber: p.color_number,
      stockQuantity: p.stock_quantity ?? 0,
      prices,
    }
  })
}

/** Rep'o pateikti užsakymai su būsena (naujausi viršuje). */
export async function getMyRepOrders(): Promise<RepOrderListItem[]> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, created_at, total_cents, approval_status, rejection_reason, notes,
       clients ( name ),
       order_items ( id )`
    )
    .eq('placed_by', user.id)
    .not('approval_status', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[rep/queries] getMyRepOrders:', error.message)
    return []
  }

  type Row = {
    id: string
    order_number: string
    created_at: string
    total_cents: number
    approval_status: 'pending' | 'approved' | 'rejected' | null
    rejection_reason: string | null
    notes: string | null
    clients: { name: string } | null
    order_items: Array<{ id: string }> | null
  }

  return (data as unknown as Row[]).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    createdAt: o.created_at,
    clientName: o.clients?.name ?? null,
    approvalStatus: o.approval_status,
    totalCents: o.total_cents,
    itemCount: o.order_items?.length ?? 0,
    rejectionReason: o.rejection_reason,
    notes: o.notes,
  }))
}

// ============================================
// Skydelio statistika
// ============================================

export type RepStats = {
  thisMonthCents: number
  pendingCount: number
  approvedCount: number
  totalApprovedCents: number
  clientCount: number
}

export async function getMyRepStats(): Promise<RepStats> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const empty: RepStats = {
    thisMonthCents: 0,
    pendingCount: 0,
    approvedCount: 0,
    totalApprovedCents: 0,
    clientCount: 0,
  }
  if (!user) return empty

  const [ordersRes, clientsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('total_cents, approval_status, created_at')
      .eq('placed_by', user.id)
      .not('approval_status', 'is', null),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
  ])

  const list = (ordersRes.data ?? []) as Array<{
    total_cents: number
    approval_status: string | null
    created_at: string
  }>
  const now = new Date()
  const ym = now.getFullYear() * 12 + now.getMonth()
  const stats = { ...empty, clientCount: clientsRes.count ?? 0 }
  for (const o of list) {
    if (o.approval_status === 'pending') stats.pendingCount++
    if (o.approval_status === 'approved') {
      stats.approvedCount++
      stats.totalApprovedCents += o.total_cents
      const d = new Date(o.created_at)
      if (d.getFullYear() * 12 + d.getMonth() === ym) stats.thisMonthCents += o.total_cents
    }
  }
  return stats
}

// ============================================
// Mano atsargos: suvestinė + judėjimų žurnalas (migr 073)
// ============================================

export type RepStockSummaryRow = {
  productId: string
  name: string
  sku: string | null
  colorNumber: string | null
  taken: number
  returned: number
  sold: number
  onHand: number
  lastAt: string
}

export async function getMyStockSummary(): Promise<RepStockSummaryRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_my_stock_summary')
  if (error) {
    console.error('[rep/queries] getMyStockSummary:', error.message)
    return []
  }
  return (
    (data ?? []) as Array<{
      product_id: string
      name: string
      sku: string | null
      color_number: string | null
      taken: number
      returned: number
      sold: number
      on_hand: number
      last_at: string
    }>
  ).map((r) => ({
    productId: r.product_id,
    name: r.name,
    sku: r.sku,
    colorNumber: r.color_number,
    taken: r.taken,
    returned: r.returned,
    sold: r.sold,
    onHand: r.on_hand,
    lastAt: r.last_at,
  }))
}

export type RepStockMovementRow = {
  createdAt: string
  reason: 'issue_to_rep' | 'return_from_rep' | 'rep_sale' | 'rep_sale_cancel'
  qty: number
  source: string | null
  productId: string
  name: string
  sku: string | null
  colorNumber: string | null
}

export async function getMyStockMovements(): Promise<RepStockMovementRow[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.rpc('get_my_stock_movements')
  if (error) {
    console.error('[rep/queries] getMyStockMovements:', error.message)
    return []
  }
  return (
    (data ?? []) as Array<{
      created_at: string
      reason: RepStockMovementRow['reason']
      qty: number
      source: string | null
      product_id: string
      name: string
      sku: string | null
      color_number: string | null
    }>
  ).map((r) => ({
    createdAt: r.created_at,
    reason: r.reason,
    qty: r.qty,
    source: r.source,
    productId: r.product_id,
    name: r.name,
    sku: r.sku,
    colorNumber: r.color_number,
  }))
}

// ============================================
// Užsakymo detalė (tik savo) + eilutės
// ============================================

export type RepOrderDetail = {
  id: string
  orderNumber: string
  createdAt: string
  approvalStatus: 'pending' | 'approved' | 'rejected' | null
  rejectionReason: string | null
  notes: string | null
  clientId: string | null
  clientName: string | null
  paymentMethod: string
  subtotalCents: number
  deliveryCostCents: number
  vatCents: number
  totalCents: number
  items: Array<{
    productId: string | null
    name: string
    sku: string | null
    quantity: number
    unitPriceCents: number
    totalCents: number
  }>
}

export async function getMyRepOrderDetail(orderId: string): Promise<RepOrderDetail | null> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, created_at, subtotal_cents, delivery_cost_cents, vat_cents, total_cents, approval_status, rejection_reason, notes, payment_method, client_id,
       clients ( name ),
       order_items ( product_id, product_name, product_sku, quantity, unit_price_cents, total_cents )`
    )
    .eq('id', orderId)
    .eq('placed_by', user.id)
    .maybeSingle()

  if (error || !data) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any
  return {
    id: d.id,
    orderNumber: d.order_number,
    createdAt: d.created_at,
    approvalStatus: d.approval_status,
    rejectionReason: d.rejection_reason,
    notes: d.notes,
    clientId: d.client_id ?? null,
    clientName: d.clients?.name ?? null,
    paymentMethod: d.payment_method,
    subtotalCents: d.subtotal_cents ?? 0,
    deliveryCostCents: d.delivery_cost_cents ?? 0,
    vatCents: d.vat_cents ?? 0,
    totalCents: d.total_cents,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (d.order_items ?? []).map((it: any) => ({
      productId: it.product_id ?? null,
      name: it.product_name,
      sku: it.product_sku,
      quantity: it.quantity,
      unitPriceCents: it.unit_price_cents,
      totalCents: it.total_cents,
    })),
  }
}

// ============================================
// Kliento istorija (klientas + jo užsakymai)
// ============================================

export async function getClientWithOrders(
  clientId: string
): Promise<{ client: RepClient; orders: RepOrderListItem[] } | null> {
  const supabase = await createServerSupabase()
  const { data: c } = await supabase
    .from('clients')
    .select('id, name, phone, email, pricing_tier')
    .eq('id', clientId)
    .maybeSingle()
  if (!c) return null

  const { data: o } = await supabase
    .from('orders')
    .select(
      `id, order_number, created_at, total_cents, approval_status, rejection_reason, notes,
       order_items ( id )`
    )
    .eq('client_id', clientId)
    .not('approval_status', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: RepOrderListItem[] = ((o ?? []) as any[]).map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    createdAt: r.created_at,
    clientName: c.name,
    approvalStatus: r.approval_status,
    totalCents: r.total_cents,
    itemCount: r.order_items?.length ?? 0,
    rejectionReason: r.rejection_reason,
    notes: r.notes,
  }))

  return {
    client: {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      pricingTier: c.pricing_tier,
    },
    orders,
  }
}

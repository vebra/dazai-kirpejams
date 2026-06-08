import 'server-only'
import { createServerSupabase } from '@/lib/supabase/ssr'
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
  const supabase = await createServerSupabase()
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

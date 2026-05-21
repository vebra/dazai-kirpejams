import 'server-only'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Kliento užsakymų užklausos jo paskyrai (/paskyra). Iki šito klientas
 * matydavo TIK sąskaitas (kurios kuriamos vėliau, admin'ui pažymėjus
 * apmokėjimą) — užsakymai, dar laukiantys apmokėjimo, paskyroje
 * būdavo nematomi.
 */

export type CustomerOrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type CustomerOrderSummary = {
  id: string
  orderNumber: string
  status: CustomerOrderStatus
  totalCents: number
  createdAt: string
  itemsCount: number
}

/**
 * Grąžina visus kliento (pagal el. paštą) užsakymus, naujausi pirma.
 * Naudoja service-role klientą (createServerClient), nes orders RLS
 * nepalaiko self-read'o pagal email — saugumas iš programos pusės
 * (kviečiama tik po `supabase.auth.getUser()` patikros).
 *
 * `itemsCount` skaičiuojamas atskira užklausa, kad nereiktų load'inti
 * visų order_items eilučių.
 */
export async function getOrdersForCustomer(
  email: string
): Promise<CustomerOrderSummary[]> {
  if (!email) return []
  const supabase = createServerClient()

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_cents, created_at')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[orders/customer-queries] getOrdersForCustomer:', error.message)
    return []
  }

  if (!orders || orders.length === 0) return []

  const orderIds = orders.map((o) => o.id)
  const { data: itemRows } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds)

  const countsByOrder = new Map<string, number>()
  for (const row of itemRows ?? []) {
    countsByOrder.set(row.order_id, (countsByOrder.get(row.order_id) ?? 0) + 1)
  }

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status as CustomerOrderStatus,
    totalCents: o.total_cents,
    createdAt: o.created_at,
    itemsCount: countsByOrder.get(o.id) ?? 0,
  }))
}

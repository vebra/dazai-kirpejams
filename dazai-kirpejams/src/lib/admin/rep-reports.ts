import 'server-only'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Vadybininkių (sales_rep) valdymo + pardavimų ataskaitų duomenys. Service-role,
 * nes reikia auth.users el. paštų + agregacijų per visus rep užsakymus.
 * „Pardavimai" = PATVIRTINTI (approval_status='approved') užsakymai (realūs).
 */

export type RepRow = {
  id: string
  name: string
  email: string
  clientCount: number
  pendingCount: number
  approvedCount: number
  approvedSalesCents: number
}

export type ClientSalesRow = {
  id: string
  name: string
  tier: string
  repName: string
  approvedCount: number
  approvedSalesCents: number
}

export type RepManagementData = {
  reps: RepRow[]
  clients: ClientSalesRow[]
  totalApprovedSalesCents: number
}

export async function getRepManagementData(): Promise<RepManagementData> {
  const sb = createServerClient()

  const [{ data: profs }, { data: clients }, { data: orders }] = await Promise.all([
    sb.from('user_profiles').select('id, first_name, last_name').eq('role', 'sales_rep'),
    sb.from('clients').select('id, name, pricing_tier, created_by'),
    sb
      .from('orders')
      .select('placed_by, client_id, total_cents, approval_status')
      .not('approval_status', 'is', null),
  ])

  // El. paštai iš auth.users
  const emailMap = new Map<string, string>()
  for (let page = 1; page <= 5; page++) {
    const { data } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
    for (const u of data?.users ?? []) emailMap.set(u.id, u.email ?? '')
    if (!data || data.users.length < 1000) break
  }

  const repName = new Map<string, string>()
  for (const p of profs ?? []) {
    const n = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
    repName.set(p.id, n || emailMap.get(p.id) || '—')
  }

  type O = { placed_by: string | null; client_id: string | null; total_cents: number; approval_status: string }
  const ords = (orders ?? []) as O[]

  // Agregacija pagal rep
  const reps: RepRow[] = (profs ?? []).map((p) => {
    const own = ords.filter((o) => o.placed_by === p.id)
    const approved = own.filter((o) => o.approval_status === 'approved')
    return {
      id: p.id,
      name: repName.get(p.id) ?? '—',
      email: emailMap.get(p.id) ?? '—',
      clientCount: (clients ?? []).filter((c) => c.created_by === p.id).length,
      pendingCount: own.filter((o) => o.approval_status === 'pending').length,
      approvedCount: approved.length,
      approvedSalesCents: approved.reduce((s, o) => s + (o.total_cents ?? 0), 0),
    }
  })
  reps.sort((a, b) => b.approvedSalesCents - a.approvedSalesCents)

  // Agregacija pagal klientą
  const clientRows: ClientSalesRow[] = (clients ?? []).map((c) => {
    const approved = ords.filter((o) => o.client_id === c.id && o.approval_status === 'approved')
    return {
      id: c.id,
      name: c.name,
      tier: c.pricing_tier,
      repName: c.created_by ? repName.get(c.created_by) ?? '—' : '—',
      approvedCount: approved.length,
      approvedSalesCents: approved.reduce((s, o) => s + (o.total_cents ?? 0), 0),
    }
  })
  clientRows.sort((a, b) => b.approvedSalesCents - a.approvedSalesCents)

  const totalApprovedSalesCents = reps.reduce((s, r) => s + r.approvedSalesCents, 0)

  return { reps, clients: clientRows, totalApprovedSalesCents }
}

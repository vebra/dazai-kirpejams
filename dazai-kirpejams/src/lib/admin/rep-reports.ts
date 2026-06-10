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

// ============================================
// Vadybininkių turimos atsargos (išduota − grąžinta) grąžinimo priėmimui.
// ============================================

export type RepHeldItem = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  held: number
}

/**
 * Žemėlapis rep_id → prekės, kurias ji šiuo metu turi (neto > 0). Skaičiuojam iš
 * stock_movements: issue_to_rep (delta neig.) − return_from_rep (delta teig.),
 * t.y. sum(-delta) per abi priežastis. Service-role, nes stock_movements skaito
 * tik adminas, o čia reikia visų rep'ų pjūvio grąžinimo formai.
 */
export async function getRepHeldInventory(): Promise<Record<string, RepHeldItem[]>> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('stock_movements')
    .select('rep_id, product_id, delta, reason, products(name_lt, sku, color_number)')
    .in('reason', ['issue_to_rep', 'return_from_rep', 'rep_sale', 'rep_sale_cancel'])
    .not('rep_id', 'is', null)

  if (error) {
    console.error('[rep-reports] getRepHeldInventory:', error.message)
    return {}
  }

  type Row = {
    rep_id: string
    product_id: string
    delta: number
    reason: string
    products:
      | { name_lt: string; sku: string | null; color_number: string | null }
      | { name_lt: string; sku: string | null; color_number: string | null }[]
      | null
  }

  // rep_id → product_id → agregatas
  const acc = new Map<string, Map<string, RepHeldItem>>()
  for (const r of (data ?? []) as Row[]) {
    const rawP = Array.isArray(r.products) ? r.products[0] : r.products
    const byProduct = acc.get(r.rep_id) ?? new Map<string, RepHeldItem>()
    const cur = byProduct.get(r.product_id) ?? {
      productId: r.product_id,
      name: rawP?.name_lt ?? '—',
      colorNumber: rawP?.color_number ?? null,
      sku: rawP?.sku ?? null,
      held: 0,
    }
    // issue_to_rep / rep_sale_cancel didina atsargas; return_from_rep / rep_sale mažina.
    const q = Math.abs(r.delta)
    cur.held +=
      r.reason === 'issue_to_rep' || r.reason === 'rep_sale_cancel' ? q : -q
    byProduct.set(r.product_id, cur)
    acc.set(r.rep_id, byProduct)
  }

  const out: Record<string, RepHeldItem[]> = {}
  for (const [repId, byProduct] of acc) {
    const items = [...byProduct.values()]
      .filter((i) => i.held > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'lt'))
    if (items.length > 0) out[repId] = items
  }
  return out
}

// ============================================
// Vadybininkėms išduotos prekės SUGRUPUOTOS pagal išdavimo dieną.
// ============================================

export type RepIssuanceItem = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  ean: string | null
  qty: number
}

export type RepIssuanceDay = {
  date: string // lt-LT trumpas formatas, naudojamas ir kaip raktas, ir kaip etiketė
  items: RepIssuanceItem[]
}

/**
 * Žemėlapis rep_id → išdavimai pagal dieną (naujausi viršuje). TIK issue_to_rep
 * judėjimai (kas tą dieną buvo išduota), be pardavimų/grąžinimų. Service-role.
 */
export async function getRepIssuancesByDate(): Promise<
  Record<string, RepIssuanceDay[]>
> {
  const sb = createServerClient()
  const { data, error } = await sb
    .from('stock_movements')
    .select('rep_id, product_id, delta, created_at, products(name_lt, sku, color_number, ean)')
    .eq('reason', 'issue_to_rep')
    .not('rep_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[rep-reports] getRepIssuancesByDate:', error.message)
    return {}
  }

  const DATE = new Intl.DateTimeFormat('lt-LT', {
    timeZone: 'Europe/Vilnius',
    dateStyle: 'short',
  })

  type Row = {
    rep_id: string
    product_id: string
    delta: number
    created_at: string
    products:
      | { name_lt: string; sku: string | null; color_number: string | null; ean: string | null }
      | { name_lt: string; sku: string | null; color_number: string | null; ean: string | null }[]
      | null
  }

  // rep_id → date → product_id → kiekis (susumuotas tos dienos to paties produkto)
  const acc = new Map<string, Map<string, Map<string, RepIssuanceItem>>>()
  // Datų eiliškumui išlaikyti (jau surūšiuota desc pagal created_at)
  const dateOrder = new Map<string, string[]>()

  for (const r of (data ?? []) as Row[]) {
    const rawP = Array.isArray(r.products) ? r.products[0] : r.products
    const dateKey = DATE.format(new Date(r.created_at))
    const byDate = acc.get(r.rep_id) ?? new Map<string, Map<string, RepIssuanceItem>>()
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, new Map())
      const ord = dateOrder.get(r.rep_id) ?? []
      ord.push(dateKey)
      dateOrder.set(r.rep_id, ord)
    }
    const byProduct = byDate.get(dateKey)!
    const cur = byProduct.get(r.product_id) ?? {
      productId: r.product_id,
      name: rawP?.name_lt ?? '—',
      colorNumber: rawP?.color_number ?? null,
      sku: rawP?.sku ?? null,
      ean: rawP?.ean ?? null,
      qty: 0,
    }
    cur.qty += Math.abs(r.delta)
    byProduct.set(r.product_id, cur)
    acc.set(r.rep_id, byDate)
  }

  const out: Record<string, RepIssuanceDay[]> = {}
  for (const [repId, byDate] of acc) {
    const days: RepIssuanceDay[] = (dateOrder.get(repId) ?? []).map((date) => ({
      date,
      items: [...byDate.get(date)!.values()]
        .filter((i) => i.qty > 0)
        .sort((a, b) => a.name.localeCompare(b.name, 'lt')),
    }))
    out[repId] = days.filter((d) => d.items.length > 0)
  }
  return out
}

// ============================================
// Atsargų suderinimo ataskaita — išduota / parduota / grąžinta / turi + vertė.
// ============================================

export type RepReconRow = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  issued: number // iš viso išduota
  sold: number // parduota (patvirtinti pardavimai)
  returned: number // grąžinta į sandėlį
  held: number // turi dabar (issued − sold − returned)
  valueCents: number // turimų prekių vertė (mažm. kaina)
}

export type RepRecon = {
  repId: string
  repName: string
  rows: RepReconRow[]
  totalHeld: number
  totalValueCents: number
}

/**
 * Kiekvienai vadybininkei — atsargų judėjimų suvestinė pagal prekę: kiek išduota,
 * parduota, grąžinta ir kiek turi dabar (held = issued − sold − returned). Vertė
 * skaičiuojama mažmenine kaina (products.price_cents). Service-role.
 */
export async function getRepReconciliation(): Promise<RepRecon[]> {
  const sb = createServerClient()

  const [{ data: profs }, { data: moves }] = await Promise.all([
    sb.from('user_profiles').select('id, first_name, last_name').eq('role', 'sales_rep'),
    sb
      .from('stock_movements')
      .select('rep_id, product_id, delta, reason, products(name_lt, sku, color_number, price_cents)')
      .in('reason', ['issue_to_rep', 'return_from_rep', 'rep_sale', 'rep_sale_cancel'])
      .not('rep_id', 'is', null),
  ])

  // El. paštai vardo fallback'ui
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

  type Move = {
    rep_id: string
    product_id: string
    delta: number
    reason: string
    products:
      | { name_lt: string; sku: string | null; color_number: string | null; price_cents: number | null }
      | { name_lt: string; sku: string | null; color_number: string | null; price_cents: number | null }[]
      | null
  }

  // rep_id → product_id → eilutė (+ kaina atskirai vertei)
  const acc = new Map<string, Map<string, RepReconRow & { price: number }>>()
  for (const m of (moves ?? []) as Move[]) {
    const p = Array.isArray(m.products) ? m.products[0] : m.products
    const byProduct = acc.get(m.rep_id) ?? new Map<string, RepReconRow & { price: number }>()
    const cur =
      byProduct.get(m.product_id) ?? {
        productId: m.product_id,
        name: p?.name_lt ?? '—',
        colorNumber: p?.color_number ?? null,
        sku: p?.sku ?? null,
        issued: 0,
        sold: 0,
        returned: 0,
        held: 0,
        valueCents: 0,
        price: p?.price_cents ?? 0,
      }
    const q = Math.abs(m.delta)
    if (m.reason === 'issue_to_rep') cur.issued += q
    else if (m.reason === 'rep_sale') cur.sold += q
    else if (m.reason === 'return_from_rep') cur.returned += q
    else if (m.reason === 'rep_sale_cancel') cur.sold -= q // pardavimo atšaukimas
    byProduct.set(m.product_id, cur)
    acc.set(m.rep_id, byProduct)
  }

  const result: RepRecon[] = []
  for (const p of profs ?? []) {
    const byProduct = acc.get(p.id)
    const rows: RepReconRow[] = []
    let totalHeld = 0
    let totalValueCents = 0
    for (const r of byProduct?.values() ?? []) {
      const held = r.issued - r.sold - r.returned
      const valueCents = Math.max(0, held) * r.price
      if (r.issued === 0 && held === 0) continue
      rows.push({
        productId: r.productId,
        name: r.name,
        colorNumber: r.colorNumber,
        sku: r.sku,
        issued: r.issued,
        sold: r.sold,
        returned: r.returned,
        held,
        valueCents,
      })
      totalHeld += held
      totalValueCents += valueCents
    }
    rows.sort((a, b) => a.name.localeCompare(b.name, 'lt'))
    result.push({
      repId: p.id,
      repName: repName.get(p.id) ?? '—',
      rows,
      totalHeld,
      totalValueCents,
    })
  }
  // Vadybininkės su atsargomis viršuje
  result.sort((a, b) => b.totalHeld - a.totalHeld)
  return result
}

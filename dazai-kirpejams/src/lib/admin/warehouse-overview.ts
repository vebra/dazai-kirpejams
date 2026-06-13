import 'server-only'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Sandėlio apžvalgos duomenys pasirinktam laikotarpiui: pardavimai (internetas vs
 * vadybininkė), priėmimas, nurašymai, savo naudojimui, grąžinimai + „kas kiek kur
 * pardavė" pjūviai (pagal kanalą, pagal vadybininkę, top prekės). Skaičiuojama iš
 * stock_movements. Service-role — žurnalą skaito tik adminas.
 *
 * Pastaba dėl vertės: stock_movements nesaugo pardavimo kainos, todėl vertė
 * skaičiuojama pagal DABARTINĘ kainą (mažmeninę pardavimams, savikainą nurašymams)
 * — tai apytikslis orientyras, ne buhalterinė pajamų ataskaita.
 */

export type RepSalesRow = {
  repId: string
  name: string
  units: number
  valueCents: number
}

export type TopProductRow = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  units: number
  valueCents: number
}

export type WarehouseOverview = {
  onlineUnits: number
  onlineValueCents: number
  repUnits: number
  repValueCents: number
  receivingUnits: number
  writeoffUnits: number
  writeoffCostCents: number
  ownUseUnits: number
  returnsUnits: number
  byRep: RepSalesRow[]
  topProducts: TopProductRow[]
  movementCount: number
}

type ProductJoin = {
  name_lt: string
  color_number: string | null
  sku: string | null
  price_cents: number | null
  cost_price_cents: number | null
}

type MoveRow = {
  product_id: string
  rep_id: string | null
  delta: number
  reason: string
  created_at: string
  products: ProductJoin | ProductJoin[] | null
}

export async function getWarehouseOverview(
  opts: { from?: string; to?: string } = {}
): Promise<WarehouseOverview> {
  const sb = createServerClient()

  let q = sb
    .from('stock_movements')
    .select(
      `product_id, rep_id, delta, reason, created_at,
       products(name_lt, color_number, sku, price_cents, cost_price_cents)`
    )
    .order('created_at', { ascending: false })
    .limit(10000)

  if (opts.from) q = q.gte('created_at', `${opts.from}T00:00:00`)
  if (opts.to) q = q.lte('created_at', `${opts.to}T23:59:59.999`)

  const { data, error } = await q
  if (error) {
    console.error('[warehouse-overview]', error.message)
    return {
      onlineUnits: 0,
      onlineValueCents: 0,
      repUnits: 0,
      repValueCents: 0,
      receivingUnits: 0,
      writeoffUnits: 0,
      writeoffCostCents: 0,
      ownUseUnits: 0,
      returnsUnits: 0,
      byRep: [],
      topProducts: [],
      movementCount: 0,
    }
  }

  const rows = (data ?? []) as MoveRow[]

  let onlineUnits = 0
  let onlineValueCents = 0
  let repUnits = 0
  let repValueCents = 0
  let receivingUnits = 0
  let writeoffUnits = 0
  let writeoffCostCents = 0
  let ownUseUnits = 0
  let returnsUnits = 0

  // rep_id → { units, valueCents }
  const byRep = new Map<string, { units: number; valueCents: number }>()
  // product_id → parduota (internetas + vadybininkė, neto)
  const byProduct = new Map<string, TopProductRow>()

  for (const r of rows) {
    const p = Array.isArray(r.products) ? r.products[0] : r.products
    const price = p?.price_cents ?? 0
    const cost = p?.cost_price_cents ?? 0
    const qty = Math.abs(r.delta)

    const addSold = (units: number) => {
      const cur =
        byProduct.get(r.product_id) ??
        ({
          productId: r.product_id,
          name: p?.name_lt ?? '—',
          colorNumber: p?.color_number ?? null,
          sku: p?.sku ?? null,
          units: 0,
          valueCents: 0,
        } as TopProductRow)
      cur.units += units
      cur.valueCents += units * price
      byProduct.set(r.product_id, cur)
    }

    switch (r.reason) {
      case 'sale':
        onlineUnits += qty
        onlineValueCents += qty * price
        addSold(qty)
        break
      case 'rep_sale':
        repUnits += qty
        repValueCents += qty * price
        addSold(qty)
        if (r.rep_id) {
          const cur = byRep.get(r.rep_id) ?? { units: 0, valueCents: 0 }
          cur.units += qty
          cur.valueCents += qty * price
          byRep.set(r.rep_id, cur)
        }
        break
      case 'rep_sale_cancel':
        repUnits -= qty
        repValueCents -= qty * price
        addSold(-qty)
        if (r.rep_id) {
          const cur = byRep.get(r.rep_id) ?? { units: 0, valueCents: 0 }
          cur.units -= qty
          cur.valueCents -= qty * price
          byRep.set(r.rep_id, cur)
        }
        break
      case 'receiving':
        receivingUnits += qty
        break
      case 'writeoff':
        writeoffUnits += qty
        writeoffCostCents += qty * cost
        break
      case 'own_use':
        ownUseUnits += qty
        break
      case 'cancel_restore':
        returnsUnits += qty
        break
    }
  }

  // Vadybininkių vardai
  const repIds = [...byRep.keys()]
  const repName = new Map<string, string>()
  if (repIds.length > 0) {
    const { data: profs } = await sb
      .from('user_profiles')
      .select('id, first_name, last_name')
      .in('id', repIds)
    for (const p of profs ?? []) {
      const n = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
      if (n) repName.set(p.id, n)
    }
    // El. pašto fallback toms, kurioms vardo nėra
    if (repName.size < repIds.length) {
      const emailMap = new Map<string, string>()
      for (let page = 1; page <= 5; page++) {
        const { data: users } = await sb.auth.admin.listUsers({ page, perPage: 1000 })
        for (const u of users?.users ?? []) emailMap.set(u.id, u.email ?? '')
        if (!users || users.users.length < 1000) break
      }
      for (const id of repIds) {
        if (!repName.get(id)) repName.set(id, emailMap.get(id) || '—')
      }
    }
  }

  const byRepRows: RepSalesRow[] = [...byRep.entries()]
    .map(([repId, v]) => ({
      repId,
      name: repName.get(repId) ?? '—',
      units: v.units,
      valueCents: v.valueCents,
    }))
    .filter((r) => r.units !== 0)
    .sort((a, b) => b.units - a.units)

  const topProducts = [...byProduct.values()]
    .filter((r) => r.units > 0)
    .sort((a, b) => b.units - a.units)
    .slice(0, 12)

  return {
    onlineUnits,
    onlineValueCents,
    repUnits,
    repValueCents,
    receivingUnits,
    writeoffUnits,
    writeoffCostCents,
    ownUseUnits,
    returnsUnits,
    byRep: byRepRows,
    topProducts,
    movementCount: rows.length,
  }
}

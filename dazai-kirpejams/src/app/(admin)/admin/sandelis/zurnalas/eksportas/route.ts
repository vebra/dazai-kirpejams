import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getStockMovements } from '@/lib/admin/queries'
import { csvCell as esc } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const REASON_LABEL: Record<string, string> = {
  receiving: 'Priėmimas',
  sale: 'Pardavimas',
  cancel_restore: 'Grąžinimas',
  correction: 'Korekcija',
  writeoff: 'Nurašymas',
  issue_to_rep: 'Išvežimas vadybininkei',
  return_from_rep: 'Grąžinimas iš vadybininkės',
  rep_sale: 'Pardavimas (vadybininkė)',
  rep_sale_cancel: 'Pardavimo atšaukimas (vadybininkė)',
  own_use: 'Savo naudojimui',
}

const DT = new Intl.DateTimeFormat('lt-LT', {
  timeZone: 'Europe/Vilnius',
  dateStyle: 'short',
  timeStyle: 'short',
})

/**
 * GET /admin/sandelis/zurnalas/eksportas — sandėlio judėjimų žurnalas CSV.
 * Palaiko ?reason=&from=&to= (tie patys filtrai kaip puslapyje).
 */
export async function GET(req: NextRequest) {
  await requireAdmin()

  const sp = req.nextUrl.searchParams
  const reason = sp.get('reason') ?? ''
  const from = sp.get('from') ?? ''
  const to = sp.get('to') ?? ''

  const movements = await getStockMovements({
    reason: reason || undefined,
    from: from || undefined,
    to: to || undefined,
    limit: 5000,
  })

  const BOM = '﻿'
  const header = [
    'Data',
    'Prekė',
    'SKU',
    'Spalvos nr.',
    'Tipas',
    'Pokytis',
    'Likutis po',
    'Šaltinis',
    'Pastaba',
  ].join(',')

  const rows = movements.map((m) =>
    [
      esc(DT.format(new Date(m.createdAt))),
      esc(m.productName),
      esc(m.sku ?? ''),
      esc(m.colorNumber ?? ''),
      esc(REASON_LABEL[m.reason] ?? m.reason),
      String(m.delta),
      m.balanceAfter == null ? '' : String(m.balanceAfter),
      esc(m.source ?? ''),
      esc(m.note ?? ''),
    ].join(',')
  )

  const csv = BOM + header + '\n' + rows.join('\n')
  const today = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sandelio-zurnalas-${today}.csv"`,
    },
  })
}

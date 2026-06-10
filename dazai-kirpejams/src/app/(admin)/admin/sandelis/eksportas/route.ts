import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProducts } from '@/lib/admin/queries'
import { csvCell as esc } from '@/lib/csv'

export const dynamic = 'force-dynamic'

function eur(cents: number | null | undefined): string {
  return cents == null ? '' : (cents / 100).toFixed(2)
}

/**
 * GET /admin/sandelis/eksportas — visų produktų sandėlio likučiai CSV formatu.
 * BOM priekyje, kad Excel teisingai nuskaitytų UTF-8 (lietuviškas raides).
 */
export async function GET() {
  await requireAdmin()

  const products = await getAdminProducts({})
  // Rūšiuojam pagal kategoriją, tada pavadinimą — patogu inventorizacijai
  products.sort(
    (a, b) =>
      (a.categoryNameLt ?? '').localeCompare(b.categoryNameLt ?? '', 'lt') ||
      a.nameLt.localeCompare(b.nameLt, 'lt')
  )

  const BOM = '﻿'
  const header = [
    'Pavadinimas',
    'SKU',
    'EAN',
    'Kategorija',
    'Spalvos nr.',
    'Kaina (EUR)',
    'Savikaina (EUR)',
    'Likutis (vnt.)',
    'Aktyvus',
  ].join(',')

  const rows = products.map((p) =>
    [
      esc(p.nameLt),
      esc(p.sku ?? ''),
      esc(p.ean ?? ''),
      esc(p.categoryNameLt ?? ''),
      esc(p.colorNumber ?? ''),
      eur(p.priceCents),
      eur(p.costPriceCents),
      String(p.stockQuantity),
      p.isActive ? 'Taip' : 'Ne',
    ].join(',')
  )

  const csv = BOM + header + '\n' + rows.join('\n')
  const today = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sandelio-likuciai-${today}.csv"`,
    },
  })
}

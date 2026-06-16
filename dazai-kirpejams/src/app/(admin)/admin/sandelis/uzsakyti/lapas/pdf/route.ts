import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import {
  SupplierOrderPdfDocument,
  type SupplierOrderPdfItem,
} from '@/lib/supplier-orders/pdf-template'

export const dynamic = 'force-dynamic'

/**
 * POST /admin/sandelis/uzsakyti/lapas/pdf — sugeneruoja užsakymo tiekėjui PDF
 * iš formoje įvestų prekių (be sandėlio likučių) ir grąžina parsisiuntimui.
 * Užsakymo įrašyti į DB čia NEreikia — tai tik dokumento parsisiuntimas.
 */
export async function POST(req: NextRequest) {
  await requireAdmin()

  let body: { items?: unknown; note?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const rawItems = Array.isArray(body.items) ? body.items : []
  const items: SupplierOrderPdfItem[] = rawItems
    .map((r) => {
      const o = (r ?? {}) as Record<string, unknown>
      const qty = Number(o.qty)
      return {
        colorNumber: (o.colorNumber as string) ?? null,
        name: String(o.name ?? ''),
        nameEn: (o.nameEn as string) ?? null,
        sku: (o.sku as string) ?? null,
        ean: (o.ean as string) ?? null,
        qty: Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0,
      }
    })
    .filter((i) => i.qty > 0)

  if (items.length === 0) {
    return NextResponse.json({ error: 'No items' }, { status: 400 })
  }

  const date = new Date().toLocaleDateString('en-GB')
  const note =
    typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null

  const element = createElement(SupplierOrderPdfDocument, {
    data: { date, items, note },
  }) as unknown as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="purchase-order-${stamp}.pdf"`,
    },
  })
}

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminOrders, ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'

const DELIVERY_LT: Record<string, string> = {
  courier: 'Kurjeris',
  parcel_locker: 'Paštomatas',
  pickup: 'Atsiėmimas',
}

const PAYMENT_LT: Record<string, string> = {
  stripe: 'Kortelė',
  paysera: 'Paysera',
  bank_transfer: 'Pavedimas',
}

function esc(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ')
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * GET /admin/uzsakymai/eksportas?status=paid&from=2026-04-01&to=2026-04-30
 *
 * Grąžina CSV failą su visais užsakymais pagal filtrus. Jei filtrų nėra —
 * eksportuoja visus. Failo pavadinime nurodoma data, kad būtų patogu
 * atskirti eksportus.
 *
 * Tinkamas naudoti iš admin puslapio per `<a href="/admin/uzsakymai/eksportas">`.
 */
export async function GET(request: Request) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as OrderStatus | null
  const dateFrom = searchParams.get('from')
  const dateTo = searchParams.get('to')

  const orders = await getAdminOrders({
    status: status ?? undefined,
    dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
    dateTo: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
  })

  // BOM + header — BOM padeda Excel'ui teisingai nuskaityti UTF-8
  const BOM = '\uFEFF'
  const header = [
    'Nr.',
    'Data',
    'Klientas',
    'El. paštas',
    'B2B',
    'Prekių',
    'Pristatymas',
    'Mokėjimas',
    'Būsena',
    'Suma (EUR)',
  ].join(',')

  const rows = orders.map((o) =>
    [
      esc(o.orderNumber),
      formatDate(o.createdAt),
      esc(o.customerName),
      esc(o.email),
      o.isB2b ? 'Taip' : 'Ne',
      String(o.itemCount),
      DELIVERY_LT[o.deliveryMethod] ?? o.deliveryMethod,
      PAYMENT_LT[o.paymentMethod] ?? o.paymentMethod,
      ORDER_STATUS_LABELS[o.status] ?? o.status,
      formatEur(o.totalCents),
    ].join(',')
  )

  const csv = BOM + header + '\n' + rows.join('\n')

  const today = new Date().toISOString().slice(0, 10)
  const filename = `uzsakymai-${today}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/auth'
import { getEventRegistrations } from '@/lib/admin/queries'
import { DAZU_PREZENTACIJA_2026 } from '@/lib/events/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const HEADERS = [
  'Vardas',
  'Pavardė',
  'El. paštas',
  'Telefonas',
  'Salonas',
  'Pareigos',
  'Svečių sk.',
  'Iš viso žmonių',
  'Būsena',
  'Priminimas išsiųstas',
  'Pastabos',
  'Registruotasi',
]

const STATUS_LABELS_LT: Record<string, string> = {
  confirmed: 'Patvirtinta',
  cancelled: 'Atšaukta',
  attended: 'Dalyvavo',
  no_show: 'Neatvyko',
}

const ROLE_LABELS_LT: Record<string, string> = {
  kirpejas: 'Kirpėjas/-a',
  koloristas: 'Koloristas/-ė',
  savininkas: 'Salono savininkas/-ė',
  kita: 'Kita',
}

/**
 * Excel-friendly CSV escape — apgaubia dvigubomis kabutėmis ir double'ina vidinius `"`.
 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('lt-LT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function GET(request: Request) {
  await requireAdmin()

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get('status') ?? 'all'

  let rows = await getEventRegistrations(DAZU_PREZENTACIJA_2026.slug)
  if (statusFilter !== 'all') {
    rows = rows.filter((r) => r.status === statusFilter)
  }

  const lines: string[] = []
  lines.push(HEADERS.join(';'))

  for (const r of rows) {
    lines.push(
      [
        csvCell(r.firstName),
        csvCell(r.lastName),
        csvCell(r.email),
        csvCell(r.phone),
        csvCell(r.salonName),
        csvCell(r.role ? (ROLE_LABELS_LT[r.role] ?? r.role) : ''),
        csvCell(r.guestsCount),
        csvCell(1 + r.guestsCount),
        csvCell(STATUS_LABELS_LT[r.status] ?? r.status),
        csvCell(formatDate(r.reminderSentAt)),
        csvCell(r.notes),
        csvCell(formatDate(r.createdAt)),
      ].join(';')
    )
  }

  // BOM kad Excel'is teisingai atpažintų UTF-8 (lietuviškos raidės)
  const bom = '\uFEFF'
  const body = bom + lines.join('\r\n')

  const today = new Date().toISOString().slice(0, 10)
  const filename = `renginio-registracijos-${today}.csv`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

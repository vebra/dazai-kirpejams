import { requireAdmin } from '@/lib/admin/auth'
import { getEventRegistrations } from '@/lib/admin/queries'
import {
  DAZU_PREZENTACIJA_2026,
  formatEventDateLt,
} from '@/lib/events/config'
import { PrintButton } from './PrintButton'

export const metadata = {
  title: 'Dalyvių sąrašas',
}

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Patvirtinta',
  cancelled: 'Atšaukta',
  attended: 'Dalyvavo',
  no_show: 'Neatvyko',
}

const ROLE_LABELS: Record<string, string> = {
  kirpejas: 'Kirpėjas/-a',
  koloristas: 'Koloristas/-ė',
  savininkas: 'Savininkas/-ė',
  kita: 'Kita',
}

export default async function PrintAttendeesPage() {
  await requireAdmin()
  const event = DAZU_PREZENTACIJA_2026
  const all = await getEventRegistrations(event.slug)
  const list = all
    .filter((r) => r.status === 'confirmed' || r.status === 'attended')
    .sort((a, b) =>
      `${a.lastName} ${a.firstName}`.localeCompare(
        `${b.lastName} ${b.firstName}`,
        'lt'
      )
    )

  const totalPeople = list.reduce((s, r) => s + 1 + r.guestsCount, 0)

  return (
    <>
      {/* Spausdinimui — paslepiam admin chrome ir taikom kompaktišką stilių */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: white !important; }
              aside, [data-admin-sidebar], header[data-admin-topbar],
              .admin-sidebar, .admin-topbar { display: none !important; }
              .print-page { padding: 0 !important; margin: 0 !important; }
              .print-hide { display: none !important; }
              @page { margin: 1cm; size: A4; }
            }
          `,
        }}
      />

      <div className="print-page max-w-4xl mx-auto bg-white">
        <div className="print-hide mb-4 flex items-center justify-between">
          <a
            href="/admin/renginiai"
            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
          >
            ← Atgal
          </a>
          <PrintButton />
        </div>

        <header className="border-b border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="mt-1 text-sm">
            {formatEventDateLt(event)} · {event.venueName}, {event.venueStreet},{' '}
            {event.venueCity}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <div>
              Dalyvių: <strong>{list.length}</strong> registr. /{' '}
              <strong>{totalPeople}</strong> žmonių (su svečiais)
            </div>
            <div>
              Sąrašas atspausdintas:{' '}
              {new Date().toLocaleString('lt-LT', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </div>
          </div>
        </header>

        {list.length === 0 ? (
          <div className="text-sm">Registracijų nėra.</div>
        ) : (
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-2 w-[28px]">✓</th>
                <th className="py-2 pr-2 w-[28px]">#</th>
                <th className="py-2 pr-2">Vardas, pavardė</th>
                <th className="py-2 pr-2">Salonas / pareigos</th>
                <th className="py-2 pr-2">Telefonas</th>
                <th className="py-2 pr-2 text-center w-[60px]">+Sveč.</th>
                <th className="py-2 pr-2 w-[100px]">Būsena</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.id} className="border-b border-gray-300 align-top">
                  <td className="py-2 pr-2">
                    <span className="inline-block w-4 h-4 border border-black"></span>
                  </td>
                  <td className="py-2 pr-2 tabular-nums">{i + 1}</td>
                  <td className="py-2 pr-2">
                    <div className="font-semibold">
                      {r.firstName} {r.lastName}
                    </div>
                    <div className="text-[11px] text-gray-600">{r.email}</div>
                  </td>
                  <td className="py-2 pr-2">
                    <div>{r.salonName || '—'}</div>
                    <div className="text-[11px] text-gray-600">
                      {r.role ? (ROLE_LABELS[r.role] ?? r.role) : ''}
                    </div>
                  </td>
                  <td className="py-2 pr-2 tabular-nums">{r.phone}</td>
                  <td className="py-2 pr-2 text-center font-semibold">
                    {r.guestsCount > 0 ? `+${r.guestsCount}` : '—'}
                  </td>
                  <td className="py-2 pr-2">
                    {STATUS_LABELS[r.status] ?? r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="mt-8 pt-4 border-t border-gray-400 text-[11px] text-gray-600">
          Color SHOCK · Dažai Kirpėjams · {event.contactEmail}
        </footer>
      </div>
    </>
  )
}

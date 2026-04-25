import { requireAdmin } from '@/lib/admin/auth'
import { getEventRegistrations } from '@/lib/admin/queries'
import {
  DAZU_PREZENTACIJA_2026,
  formatEventDateLt,
  isEventPast,
} from '@/lib/events/config'
import { EventRegistrationsTable } from './EventRegistrationsTable'

export const metadata = {
  title: 'Renginiai',
}

export const dynamic = 'force-dynamic'

const EVENT = DAZU_PREZENTACIJA_2026

export default async function AdminEventsPage({
  searchParams,
}: PageProps<'/admin/renginiai'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const errorMessage =
    errorParam === 'invalid-id'
      ? 'Trūksta ID.'
      : errorParam === 'update-failed'
        ? 'Nepavyko atnaujinti.'
        : errorParam === 'delete-failed'
          ? 'Nepavyko ištrinti.'
          : errorParam === 'invalid-status'
            ? 'Neteisingas statusas.'
            : null

  const registrations = await getEventRegistrations(EVENT.slug)

  // KPI skaičiavimai
  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const attended = registrations.filter((r) => r.status === 'attended')
  const cancelled = registrations.filter((r) => r.status === 'cancelled')
  const noShow = registrations.filter((r) => r.status === 'no_show')

  // Bendras žmonių skaičius — pats + svečiai (tik patvirtintoms/atvykusioms)
  const totalPeople = [...confirmed, ...attended].reduce(
    (sum, r) => sum + 1 + r.guestsCount,
    0
  )

  const past = isEventPast(EVENT)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Renginiai</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Registracijos viešiems renginiams ir prezentacijoms.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* Aktyvaus renginio kortelė */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-brand-gray-900">
                {EVENT.title}
              </h3>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  past
                    ? 'bg-gray-100 text-gray-500 border-gray-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {past ? 'Pasibaigęs' : 'Aktyvus'}
              </span>
            </div>
            <div className="mt-1 text-sm text-brand-gray-500">
              {formatEventDateLt(EVENT)} · {EVENT.venueName},{' '}
              {EVENT.venueCity}
            </div>
          </div>
          <a
            href="/lt/renginys"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
          >
            Atidaryti viešą puslapį →
          </a>
        </div>
      </section>

      {/* KPI kortelės */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          label="Patvirtinta"
          value={confirmed.length}
          color="blue"
        />
        <KpiCard label="Dalyvavo" value={attended.length} color="emerald" />
        <KpiCard label="Atšaukta" value={cancelled.length} color="gray" />
        <KpiCard label="Neatvyko" value={noShow.length} color="red" />
        <KpiCard
          label={`Iš viso žmonių / ${EVENT.capacityMax}`}
          value={totalPeople}
          color="magenta"
        />
      </div>

      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <EventRegistrationsTable registrations={registrations} />
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'emerald' | 'gray' | 'red' | 'magenta'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    magenta: 'bg-brand-magenta/5 text-brand-magenta border-brand-magenta/20',
  }
  return (
    <div className={`px-4 py-3 rounded-xl border ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[12px] font-semibold mt-0.5">{label}</div>
    </div>
  )
}

import { requireAdmin } from '@/lib/admin/auth'
import { getEventRegistrations } from '@/lib/admin/queries'
import { formatEventDateLt, isEventPast } from '@/lib/events/config'
import { getActiveEvent } from '@/lib/events/queries'
import { getEventVisibility } from '@/lib/events/visibility'
import { getEventWidgetPrefs } from '@/lib/admin/event-widgets'
import { setEventVisibilityAction } from './actions'
import { EventRegistrationsTable } from './EventRegistrationsTable'
import { Countdown } from './Countdown'
import {
  CapacityBar,
  ReminderStatus,
  RoleDistribution,
  RegistrationsTimeline,
} from './Widgets'
import { WidgetSettings } from './WidgetSettings'

export const metadata = {
  title: 'Renginiai',
}

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage({
  searchParams,
}: PageProps<'/admin/renginiai'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const savedParam = typeof sp.saved === 'string' ? sp.saved : undefined
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
  const savedMessage =
    savedParam === 'event' ? 'Renginio duomenys išsaugoti.' : null

  const EVENT = await getActiveEvent()
  const [registrations, prefs, eventVisible] = await Promise.all([
    getEventRegistrations(EVENT.slug),
    getEventWidgetPrefs(),
    getEventVisibility(),
  ])

  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const attended = registrations.filter((r) => r.status === 'attended')
  const cancelled = registrations.filter((r) => r.status === 'cancelled')
  const noShow = registrations.filter((r) => r.status === 'no_show')

  const totalPeople = [...confirmed, ...attended].reduce(
    (sum, r) => sum + 1 + r.guestsCount,
    0
  )

  const past = isEventPast(EVENT)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">Renginiai</h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Registracijos viešiems renginiams ir prezentacijoms.
          </p>
        </div>
        <WidgetSettings prefs={prefs} />
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {savedMessage && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {savedMessage}
        </div>
      )}

      {/* Aktyvaus renginio kortelė — visada matoma */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  eventVisible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    eventVisible ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                {eventVisible ? 'Viešai matomas' : 'Paslėptas'}
              </span>
            </div>
            <div className="mt-1 text-sm text-brand-gray-500">
              {formatEventDateLt(EVENT)} · {EVENT.venueName},{' '}
              {EVENT.venueCity}
            </div>
            <p className="mt-2 text-[12px] text-brand-gray-500 max-w-xl">
              {eventVisible
                ? 'Renginio info rodoma homepage hero apačioje ir /renginys puslapyje. Sitemap įraše — taip.'
                : 'Renginio info paslėpta: homepage sekcija nerodoma, /renginys grąžina 404, sitemap nuoroda išimta.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <a
              href="/admin/renginiai/redaguoti"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[12px] font-semibold transition-colors"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Redaguoti renginį
            </a>
            <form action={setEventVisibilityAction}>
              <input
                type="hidden"
                name="visible"
                value={eventVisible ? 'false' : 'true'}
              />
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border ${
                  eventVisible
                    ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                    : 'bg-brand-magenta border-brand-magenta text-white hover:bg-brand-magenta-dark'
                }`}
              >
                {eventVisible ? 'Išjungti renginio info' : 'Įjungti renginio info'}
              </button>
            </form>
            <a
              href="/renginys"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
            >
              Atidaryti viešą puslapį →
            </a>
          </div>
        </div>
      </section>

      {/* Apžvalgos eilė: Countdown + Capacity + ReminderStatus */}
      {(prefs.countdown || prefs.capacity || prefs.reminderStatus) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prefs.countdown && (
            <Countdown
              startsAtIso={EVENT.startsAtIso}
              endsAtIso={EVENT.endsAtIso}
            />
          )}
          {prefs.capacity && (
            <CapacityBar
              totalPeople={totalPeople}
              capacityMax={EVENT.capacityMax}
              capacityMin={EVENT.capacityMin}
            />
          )}
          {prefs.reminderStatus && (
            <ReminderStatus
              registrations={registrations}
              startsAtIso={EVENT.startsAtIso}
            />
          )}
        </div>
      )}

      {/* KPI kortelės */}
      {prefs.kpi && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard label="Patvirtinta" value={confirmed.length} color="blue" />
          <KpiCard label="Dalyvavo" value={attended.length} color="emerald" />
          <KpiCard label="Atšaukta" value={cancelled.length} color="gray" />
          <KpiCard label="Neatvyko" value={noShow.length} color="red" />
          <KpiCard
            label={`Iš viso žmonių / ${EVENT.capacityMax}`}
            value={totalPeople}
            color="magenta"
          />
        </div>
      )}

      {/* Statistikos eilė */}
      {(prefs.roleDistribution || prefs.timeline) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prefs.roleDistribution && (
            <RoleDistribution registrations={registrations} />
          )}
          {prefs.timeline && (
            <RegistrationsTimeline registrations={registrations} />
          )}
        </div>
      )}

      {/* Registracijų lentelė */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <EventRegistrationsTable
          registrations={registrations}
          features={{
            bulkActions: prefs.bulkActions,
            manualEmail: prefs.manualEmail,
            notes: prefs.notes,
            csvExport: prefs.csvExport,
            printView: prefs.printView,
          }}
        />
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

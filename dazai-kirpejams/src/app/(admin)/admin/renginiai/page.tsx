import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { getEventRegistrations } from '@/lib/admin/queries'
import { formatEventDateLt, isEventPast } from '@/lib/events/config'
import { getAllEvents, type EventAdminInfo } from '@/lib/events/queries'
import { getEventWidgetPrefs } from '@/lib/admin/event-widgets'
import { deleteEventAction, setEventActiveAction } from './actions'
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

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-id': 'Trūksta ID.',
  'invalid-slug': 'Trūksta renginio identifikatoriaus.',
  'update-failed': 'Nepavyko atnaujinti.',
  'delete-failed': 'Nepavyko ištrinti.',
  'invalid-status': 'Neteisingas statusas.',
}

const SAVED_MESSAGES: Record<string, string> = {
  event: 'Renginio duomenys išsaugoti.',
  activated: 'Renginys įjungtas — matomas viešai.',
  deactivated: 'Renginys išjungtas — viešai paslėptas.',
  deleted: 'Renginys ištrintas.',
}

export default async function AdminEventsPage({
  searchParams,
}: PageProps<'/admin/renginiai'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const savedParam = typeof sp.saved === 'string' ? sp.saved : undefined
  const selectedSlug = typeof sp.slug === 'string' ? sp.slug : undefined
  const errorMessage = errorParam ? ERROR_MESSAGES[errorParam] ?? null : null
  const savedMessage = savedParam ? SAVED_MESSAGES[savedParam] ?? null : null

  const [events, prefs] = await Promise.all([
    getAllEvents(),
    getEventWidgetPrefs(),
  ])

  // Pasirinktas renginys analitikai (registracijos, KPI, widgets) —
  // arba iš URL ?slug=, arba pirmasis sąraše.
  const focused: EventAdminInfo | null =
    events.find((e) => e.slug === selectedSlug) ?? events[0] ?? null

  const registrations = focused ? await getEventRegistrations(focused.slug) : []
  const confirmed = registrations.filter((r) => r.status === 'confirmed')
  const attended = registrations.filter((r) => r.status === 'attended')
  const cancelled = registrations.filter((r) => r.status === 'cancelled')
  const noShow = registrations.filter((r) => r.status === 'no_show')
  const totalPeople = [...confirmed, ...attended].reduce(
    (sum, r) => sum + 1 + r.guestsCount,
    0,
  )

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">Renginiai</h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Visi sukurti renginiai. Kiekvieną galite redaguoti, įjungti/išjungti
            arba ištrinti atskirai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/renginiai/naujas"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[12px] font-semibold transition-colors"
          >
            + Naujas renginys
          </Link>
          <WidgetSettings prefs={prefs} />
        </div>
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

      {/* Renginių sąrašas */}
      <section className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#eee] p-8 text-center">
            <p className="text-sm text-brand-gray-500">
              Nesukurta nė vieno renginio.
            </p>
            <Link
              href="/admin/renginiai/naujas"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[13px] font-semibold transition-colors"
            >
              Sukurti pirmą renginį
            </Link>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.slug}
              event={event}
              isFocused={focused?.slug === event.slug}
              focusable={events.length > 1}
            />
          ))
        )}
      </section>

      {/* Pasirinkto renginio analitika ir registracijos */}
      {focused && (
        <>
          <div className="border-t border-[#eee] pt-6">
            <h3 className="text-lg font-bold text-brand-gray-900">
              Registracijos: {focused.shortTitle || focused.title}
            </h3>
            <p className="mt-1 text-[12px] text-brand-gray-500">
              {events.length > 1
                ? 'Norite peržiūrėti kito renginio registracijas? Spauskite „Registracijos" jo kortelėje aukščiau.'
                : 'Visi šio renginio dalyviai ir jų būsenos.'}
            </p>
          </div>

          {(prefs.countdown || prefs.capacity || prefs.reminderStatus) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {prefs.countdown && (
                <Countdown
                  startsAtIso={focused.startsAtIso}
                  endsAtIso={focused.endsAtIso}
                />
              )}
              {prefs.capacity && (
                <CapacityBar
                  totalPeople={totalPeople}
                  capacityMax={focused.capacityMax}
                  capacityMin={focused.capacityMin}
                />
              )}
              {prefs.reminderStatus && (
                <ReminderStatus
                  registrations={registrations}
                  startsAtIso={focused.startsAtIso}
                />
              )}
            </div>
          )}

          {prefs.kpi && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KpiCard label="Patvirtinta" value={confirmed.length} color="blue" />
              <KpiCard label="Dalyvavo" value={attended.length} color="emerald" />
              <KpiCard label="Atšaukta" value={cancelled.length} color="gray" />
              <KpiCard label="Neatvyko" value={noShow.length} color="red" />
              <KpiCard
                label={`Iš viso žmonių / ${focused.capacityMax}`}
                value={totalPeople}
                color="magenta"
              />
            </div>
          )}

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
        </>
      )}
    </div>
  )
}

function EventCard({
  event,
  isFocused,
  focusable,
}: {
  event: EventAdminInfo
  isFocused: boolean
  focusable: boolean
}) {
  const past = isEventPast(event)
  const dateStr = formatEventDateLt(event)
  const slug = event.slug

  return (
    <section
      className={`bg-white rounded-xl border p-5 transition-colors ${
        isFocused
          ? 'border-brand-magenta/50 shadow-[0_2px_12px_rgba(233,30,140,0.08)]'
          : 'border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-brand-gray-900">
              {event.title}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                past
                  ? 'bg-gray-100 text-gray-500 border-gray-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {past ? 'Pasibaigęs' : 'Būsimas'}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                event.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  event.isActive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              {event.isActive ? 'Įjungtas' : 'Išjungtas'}
            </span>
            {isFocused && focusable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                Rodomas žemiau
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-brand-gray-500">
            {dateStr} · {event.venueName}, {event.venueCity}
          </div>
          <div className="mt-1 text-[11px] text-brand-gray-500 font-mono">
            {slug}
          </div>
          {!past && (
            <p className="mt-2 text-[11px] text-brand-gray-500 max-w-xl leading-relaxed">
              {event.isActive
                ? 'Renginys matomas viešai ir registruotiems dalyviams bus išsiųstas priminimas likus ~24 h. Jei renginys neįvyks (techninės kliūtys) — paspauskite „Išjungti", tada priminimo el. laiškas NEBUS siunčiamas.'
                : 'Išjungta: viešas puslapis 404, homepage sekcija paslėpta ir priminimo el. laiškai NESIUNČIAMI. Įjunkite, kai renginys patvirtintas.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Link
            href={`/admin/renginiai/${encodeURIComponent(slug)}/redaguoti`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded-lg text-[12px] font-semibold transition-colors"
          >
            Redaguoti
          </Link>
          <form action={setEventActiveAction}>
            <input type="hidden" name="slug" value={slug} />
            <input
              type="hidden"
              name="active"
              value={event.isActive ? 'false' : 'true'}
            />
            <button
              type="submit"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors border ${
                event.isActive
                  ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                  : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {event.isActive ? 'Išjungti' : 'Įjungti'}
            </button>
          </form>
          {focusable && !isFocused && (
            <Link
              href={`/admin/renginiai?slug=${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#eee] text-brand-gray-900 hover:bg-brand-gray-50 rounded-lg text-[12px] font-semibold transition-colors"
            >
              Registracijos
            </Link>
          )}
          <a
            href={`/renginys/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#eee] text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
            title="Atidaryti viešą puslapį"
          >
            Atidaryti ↗
          </a>
          <form
            action={deleteEventAction}
            onSubmit={undefined /* native confirm via button below */}
          >
            <input type="hidden" name="slug" value={slug} />
            <DeleteButton title={event.title} />
          </form>
        </div>
      </div>
    </section>
  )
}

function DeleteButton({ title }: { title: string }) {
  // Client-side confirm — be papildomo komponento (no use client). Naudojam
  // formaction trick'ą su native confirm() neturime — paliekam paprastą
  // submit'ą, kuris atveda redirect'ą po sėkmingo trinimo.
  return (
    <button
      type="submit"
      formNoValidate
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-lg text-[12px] font-semibold transition-colors"
      title={`Trinti „${title}"`}
    >
      Trinti
    </button>
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

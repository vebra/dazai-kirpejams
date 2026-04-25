import type { EventRegistrationRow } from '@/lib/admin/queries'

/**
 * Server-rendered widget'ai renginių dashboard'ui. Visi prima jau filtruotus/
 * skaičiuotus duomenis iš puslapio — patys neužklausia DB.
 */

export function CapacityBar({
  totalPeople,
  capacityMax,
  capacityMin,
}: {
  totalPeople: number
  capacityMax: number
  capacityMin?: number
}) {
  const pct = Math.min(100, Math.round((totalPeople / capacityMax) * 100))
  const remaining = Math.max(0, capacityMax - totalPeople)

  let barColor = 'bg-blue-500'
  let bgColor = 'bg-blue-50'
  let textColor = 'text-blue-700'
  let borderColor = 'border-blue-200'
  let label = `Liko ${remaining} ${pluralizeSeats(remaining)}`

  if (remaining <= 0) {
    barColor = 'bg-red-500'
    bgColor = 'bg-red-50'
    textColor = 'text-red-700'
    borderColor = 'border-red-200'
    label = 'Vietos užpildytos'
  } else if (remaining <= 5) {
    barColor = 'bg-brand-magenta'
    bgColor = 'bg-brand-magenta/5'
    textColor = 'text-brand-magenta'
    borderColor = 'border-brand-magenta/30'
    label = `Liko tik ${remaining} ${pluralizeSeats(remaining)}!`
  } else if (pct >= 70) {
    barColor = 'bg-amber-500'
    bgColor = 'bg-amber-50'
    textColor = 'text-amber-700'
    borderColor = 'border-amber-200'
  }

  const minNote =
    capacityMin !== undefined && totalPeople < capacityMin
      ? `Iki minimumo trūksta: ${capacityMin - totalPeople}`
      : null

  return (
    <div className={`px-5 py-4 rounded-xl border ${bgColor} ${borderColor}`}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className={`text-[11px] font-semibold uppercase tracking-[0.5px] ${textColor}`}>
            Vietų užimtumas
          </div>
          <div className="mt-0.5 text-2xl font-bold text-brand-gray-900 tabular-nums">
            {totalPeople} / {capacityMax}
          </div>
        </div>
        <div className={`text-sm font-semibold ${textColor}`}>{label}</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
          aria-label={`${pct}% užpildyta`}
        />
      </div>
      {minNote && (
        <div className="mt-2 text-[11px] text-brand-gray-500">{minNote}</div>
      )}
    </div>
  )
}

function pluralizeSeats(n: number): string {
  if (n === 1) return 'vieta'
  if (n >= 2 && n <= 9) return 'vietos'
  return 'vietų'
}

export function ReminderStatus({
  registrations,
  startsAtIso,
}: {
  registrations: EventRegistrationRow[]
  startsAtIso: string
}) {
  const eligible = registrations.filter(
    (r) => r.status === 'confirmed' || r.status === 'attended'
  )
  const sent = eligible.filter((r) => r.reminderSentAt !== null)
  const pending = eligible.length - sent.length

  const lastSent = sent
    .map((r) => r.reminderSentAt!)
    .sort()
    .pop()

  const startsAt = new Date(startsAtIso).getTime()
  const hoursUntil = Math.round((startsAt - Date.now()) / (60 * 60 * 1000))

  let cronInfo: string
  if (hoursUntil <= 0) {
    cronInfo = 'Cron nebesiųs (renginys jau įvyko / vyksta)'
  } else if (hoursUntil >= 20 && hoursUntil <= 28) {
    cronInfo = 'Cron šiuo metu yra siuntimo lange'
  } else if (hoursUntil < 20) {
    cronInfo = `Cron praėjo siuntimo langą (liko ${hoursUntil}h)`
  } else {
    cronInfo = `Cron įsijungs likus ~24h (dabar ~${hoursUntil}h)`
  }

  return (
    <div className="px-5 py-4 rounded-xl border border-[#eee] bg-white">
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
        Priminimo būsena
      </div>
      <div className="mt-2 grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {sent.length}
          </div>
          <div className="text-[12px] text-brand-gray-500 font-semibold">
            Išsiųsta
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-700 tabular-nums">
            {pending}
          </div>
          <div className="text-[12px] text-brand-gray-500 font-semibold">
            Belaukia
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-[#eee] space-y-1 text-[11px] text-brand-gray-500">
        {lastSent && (
          <div>
            Paskutinis siuntimas: {' '}
            <span className="text-brand-gray-900 font-semibold">
              {new Date(lastSent).toLocaleString('lt-LT', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          </div>
        )}
        <div>{cronInfo}</div>
      </div>
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  kirpejas: 'Kirpėjai',
  koloristas: 'Koloristai',
  savininkas: 'Savininkai',
  kita: 'Kita',
}

const ROLE_COLORS: Record<string, string> = {
  kirpejas: 'bg-brand-magenta',
  koloristas: 'bg-blue-500',
  savininkas: 'bg-emerald-500',
  kita: 'bg-amber-500',
  unknown: 'bg-gray-400',
}

export function RoleDistribution({
  registrations,
}: {
  registrations: EventRegistrationRow[]
}) {
  const active = registrations.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'no_show'
  )
  const total = active.length

  if (total === 0) {
    return (
      <div className="px-5 py-4 rounded-xl border border-[#eee] bg-white">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Pareigų paskirstymas
        </div>
        <div className="mt-2 text-sm text-brand-gray-500">
          Dar nėra registracijų.
        </div>
      </div>
    )
  }

  const counts = new Map<string, number>()
  for (const r of active) {
    const key = r.role ?? 'unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const rows = Array.from(counts.entries())
    .map(([key, count]) => ({
      key,
      label: ROLE_LABELS[key] ?? 'Nenurodyta',
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="px-5 py-4 rounded-xl border border-[#eee] bg-white">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Pareigų paskirstymas
        </div>
        <div className="text-[11px] text-brand-gray-500">
          iš {total} reg.
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mt-3 h-3 rounded-full bg-[#F5F5F7] overflow-hidden flex">
        {rows.map((r) => (
          <div
            key={r.key}
            className={ROLE_COLORS[r.key] ?? ROLE_COLORS.unknown}
            style={{ width: `${r.pct}%` }}
            title={`${r.label}: ${r.count} (${r.pct}%)`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2 text-[12px]">
            <span
              className={`w-2.5 h-2.5 rounded-sm ${ROLE_COLORS[r.key] ?? ROLE_COLORS.unknown}`}
            />
            <span className="text-brand-gray-900 font-semibold">{r.label}</span>
            <span className="text-brand-gray-500 ml-auto tabular-nums">
              {r.count} · {r.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RegistrationsTimeline({
  registrations,
  days = 14,
}: {
  registrations: EventRegistrationRow[]
  days?: number
}) {
  // Sukuriam day buckets nuo paskutinių `days` iki šiandien (Europe/Vilnius nesiskiria
  // nuo lokalios server datos pakankamai, kad būtų problema MVP'ui).
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets: Array<{ key: string; label: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    buckets.push({ key, label, count: 0 })
  }

  const bucketByKey = new Map(buckets.map((b) => [b.key, b]))
  for (const r of registrations) {
    const day = r.createdAt.slice(0, 10)
    const b = bucketByKey.get(day)
    if (b) b.count += 1
  }

  const max = Math.max(1, ...buckets.map((b) => b.count))
  const total = buckets.reduce((s, b) => s + b.count, 0)

  return (
    <div className="px-5 py-4 rounded-xl border border-[#eee] bg-white">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
          Registracijos per pastarąsias {days} d.
        </div>
        <div className="text-[11px] text-brand-gray-500">
          {total} viso
        </div>
      </div>

      <div className="mt-3 flex items-end gap-1 h-24">
        {buckets.map((b) => {
          const h = b.count === 0 ? 4 : Math.max(8, (b.count / max) * 96)
          return (
            <div
              key={b.key}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              <div
                className={`w-full rounded-t ${
                  b.count === 0 ? 'bg-[#F5F5F7]' : 'bg-brand-magenta/70 hover:bg-brand-magenta'
                } transition-colors`}
                style={{ height: `${h}px` }}
              />
              {b.count > 0 && (
                <span className="absolute -top-5 text-[10px] font-semibold text-brand-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  {b.count}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-brand-gray-500 tabular-nums">
        <span>{buckets[0]?.label}</span>
        <span>{buckets[Math.floor(buckets.length / 2)]?.label}</span>
        <span>{buckets[buckets.length - 1]?.label}</span>
      </div>
    </div>
  )
}

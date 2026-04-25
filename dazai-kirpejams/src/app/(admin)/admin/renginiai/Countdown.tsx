'use client'

import { useEffect, useState } from 'react'

/**
 * Atgalinis laikrodis iki renginio pradžios. Atnaujinama kas minutę —
 * dažniau nereikia, nes rodom tik dienas/valandas/minutes.
 */
export function Countdown({
  startsAtIso,
  endsAtIso,
}: {
  startsAtIso: string
  endsAtIso: string
}) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (now === null) {
    // SSR + pirma kliento iteracija — tas pats output'as kad nebūtų hydration mismatch
    return (
      <div className="px-5 py-4 rounded-xl border border-[#eee] bg-white text-sm text-brand-gray-500">
        Skaičiuojamas laikas…
      </div>
    )
  }

  const startsAt = new Date(startsAtIso).getTime()
  const endsAt = new Date(endsAtIso).getTime()
  const diff = startsAt - now

  if (now >= startsAt && now <= endsAt) {
    return (
      <div className="px-5 py-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px]">
          Renginys vyksta
        </div>
        <div className="text-lg font-bold mt-0.5">Dabar dirbam su grupe</div>
      </div>
    )
  }

  if (now > endsAt) {
    return (
      <div className="px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px]">
          Renginys pasibaigęs
        </div>
        <div className="text-lg font-bold mt-0.5">
          {formatPastDuration(now - endsAt)} po pabaigos
        </div>
      </div>
    )
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))

  // Spalvos pagal artumą
  let palette = 'border-blue-200 bg-blue-50 text-blue-800'
  if (days <= 1) palette = 'border-brand-magenta/30 bg-brand-magenta/5 text-brand-magenta'
  else if (days <= 7) palette = 'border-amber-200 bg-amber-50 text-amber-800'

  return (
    <div className={`px-5 py-4 rounded-xl border ${palette}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.5px] opacity-80">
        Iki renginio liko
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        {days > 0 && (
          <Unit value={days} label={pluralizeDays(days)} />
        )}
        <Unit value={hours} label={pluralizeHours(hours)} />
        {days === 0 && <Unit value={minutes} label="min." />}
      </div>
    </div>
  )
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-sm font-semibold opacity-70">{label}</span>
    </div>
  )
}

function pluralizeDays(n: number): string {
  if (n === 1) return 'diena'
  if (n >= 2 && n <= 9) return 'dienos'
  return 'dienų'
}

function pluralizeHours(n: number): string {
  if (n === 1) return 'valanda'
  if (n >= 2 && n <= 9) return 'valandos'
  return 'valandų'
}

function formatPastDuration(ms: number): string {
  const days = Math.floor(ms / (24 * 60 * 60 * 1000))
  if (days >= 1) return `${days} ${pluralizeDays(days)}`
  const hours = Math.floor(ms / (60 * 60 * 1000))
  return `${hours} ${pluralizeHours(hours)}`
}

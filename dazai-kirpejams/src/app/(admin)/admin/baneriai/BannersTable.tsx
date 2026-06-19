'use client'

import Link from 'next/link'
import { toggleBannerActiveAction, deleteBannerAction } from './actions'
import { SubmitButton } from '@/components/ui/SubmitButton'
import type { BannerRow, BannerStats } from '@/lib/admin/queries'

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
})

const PLACEMENT_LABELS: Record<string, string> = {
  hero: 'Hero (pagrindinis)',
  announcement: 'Akcijų juosta',
  marquee: 'Bėganti juosta',
  brandstrip: 'Brand juosta',
  category: 'Kategorijos',
}

type DisplayStatus = {
  label: string
  cls: string
}

/**
 * Faktinė rodymo būsena. Kiekviena pozicija rodo tik PIRMĄ aktyvų banerį
 * (pagal sort_order) — kiti aktyvūs tos pačios pozicijos baneriai laukia
 * eilėje ir svetainėje nesimato.
 */
function displayStatus(
  banner: BannerRow,
  banners: BannerRow[],
  now: number
): DisplayStatus {
  if (!banner.isActive) {
    return { label: 'Išjungtas', cls: 'bg-gray-100 text-gray-500' }
  }
  if (banner.startsAt && new Date(banner.startsAt).getTime() > now) {
    return { label: 'Suplanuotas', cls: 'bg-blue-50 text-blue-700' }
  }
  if (banner.endsAt && new Date(banner.endsAt).getTime() < now) {
    return { label: 'Pasibaigęs', cls: 'bg-gray-100 text-gray-500' }
  }
  const shownInPlacement = banners.find(
    (b) =>
      b.placement === banner.placement &&
      b.isActive &&
      (!b.startsAt || new Date(b.startsAt).getTime() <= now) &&
      (!b.endsAt || new Date(b.endsAt).getTime() >= now)
  )
  if (shownInPlacement && shownInPlacement.id !== banner.id) {
    return { label: 'Eilėje (nerodomas)', cls: 'bg-amber-50 text-amber-700' }
  }
  return { label: 'Rodomas dabar', cls: 'bg-emerald-50 text-emerald-700' }
}

export function BannersTable({
  banners,
  stats,
  nowIso,
}: {
  banners: BannerRow[]
  stats: Record<string, BannerStats>
  nowIso: string
}) {
  const now = new Date(nowIso).getTime()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Link
          href="/admin/baneriai/naujas"
          className="px-4 py-2 bg-brand-magenta text-white text-sm font-semibold rounded-lg hover:bg-brand-magenta-dark transition-colors"
        >
          + Naujas baneris
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {banners.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            Banerių kol kas nėra. Sukurkite pirmąjį!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-6 py-3 text-left">Baneris</th>
                  <th className="px-6 py-3 text-left">Pozicija</th>
                  <th className="px-6 py-3 text-center">Eiliškumas</th>
                  <th className="px-6 py-3 text-center">Būsena</th>
                  <th className="px-6 py-3 text-center">Rodymas</th>
                  <th className="px-6 py-3 text-center">
                    Parodymai / Pasp.
                  </th>
                  <th className="px-6 py-3 text-left">Laikotarpis</th>
                  <th className="px-6 py-3 text-right">Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr
                    key={banner.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        href={`/admin/baneriai/${banner.id}`}
                        className="font-medium text-brand-gray-900 hover:text-brand-magenta transition-colors"
                      >
                        {banner.titleLt}
                      </Link>
                      {banner.badgeLt && (
                        <div className="text-[11px] text-brand-gray-500 mt-0.5">
                          {banner.badgeLt}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-brand-gray-500">
                      {PLACEMENT_LABELS[banner.placement] ?? banner.placement}
                    </td>
                    <td className="px-6 py-3 text-center text-brand-gray-500 tabular-nums">
                      {banner.sortOrder}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <form action={toggleBannerActiveAction}>
                        <input type="hidden" name="id" value={banner.id} />
                        <input
                          type="hidden"
                          name="activate"
                          value={banner.isActive ? 'false' : 'true'}
                        />
                        <SubmitButton
                          spinnerSize="w-3 h-3"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            banner.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {banner.isActive ? 'Aktyvus' : 'Neaktyvus'}
                        </SubmitButton>
                      </form>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {(() => {
                        const s = displayStatus(banner, banners, now)
                        return (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.cls}`}
                          >
                            {s.label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-3 text-center text-brand-gray-500 tabular-nums">
                      {/* Sekama kol kas tik akcijų juosta — kitoms pozicijoms „—" */}
                      {banner.placement === 'announcement'
                        ? `${stats[banner.id]?.impressions ?? 0} / ${stats[banner.id]?.clicks ?? 0}`
                        : '—'}
                    </td>
                    <td className="px-6 py-3 text-[12px] text-brand-gray-500">
                      {banner.startsAt || banner.endsAt ? (
                        <>
                          {banner.startsAt
                            ? DATE_FORMATTER.format(new Date(banner.startsAt))
                            : '—'}
                          {' → '}
                          {banner.endsAt
                            ? DATE_FORMATTER.format(new Date(banner.endsAt))
                            : '∞'}
                        </>
                      ) : (
                        'Visada'
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/baneriai/${banner.id}`}
                          className="px-3 py-1 text-[12px] font-medium text-brand-magenta hover:text-brand-magenta-dark transition-colors"
                        >
                          Redaguoti
                        </Link>
                        <form
                          action={deleteBannerAction}
                          onSubmit={(e) => {
                            if (
                              !confirm(
                                `Tikrai ištrinti "${banner.titleLt}"?`
                              )
                            ) {
                              e.preventDefault()
                            }
                          }}
                        >
                          <input type="hidden" name="id" value={banner.id} />
                          <SubmitButton
                            pendingLabel="Trinama…"
                            spinnerSize="w-3 h-3"
                            className="px-3 py-1 text-[12px] font-medium text-red-500 hover:text-red-700"
                          >
                            Trinti
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

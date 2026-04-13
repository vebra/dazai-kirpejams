'use client'

import Link from 'next/link'
import { toggleBannerActiveAction, deleteBannerAction } from './actions'
import type { BannerRow } from '@/lib/admin/queries'

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
})

const PLACEMENT_LABELS: Record<string, string> = {
  hero: 'Hero (pagrindinis)',
  category: 'Kategorijos',
}

export function BannersTable({ banners }: { banners: BannerRow[] }) {
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
                        <button
                          type="submit"
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            banner.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          {banner.isActive ? 'Aktyvus' : 'Neaktyvus'}
                        </button>
                      </form>
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
                          <button
                            type="submit"
                            className="px-3 py-1 text-[12px] font-medium text-red-500 hover:text-red-700 transition-colors"
                          >
                            Trinti
                          </button>
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

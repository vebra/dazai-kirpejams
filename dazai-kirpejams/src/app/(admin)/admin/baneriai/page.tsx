import { requireAdmin } from '@/lib/admin/auth'
import { getBanners, getBannerEventCounts } from '@/lib/admin/queries'
import { getVisibleUpcomingEvents } from '@/lib/events/queries'
import { BannersTable } from './BannersTable'

export const metadata = {
  title: 'Baneriai',
}

export const dynamic = 'force-dynamic'

export default async function AdminBannersPage() {
  await requireAdmin()

  const [banners, stats, upcomingEvents] = await Promise.all([
    getBanners(),
    getBannerEventCounts(),
    getVisibleUpcomingEvents(),
  ])

  // Server komponentas, force-dynamic — laikas fiksuojamas užklausos momentu.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const manualAnnouncementShown = banners.some(
    (b) =>
      b.placement === 'announcement' &&
      b.isActive &&
      (!b.startsAt || new Date(b.startsAt).getTime() <= now) &&
      (!b.endsAt || new Date(b.endsAt).getTime() >= now)
  )
  const autoEvent = upcomingEvents[0] ?? null
  const autoStats = autoEvent
    ? (stats[`event:${autoEvent.slug}`] ?? { impressions: 0, clicks: 0 })
    : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Baneriai
      </h1>

      {autoEvent && (
        <div className="mb-6 bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
              Automatinis renginio baneris
            </div>
            <div className="text-sm font-medium text-brand-gray-900">
              {autoEvent.shortTitle}
            </div>
            <div className="text-[12px] text-brand-gray-500 mt-0.5">
              {manualAnnouncementShown
                ? 'Nerodomas — jį nustelbia aktyvus rankinis akcijų juostos baneris.'
                : 'Rodomas akcijų juostoje, kol nėra rankinio banerio. Pasibaigus renginiui dings savaime.'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1">
              Parodymai / Paspaudimai
            </div>
            <div className="text-sm font-semibold text-brand-gray-900 tabular-nums">
              {autoStats!.impressions} / {autoStats!.clicks}
            </div>
          </div>
        </div>
      )}

      <BannersTable banners={banners} stats={stats} nowIso={new Date(now).toISOString()} />
    </div>
  )
}

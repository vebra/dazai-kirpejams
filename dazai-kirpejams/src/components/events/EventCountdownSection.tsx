import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { formatEventDateLt } from '@/lib/events/config'
import { getEventSpotsTaken } from '@/lib/data/queries'
import { getVisibleUpcomingEvents } from '@/lib/events/queries'

/**
 * Hero apačioje einanti renginio sekcija. Rodo arčiausią matomą upcoming
 * renginį iš `events` lentelės (per-event is_active filter'is). LT lokalei
 * tik — renginiai vyksta lietuviškai.
 */
export async function EventCountdownSection({
  lang,
}: {
  lang: 'lt' | 'en' | 'ru'
}) {
  if (lang !== 'lt') return null

  const upcoming = await getVisibleUpcomingEvents()
  const event = upcoming[0]
  if (!event) return null

  const taken = await getEventSpotsTaken(event.slug)
  const remaining = Math.max(0, event.capacityMax - taken)
  const isFull = remaining === 0
  const isLastFew = remaining > 0 && remaining <= 10
  const detailHref = `/renginys/${event.slug}`

  return (
    <section className="bg-brand-gray-900 text-white py-12 lg:py-16">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[2px] text-brand-magenta mb-4">
              <span className="w-2 h-2 rounded-full bg-brand-magenta animate-pulse" />
              Nemokamas renginys
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold mb-3 leading-tight">
              {event.title}
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-2">
              {formatEventDateLt(event)}
            </p>
            <p className="text-[1.05rem] text-white/75 mb-6">
              {event.venueName} · {event.venueStreet}, {event.venueCity}
            </p>
            <p className="text-[0.95rem] text-white/65 leading-[1.7] mb-7 max-w-[520px]">
              {event.description}
            </p>
            <Link
              href={detailHref}
              className="inline-flex items-center justify-center gap-2 px-9 py-[16px] bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.4)] transition-all"
            >
              {isFull ? 'Susisiekti dėl laukimo sąrašo' : 'Registruotis nemokamai'} →
            </Link>
          </div>

          <div className="bg-white/[0.06] border border-white/10 rounded-xl p-8 text-center">
            <div className="text-[0.75rem] font-bold uppercase tracking-[2px] text-white/55 mb-3">
              {isFull ? 'Visos vietos užimtos' : 'Likusios vietos'}
            </div>
            <div
              className={`text-[5rem] lg:text-[6rem] font-extrabold leading-none mb-1 ${
                isLastFew ? 'text-brand-magenta' : 'text-white'
              }`}
            >
              {remaining}
            </div>
            <div className="text-[0.95rem] text-white/55 mb-5">
              iš {event.capacityMax} vietų
            </div>
            {isLastFew && !isFull && (
              <div className="inline-block px-4 py-1.5 rounded-full bg-brand-magenta/15 border border-brand-magenta/30 text-[0.82rem] font-semibold text-brand-magenta">
                Skubėkite — vietų lieka mažai
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  )
}

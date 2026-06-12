import { getActiveBanners } from '@/lib/data/queries'
import { getVisibleUpcomingEvents } from '@/lib/events/queries'
import { langPrefix } from '@/lib/utils'
import type { Locale } from '@/i18n/config'
import { AnnouncementBarClient } from './AnnouncementBarClient'

/**
 * Akcijų juosta — naudoja banerį su placement='announcement' (banners lentelė).
 * Rodomas pirmas aktyvus (pagal sort_order), su data filtravimu (starts_at/ends_at).
 *
 * Jei rankinio banerio nėra — automatiškai rodo artimiausią matomą upcoming
 * renginį iš `events` lentelės (data ir nuoroda atsinaujina pačios, pasibaigus
 * renginiui juosta dingsta be admin įsikišimo). Rankinis baneris visada
 * nustelbia automatinį. Jei nėra nei banerio, nei renginio — nieko nerodo.
 */
export async function AnnouncementBar({ lang }: { lang: Locale }) {
  const banners = await getActiveBanners('announcement', lang)
  const b = banners[0]

  if (b) {
    const href = b.ctaUrl ? `${langPrefix(lang)}${b.ctaUrl}` : null
    return (
      <AnnouncementBarClient
        id={b.id}
        text={b.title}
        ctaText={b.ctaText}
        href={href}
        bg={b.backgroundColor}
      />
    )
  }

  // Automatinis renginio baneris
  const upcoming = await getVisibleUpcomingEvents()
  const event = upcoming[0]
  if (!event) return null

  const date = new Intl.DateTimeFormat(
    lang === 'lt' ? 'lt-LT' : lang === 'ru' ? 'ru-RU' : 'en-GB',
    { month: 'long', day: 'numeric', timeZone: 'Europe/Vilnius' }
  ).format(event.startsAt)

  const text =
    lang === 'en'
      ? `Free event: ${event.shortTitle} — ${date} (held in Lithuanian).`
      : lang === 'ru'
        ? `Бесплатное мероприятие: ${event.shortTitle} — ${date} (на литовском языке).`
        : `Nemokamas renginys: ${event.shortTitle} — ${date} · Vietų skaičius ribotas.`
  const ctaText =
    lang === 'en' ? 'Register' : lang === 'ru' ? 'Регистрация' : 'Registruotis'

  return (
    <AnnouncementBarClient
      id={`event:${event.slug}`}
      text={text}
      ctaText={ctaText}
      href={`${langPrefix(lang)}/renginys/${event.slug}`}
      bg={null}
    />
  )
}

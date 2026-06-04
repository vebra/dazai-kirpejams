import { getActiveBanners } from '@/lib/data/queries'
import { langPrefix } from '@/lib/utils'
import type { Locale } from '@/i18n/config'
import { AnnouncementBarClient } from './AnnouncementBarClient'

/**
 * Akcijų juosta — naudoja banerį su placement='announcement' (banners lentelė).
 * Rodomas pirmas aktyvus (pagal sort_order), su data filtravimu (starts_at/ends_at).
 * Jei tokio nėra — nieko nerodo.
 */
export async function AnnouncementBar({ lang }: { lang: Locale }) {
  const banners = await getActiveBanners('announcement', lang)
  const b = banners[0]
  if (!b) return null

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

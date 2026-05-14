import { notFound, redirect } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import {
  getNearestUpcomingVisibleEvent,
  getVisibleUpcomingEvents,
} from '@/lib/events/queries'

/**
 * /renginys (be slug'o) — istorinis SEO URL. Dabar serverina kaip:
 *   • 1 matomas renginys → 307 redirect į /renginys/<slug>
 *   • 2+ matomi renginiai → redirect į artimiausią (display_order + starts_at)
 *   • 0 matomų renginių → 404
 *
 * Visi atskirų renginių detalūs puslapiai gyvena /renginys/<slug>.
 */

export const revalidate = 60

export default async function EventLandingPage({
  params,
}: PageProps<'/[lang]/renginys'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  // Net jei kelis matomus renginius — vis tiek vežame į pirmą pagal
  // display_order, kad senas /renginys URL'as išliktų aukšta autoritetinga
  // landing'o vieta vienam renginiui (paprastai esamai prezentacijai).
  const upcoming = await getVisibleUpcomingEvents()
  if (upcoming.length === 0) {
    const nearest = await getNearestUpcomingVisibleEvent()
    if (!nearest) notFound()
    redirect(`/renginys/${nearest.slug}`)
  }

  redirect(`/renginys/${upcoming[0].slug}`)
}

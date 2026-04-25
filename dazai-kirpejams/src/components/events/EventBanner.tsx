import Link from 'next/link'
import {
  DAZU_PREZENTACIJA_2026,
  isEventPast,
} from '@/lib/events/config'

/**
 * Hero juosta virš pagrindinio puslapio — rodoma tol, kol renginys neįvyko.
 * Server component'as — rodymo sprendimas daromas build/ISR metu (60s
 * revalidate iš home page), tad nieko klientui siųsti nereikia.
 */
export function EventBanner({ lang }: { lang: 'lt' | 'en' | 'ru' }) {
  if (isEventPast(DAZU_PREZENTACIJA_2026)) return null

  // Renginys LT tik — EN/RU banner'io nerodom, kad nesukurtume link'o
  // į redirect'ą. Jei vėliau renginys bus EN/RU lokalizuotas, šitą tik
  // nuimam.
  if (lang !== 'lt') return null

  const href = '/lt/renginys'

  return (
    <Link
      href={href}
      className="block bg-brand-gray-900 text-white hover:bg-[#000] transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center text-[13px] sm:text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-magenta animate-pulse" />
          Gegužės 17 d. Kaune
        </span>
        <span className="hidden sm:inline text-white/40">·</span>
        <span className="text-white/80">
          Nemokama Color SHOCK dažų prezentacija — registruokitės
        </span>
        <span className="inline-flex items-center gap-1 text-brand-magenta font-semibold group-hover:underline">
          →
        </span>
      </div>
    </Link>
  )
}

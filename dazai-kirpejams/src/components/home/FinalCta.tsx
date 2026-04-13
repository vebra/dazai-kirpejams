import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

type FinalCtaProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Galutinis CTA — baltas fonas, centruotas tekstas su section-label,
 * h2, aprašymu ir dviem mygtukais (magenta + juodas outline).
 */
export function FinalCta({ lang, dict: _dict }: FinalCtaProps) {
  return (
    <section className="py-20 bg-white text-center">
      <Container>
        <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
          Pradėkite dabar
        </span>
        <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 mb-4 leading-tight">
          Pasiruošę išbandyti?
        </h2>
        <p className="text-[1.1rem] text-brand-gray-500 mb-9 max-w-2xl mx-auto leading-[1.7]">
          Profesionalūs dažai su 180 ml talpa — daugiau vertės kiekvienam
          dažymui Jūsų salone.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={`${langPrefix(lang)}/produktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
          >
            Pirkti dabar →
          </Link>
          <Link
            href={`${langPrefix(lang)}/kontaktai`}
            className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.1rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
          >
            Susisiekti
          </Link>
        </div>
      </Container>
    </section>
  )
}

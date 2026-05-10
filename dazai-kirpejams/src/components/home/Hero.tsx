import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { getActiveBanners, type Banner } from '@/lib/data/queries'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

type HeroProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Hero blokas — naudoja banerį iš DB (banners lentelė, placement='hero').
 * Jei DB baneris nerastas — rodo hardcoded fallback su kvalifikacine antrašte.
 */
export async function Hero({ lang, dict }: HeroProps) {
  const hero = dict.hero
  const banners = await getActiveBanners('hero', lang)
  const banner: Banner | null = banners[0] ?? null

  const badge = banner?.badge ?? hero.badgeFallback
  const title = banner?.title ?? null
  const ctaText = banner?.ctaText ?? hero.cta
  const ctaUrl = banner?.ctaUrl
    ? `${langPrefix(lang)}${banner.ctaUrl}`
    : `${langPrefix(lang)}/prisijungimas`
  const ctaSecondaryText = banner?.ctaSecondaryText ?? hero.ctaSecondary
  const ctaSecondaryUrl = banner?.ctaSecondaryUrl
    ? `${langPrefix(lang)}${banner.ctaSecondaryUrl}`
    : `${langPrefix(lang)}/salonams`

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] py-10 lg:py-20">
      <Container>
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-[60px] items-center">
          {/* KAIRĖ — turinys */}
          <div className="max-w-[600px] mx-auto lg:mx-0 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 bg-brand-magenta/[0.08] text-brand-magenta px-4 py-2 rounded-full text-[0.78rem] font-semibold mb-5">
              <span aria-hidden>★</span>
              <span>{badge}</span>
            </div>

            {title ? (
              <h1 className="text-[clamp(1.85rem,4.5vw,3rem)] font-bold leading-[1.15] text-brand-gray-900 mb-4">
                {title}
              </h1>
            ) : (
              <h1 className="text-[clamp(1.85rem,4.5vw,3rem)] font-bold leading-[1.15] text-brand-gray-900 mb-4">
                {hero.titleStart}{' '}
                <span className="text-brand-magenta">{hero.titleAccent}</span>{' '}
                {hero.titleEnd}
              </h1>
            )}

            <p className="text-[1rem] lg:text-[1.05rem] text-brand-gray-700 leading-[1.6] font-medium mb-7 max-w-[540px] mx-auto lg:mx-0">
              {hero.subheader}
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-4">
              <Link
                href={ctaUrl}
                className="inline-flex items-center justify-center gap-2 px-9 py-[16px] bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {ctaText}
              </Link>
              <Link
                href={ctaSecondaryUrl}
                className="inline-flex items-center justify-center gap-2 px-9 py-[16px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.05rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
              >
                {ctaSecondaryText} →
              </Link>
            </div>

            <p className="text-[0.85rem] text-brand-gray-500 mb-7 max-w-[480px] mx-auto lg:mx-0">
              {hero.priceNote}
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-2.5 justify-center lg:justify-start text-[0.82rem] font-medium text-brand-gray-700 pt-5 border-t border-[#E8E8E8]">
              {[hero.trust1, hero.trust2, hero.trust3, hero.trust4].map(
                (t: string) => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <span className="text-brand-magenta font-bold">✓</span>
                    {t}
                  </span>
                )
              )}
            </div>
          </div>

          {/* DEŠINĖ — 180 ml vs 60 ml palyginimas */}
          <div className="relative flex flex-col items-center justify-center">
            <div className="relative flex items-end gap-6 sm:gap-10">
              {/* 180 ml — mūsų */}
              <div className="flex flex-col items-center">
                <div className="w-[10px] h-[22px] bg-brand-gray-900 rounded-t-sm" />
                <div className="w-[12px] h-[8px] bg-brand-gray-900" />
                <div className="relative w-[120px] sm:w-[140px] h-[280px] sm:h-[320px] bg-brand-gray-900 rounded-b-2xl rounded-t-md flex flex-col items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[14%] bg-white/[0.05] border-b border-white/10" />
                  <div className="absolute inset-x-0 top-1/4 bottom-1/4 bg-brand-magenta flex flex-col items-center justify-center px-3 text-center">
                    <div className="text-[0.6rem] sm:text-[0.65rem] font-bold uppercase tracking-[2px] mb-0.5">
                      Color
                    </div>
                    <div className="text-[0.85rem] sm:text-[0.95rem] font-extrabold tracking-wider">
                      SHOCK
                    </div>
                    <div className="mt-2 px-2 py-0.5 bg-white text-brand-magenta text-[0.7rem] sm:text-[0.78rem] font-extrabold rounded-full">
                      180 ml
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4 text-[0.85rem] sm:text-[0.92rem] font-bold text-brand-gray-900">
                  {hero.compareLabelOurs}
                </div>
              </div>

              {/* 60 ml — standartinė */}
              <div className="flex flex-col items-center">
                <div className="w-[7px] h-[14px] bg-brand-gray-500 rounded-t-sm" />
                <div className="w-[8px] h-[5px] bg-brand-gray-500" />
                <div className="relative w-[60px] sm:w-[70px] h-[100px] sm:h-[115px] bg-brand-gray-500 rounded-b-xl rounded-t-md flex items-center justify-center text-white shadow-[0_4px_18px_rgba(0,0,0,0.12)]">
                  <div className="px-2 py-0.5 bg-white text-brand-gray-700 text-[0.6rem] sm:text-[0.65rem] font-bold rounded-full">
                    60 ml
                  </div>
                </div>
                <div className="text-center mt-4 text-[0.78rem] sm:text-[0.85rem] text-brand-gray-500">
                  {hero.compareLabelStd}
                </div>
              </div>
            </div>

            <div className="mt-7 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-magenta/10 border border-brand-magenta/25 text-brand-magenta rounded-full text-[0.88rem] font-bold">
              <span aria-hidden>↑</span> {hero.compareBadge}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

import Link from 'next/link'
import Image from 'next/image'
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

          {/* DEŠINĖ — 180 ml produkto nuotrauka */}
          <div className="relative flex flex-col items-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[420px] lg:max-w-[480px] aspect-[3/4] rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
              <Image
                src="/hero-180ml.jpg"
                alt="Color SHOCK 180 ml profesionalūs plaukų dažai"
                fill
                sizes="(max-width: 768px) 280px, (max-width: 1024px) 420px, 480px"
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-magenta/10 border border-brand-magenta/25 text-brand-magenta rounded-full text-[0.88rem] font-bold">
              <span aria-hidden>↑</span> {hero.compareBadge}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

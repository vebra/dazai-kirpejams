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
 * Jei DB baneris nerastas — rodo hardcoded fallback.
 */
export async function Hero({ lang, dict }: HeroProps) {
  const hero = dict.hero
  const banners = await getActiveBanners('hero', lang)
  const banner: Banner | null = banners[0] ?? null

  // Naudojame DB banerį jei yra, kitaip fallback
  const badge = banner?.badge ?? `Color SHOCK & Pasirinkimas iš 50 spalvų`
  const title = banner?.title ?? null // null = naudosim hardcoded JSX
  const subtitle =
    banner?.subtitle ??
    `${hero.subtitle} Profesionali formulė, plati spalvų paletė ir ekonomiška kaina — viskas, ko reikia Jūsų salonui.`
  const ctaText = banner?.ctaText ?? hero.cta
  const ctaUrl = banner?.ctaUrl ? `${langPrefix(lang)}${banner.ctaUrl}` : `${langPrefix(lang)}/produktai`
  const ctaSecondaryText = banner?.ctaSecondaryText ?? hero.ctaSecondary
  const ctaSecondaryUrl = banner?.ctaSecondaryUrl
    ? `${langPrefix(lang)}${banner.ctaSecondaryUrl}`
    : `${langPrefix(lang)}/salonams`
  const imageUrl = banner?.imageUrl ?? '/color-shock-hero.jpg'

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f5f5f7_100%)] py-16 lg:py-20">
      <Container>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
          {/* Kairė pusė — turinys */}
          <div className="max-w-[540px] text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-1.5 bg-brand-magenta/[0.08] text-brand-magenta px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span aria-hidden>★</span>
              <span>{badge}</span>
            </div>

            {title ? (
              <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.2] text-brand-gray-900 mb-5">
                {title}
              </h1>
            ) : (
              <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.2] text-brand-gray-900 mb-5">
                Profesionalūs plaukų dažai{' '}
                <span className="text-brand-magenta">kirpėjams</span>
              </h1>
            )}

            <p className="text-[1.15rem] leading-[1.7] text-brand-gray-500 mb-9">
              {subtitle}
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href={ctaUrl}
                className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
              >
                {ctaText}
              </Link>
              <Link
                href={ctaSecondaryUrl}
                className="inline-flex items-center justify-center gap-2 px-10 py-[18px] border-2 border-brand-gray-900 text-brand-gray-900 rounded-lg text-[1.1rem] font-semibold hover:bg-brand-gray-900 hover:text-white hover:-translate-y-0.5 transition-all"
              >
                {ctaSecondaryText}
              </Link>
            </div>
          </div>

          {/* Dešinė pusė — produkto vaizdas */}
          <div className="relative flex items-center justify-center order-1 lg:order-2">
            <div className="relative w-full max-w-[360px] lg:max-w-[680px] aspect-[3/4] rounded-xl overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title ?? 'Hero'}
                  fill
                  sizes="(max-width: 768px) 360px, 680px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#f5f5f7_0%,#e8e8ec_100%)] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-[0.85rem] font-semibold uppercase tracking-[2px] text-brand-gray-500 mb-3">
                      Color SHOCK
                    </div>
                    <div className="text-[7rem] lg:text-[9rem] font-extrabold text-brand-magenta leading-none">
                      180
                    </div>
                    <div className="text-2xl font-bold text-brand-gray-900">
                      ml
                    </div>
                  </div>
                </div>
              )}

              {/* 180 ml apvalus elementas */}
              <div className="absolute top-[10px] right-7 w-20 h-20 rounded-full bg-brand-magenta text-white font-extrabold text-base flex items-center justify-center shadow-[0_4px_20px_rgba(233,30,140,0.35)] tracking-[0.5px]">
                180 ml
              </div>

              {/* Kainos elementas */}
              <div className="absolute -bottom-[1px] -left-5 bg-white rounded-full px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.13)] flex items-center gap-2.5">
                <span className="text-[0.95rem] text-brand-gray-500 line-through font-medium">
                  €11.00
                </span>
                <span className="text-[1.3rem] text-brand-magenta font-extrabold">
                  €7.90
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

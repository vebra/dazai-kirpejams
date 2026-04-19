import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

type ComparisonProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

type Stat = { number: string; label: string }

export function Comparison({ lang, dict }: ComparisonProps) {
  const t = dict.comparison
  const stats: Stat[] = t.stats

  return (
    <section
      id="pranasumas"
      className="py-20 bg-brand-gray-900 text-white relative overflow-hidden"
    >
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
            {t.label}
          </span>
          <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-3 leading-tight">
            {t.titleFull}
          </h2>
          <p className="text-[1.1rem] text-white/70">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px] items-center">
          <div className="flex items-end justify-center gap-10">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-16 h-[200px] sm:w-20 sm:h-[260px] rounded-t-lg rounded-b flex items-end justify-center pb-4 font-extrabold text-lg sm:text-[1.3rem] text-white bg-[linear-gradient(180deg,#E91E8C_0%,#c4166f_100%)]"
              >
                180 ml
              </div>
              <div className="text-[0.85rem] font-semibold text-white/70">
                {t.ours}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-16 h-[76px] sm:w-20 sm:h-[100px] rounded-t-lg rounded-b flex items-end justify-center pb-4 font-extrabold text-sm sm:text-base text-white bg-white/15"
              >
                60 ml
              </div>
              <div className="text-[0.85rem] font-semibold text-white/70">
                {t.standard}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-bold text-white leading-tight">
              {t.rightTitle}
            </h3>
            <p className="mt-4 text-white/75 leading-[1.7]">
              {t.rightDesc}
            </p>

            <div className="grid grid-cols-2 gap-6 mt-8">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.06] border border-white/10 rounded-lg p-4 sm:p-6"
                >
                  <div className="text-[2rem] font-extrabold text-brand-magenta leading-none mb-2">
                    {stat.number}
                  </div>
                  <div className="text-[0.9rem] text-white/65 leading-snug">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={`${langPrefix(lang)}/skaiciuokle`}
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-[14px] bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {t.ctaFull} →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

// Tos pačios prielaidos kaip pilnoje /skaiciuokle: 60 ml vidutinis dažymo
// kiekis, standartinė konkurento 60 ml pakuotė €11, mūsų 180 ml €7.90.
const ML_PER_DYEING = 60
const COMPETITOR_PRICE = 11
const COMPETITOR_VOLUME = 60
const OUR_PRICE = 7.9
const OUR_VOLUME = 180

type MiniCalculatorDict = {
  badge: string
  title: string
  subtitle: string
  inputLabel: string
  inputSuffix: string
  resultLabel: string
  perMonth: string
  perYear: string
  cta: string
  fullCta: string
}

export function MiniCalculator({
  lang,
  dict,
}: {
  lang: Locale
  dict: MiniCalculatorDict
}) {
  const [dyeingsStr, setDyeingsStr] = useState('60')
  const dyeings = Math.max(0, parseFloat(dyeingsStr) || 0)

  const { savingsPerMonth, savingsPerYear } = useMemo(() => {
    const mlPerMonth = dyeings * ML_PER_DYEING
    const competitorPerMl = COMPETITOR_PRICE / COMPETITOR_VOLUME
    const ourPerMl = OUR_PRICE / OUR_VOLUME
    const month = Math.max(0, mlPerMonth * (competitorPerMl - ourPerMl))
    return {
      savingsPerMonth: month,
      savingsPerYear: month * 12,
    }
  }, [dyeings])

  const formatEur = (v: number) =>
    '€' + v.toFixed(2).replace('.', ',')

  return (
    <section className="py-16 lg:py-20 bg-brand-gray-900 text-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[2px] text-brand-magenta mb-4">
              <span>📊</span>
              {dict.badge}
            </span>
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold mb-4 leading-tight">
              {dict.title}
            </h2>
            <p className="text-[1.05rem] text-white/70 leading-[1.7] max-w-[480px]">
              {dict.subtitle}
            </p>
          </div>

          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-7 lg:p-9">
            <label
              htmlFor="mini-calc-input"
              className="block text-[0.78rem] font-bold uppercase tracking-[2px] text-white/55 mb-3"
            >
              {dict.inputLabel}
            </label>
            <div className="relative mb-7">
              <input
                id="mini-calc-input"
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                value={dyeingsStr}
                onChange={(e) => setDyeingsStr(e.target.value)}
                className="w-full bg-transparent border-2 border-white/20 rounded-xl px-5 py-4 pr-28 text-[2rem] font-extrabold text-white focus:outline-none focus:border-brand-magenta transition-colors"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[0.95rem] text-white/55 font-medium">
                {dict.inputSuffix}
              </span>
            </div>

            <div className="text-[0.78rem] font-bold uppercase tracking-[2px] text-white/55 mb-3">
              {dict.resultLabel}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-brand-magenta/10 border border-brand-magenta/25 rounded-xl p-5 text-center">
                <div className="text-[0.72rem] uppercase tracking-wider text-white/60 mb-1.5 font-semibold">
                  {dict.perMonth}
                </div>
                <div className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-brand-magenta leading-none">
                  {formatEur(savingsPerMonth)}
                </div>
              </div>
              <div className="bg-white/[0.06] border border-white/15 rounded-xl p-5 text-center">
                <div className="text-[0.72rem] uppercase tracking-wider text-white/60 mb-1.5 font-semibold">
                  {dict.perYear}
                </div>
                <div className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-white leading-none">
                  {formatEur(savingsPerYear)}
                </div>
              </div>
            </div>

            <Link
              href={`${langPrefix(lang)}/skaiciuokle`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-white text-brand-gray-900 rounded-xl text-[0.95rem] font-semibold hover:bg-brand-gray-50 transition-colors"
            >
              {dict.fullCta} →
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}

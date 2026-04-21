'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Locale } from '@/i18n/config'
import { trackCalculatorUsed } from '@/lib/analytics'

const OUR_PRICE = 7.9
const OUR_VOLUME = 180

function formatEur(value: number): string {
  return '€' + value.toFixed(2).replace('.', ',')
}

function formatPerMl(value: number): string {
  return '€' + value.toFixed(3).replace('.', ',')
}

type CalculatorDict = {
  calcTitle: string
  calcDyeingsLabel: string
  calcMlLabel: string
  calcPriceLabel: string
  calcVolumeLabel: string
  calcOurOffer: string
  calcResultsTitle: string
  calcCompetitorPerMl: string
  calcOurPerMl: string
  calcSavingsMonth: string
  calcSavingsYear: string
  calcPackagesReduction: string
  calcDisclaimer: string
}

export function Calculator({
  lang,
  dict,
}: {
  lang: Locale
  dict: CalculatorDict
}) {
  const [dyeingsStr, setDyeingsStr] = useState('15')
  const [mlStr, setMlStr] = useState('60')
  const [priceStr, setPriceStr] = useState('11')
  const [volumeStr, setVolumeStr] = useState('60')
  const didInteract = useRef(false)

  const dyeingsPerWeek = parseFloat(dyeingsStr) || 0
  const mlPerDyeing = parseFloat(mlStr) || 0
  const competitorPrice = parseFloat(priceStr) || 0
  const competitorVolume = parseFloat(volumeStr) || 0

  const results = useMemo(() => {
    const ourPerMl = OUR_PRICE / OUR_VOLUME
    const competitorPerMl =
      competitorVolume > 0 ? competitorPrice / competitorVolume : 0

    const dyeingsPerMonth = dyeingsPerWeek * 4.33
    const mlPerMonth = dyeingsPerMonth * mlPerDyeing

    const ourCostPerMonth = mlPerMonth * ourPerMl
    const competitorCostPerMonth = mlPerMonth * competitorPerMl

    const savingsPerMonth = Math.max(
      0,
      competitorCostPerMonth - ourCostPerMonth
    )
    const savingsPerYear = savingsPerMonth * 12

    const ourPackagesPerMonth = Math.ceil(mlPerMonth / OUR_VOLUME)
    const competitorPackagesPerMonth =
      competitorVolume > 0 ? Math.ceil(mlPerMonth / competitorVolume) : 0
    const packagesReduction = Math.max(
      0,
      competitorPackagesPerMonth - ourPackagesPerMonth
    )

    return {
      ourPerMl,
      competitorPerMl,
      savingsPerMonth,
      savingsPerYear,
      packagesReduction,
    }
  }, [dyeingsPerWeek, mlPerDyeing, competitorPrice, competitorVolume])

  useEffect(() => {
    if (!didInteract.current) return
    trackCalculatorUsed({
      dyeingsPerWeek,
      mlPerDyeing,
      savingsPerMonth: Math.round(results.savingsPerMonth * 100) / 100,
      locale: lang,
    })
  }, [
    dyeingsPerWeek,
    mlPerDyeing,
    competitorPrice,
    competitorVolume,
    results.savingsPerMonth,
    lang,
  ])

  function markInteract(setter: (val: string) => void) {
    return (val: string) => {
      didInteract.current = true
      setter(val)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-8 lg:p-12 border border-[#E0E0E0] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px]">
        {/* Inputs */}
        <div>
          <h2 className="text-[1.5rem] font-bold text-brand-gray-900 mb-7 leading-tight">
            {dict.calcTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CalcField
              id="dyeingsPerWeek"
              label={dict.calcDyeingsLabel}
              value={dyeingsStr}
              onChange={markInteract(setDyeingsStr)}
              min={1}
              max={200}
              step={1}
            />
            <CalcField
              id="mlPerDyeing"
              label={dict.calcMlLabel}
              value={mlStr}
              onChange={markInteract(setMlStr)}
              min={10}
              max={500}
              step={5}
            />
            <CalcField
              id="competitorPrice"
              label={dict.calcPriceLabel}
              value={priceStr}
              onChange={markInteract(setPriceStr)}
              min={0.01}
              max={100}
              step={0.01}
            />
            <CalcField
              id="competitorVolume"
              label={dict.calcVolumeLabel}
              value={volumeStr}
              onChange={markInteract(setVolumeStr)}
              min={10}
              max={500}
              step={5}
            />
          </div>

          <div className="mt-7 bg-brand-magenta/[0.08] border border-brand-magenta/20 rounded-xl p-5 relative">
            <div className="absolute -top-3 left-5 px-3 py-1 bg-brand-magenta text-white text-[0.7rem] font-bold uppercase tracking-wider rounded-full">
              {dict.calcOurOffer}
            </div>
            <div className="mt-1 text-[0.95rem] text-brand-gray-900">
              <strong>Color SHOCK 180 ml</strong> —{' '}
              <span className="text-brand-magenta font-extrabold text-[1.15rem]">
                €7,90
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-brand-gray-900 text-white rounded-xl p-8 lg:p-10">
          <h2 className="text-[1.5rem] font-bold text-white mb-7 leading-tight">
            {dict.calcResultsTitle}
          </h2>

          <div className="space-y-4">
            <ResultRow
              label={dict.calcCompetitorPerMl}
              value={formatPerMl(results.competitorPerMl)}
            />
            <ResultRow
              label={dict.calcOurPerMl}
              value={formatPerMl(results.ourPerMl)}
              highlight
            />

            <div className="border-t border-white/10 my-5" />

            <ResultRow
              label={dict.calcSavingsMonth}
              value={formatEur(results.savingsPerMonth)}
              highlight
              big
            />
            <ResultRow
              label={dict.calcSavingsYear}
              value={formatEur(results.savingsPerYear)}
              highlight
              big
            />

            <div className="border-t border-white/10 my-5" />

            <ResultRow
              label={dict.calcPackagesReduction}
              value={String(results.packagesReduction)}
            />

            <p className="text-[0.78rem] text-white/50 italic mt-6 leading-[1.5]">
              {dict.calcDisclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CalcField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  id: string
  label: string
  value: string
  onChange: (val: string) => void
  min: number
  max: number
  step: number
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[0.85rem] font-semibold text-brand-gray-900 mb-2 leading-snug"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const num = parseFloat(value)
          if (isNaN(num) || num < min) onChange(String(min))
          else if (num > max) onChange(String(max))
        }}
        className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-brand-gray-50 text-brand-gray-900 text-[1rem] font-semibold focus:outline-none focus:border-brand-magenta focus:bg-white focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
      />
    </div>
  )
}

function ResultRow({
  label,
  value,
  highlight,
  big,
}: {
  label: string
  value: string
  highlight?: boolean
  big?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`${
          big ? 'text-[0.95rem]' : 'text-[0.88rem]'
        } text-white/70 leading-snug`}
      >
        {label}
      </span>
      <span
        className={`font-extrabold whitespace-nowrap ${
          big ? 'text-[1.65rem]' : 'text-[1.1rem]'
        } ${highlight ? 'text-brand-magenta' : 'text-white'}`}
      >
        {value}
      </span>
    </div>
  )
}

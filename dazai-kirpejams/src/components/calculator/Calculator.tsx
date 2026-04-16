'use client'

import { useState, useMemo } from 'react'

const OUR_PRICE = 7.9
const OUR_VOLUME = 180

function formatEur(value: number): string {
  return '€' + value.toFixed(2).replace('.', ',')
}

function formatPerMl(value: number): string {
  return '€' + value.toFixed(3).replace('.', ',')
}

export function Calculator() {
  const [dyeingsPerWeek, setDyeingsPerWeek] = useState(15)
  const [mlPerDyeing, setMlPerDyeing] = useState(60)
  const [competitorPrice, setCompetitorPrice] = useState(10)
  const [competitorVolume, setCompetitorVolume] = useState(60)

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

  return (
    <div className="bg-white rounded-2xl p-8 lg:p-12 border border-[#E0E0E0] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-[60px]">
        {/* Inputs */}
        <div>
          <h2 className="text-[1.5rem] font-bold text-brand-gray-900 mb-7 leading-tight">
            Jūsų salono duomenys
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <CalcField
              id="dyeingsPerWeek"
              label="Kiek dažymų atliekate per savaitę?"
              value={dyeingsPerWeek}
              onChange={setDyeingsPerWeek}
              min={1}
              max={200}
              step={1}
            />
            <CalcField
              id="mlPerDyeing"
              label="Vidutinis dažų kiekis vienam dažymui (ml)"
              value={mlPerDyeing}
              onChange={setMlPerDyeing}
              min={10}
              max={500}
              step={5}
            />
            <CalcField
              id="competitorPrice"
              label="Dabartinė dažų kaina (€)"
              value={competitorPrice}
              onChange={setCompetitorPrice}
              min={0.01}
              max={100}
              step={0.01}
            />
            <CalcField
              id="competitorVolume"
              label="Dabartinė dažų talpa (ml)"
              value={competitorVolume}
              onChange={setCompetitorVolume}
              min={10}
              max={500}
              step={5}
            />
          </div>

          <div className="mt-7 bg-brand-magenta/[0.08] border border-brand-magenta/20 rounded-xl p-5 relative">
            <div className="absolute -top-3 left-5 px-3 py-1 bg-brand-magenta text-white text-[0.7rem] font-bold uppercase tracking-wider rounded-full">
              Mūsų pasiūlymas
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
            Rezultatai
          </h2>

          <div className="space-y-4">
            <ResultRow
              label="Kaina per ml (konkurentas)"
              value={formatPerMl(results.competitorPerMl)}
            />
            <ResultRow
              label="Kaina per ml (Color SHOCK)"
              value={formatPerMl(results.ourPerMl)}
              highlight
            />

            <div className="border-t border-white/10 my-5" />

            <ResultRow
              label="Sutaupymas per mėnesį"
              value={formatEur(results.savingsPerMonth)}
              highlight
              big
            />
            <ResultRow
              label="Sutaupymas per metus"
              value={formatEur(results.savingsPerYear)}
              highlight
              big
            />

            <div className="border-t border-white/10 my-5" />

            <ResultRow
              label="Pakuočių sumažėjimas per mėnesį"
              value={String(results.packagesReduction)}
            />

            <p className="text-[0.78rem] text-white/50 italic mt-6 leading-[1.5]">
              * Skaičiavimai yra orientaciniai ir priklauso nuo faktinių kainų
              bei naudojimo įpročių.
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
  value: number
  onChange: (val: number) => void
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
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
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

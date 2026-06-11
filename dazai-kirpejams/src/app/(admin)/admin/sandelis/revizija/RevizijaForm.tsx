'use client'

import { useState, useMemo, useRef, useTransition } from 'react'
import Link from 'next/link'
import type { AdminProductListRow } from '@/lib/admin/queries'
import { applyRevisionAction, type RevisionResult } from '../actions'
import {
  ScanResultBanner,
  playScanFeedback,
  type ScanResult,
} from '@/components/admin/ScanFeedback'

function eur(cents: number): string {
  const v = (cents / 100).toFixed(2).replace('.', ',')
  return `${cents < 0 ? '−' : ''}${v.replace('-', '')} €`
}

export function RevizijaForm({
  products,
}: {
  products: AdminProductListRow[]
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<RevisionResult | null>(null)
  const [step, setStep] = useState<'count' | 'review' | 'done'>('count')

  // productId → suskaičiuotas kiekis (tik paliestos prekės)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [missingFilter, setMissingFilter] = useState('')
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)
  const scanIdRef = useRef(0)

  const pmap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  )

  function bump(pid: string, by: number) {
    setCounts((prev) => ({ ...prev, [pid]: Math.max(0, (prev[pid] ?? 0) + by) }))
  }
  function setCount(pid: string, n: number) {
    setCounts((prev) => ({ ...prev, [pid]: Math.max(0, n) }))
  }
  function removeCount(pid: string) {
    setCounts((prev) => {
      const next = { ...prev }
      delete next[pid]
      return next
    })
  }

  function handleScan(e: React.SyntheticEvent) {
    e.preventDefault()
    const val = scanRef.current?.value.trim() ?? ''
    if (scanRef.current) scanRef.current.value = ''
    scanRef.current?.focus()
    if (!val) return
    const id = ++scanIdRef.current
    const p = products.find((pp) => pp.ean && pp.ean === val)
    if (!p) {
      playScanFeedback('fail')
      setLastScan({ id, outcome: 'fail', title: 'Prekė nerasta', subtitle: `EAN: ${val}` })
      return
    }
    const newCount = (counts[p.id] ?? 0) + 1
    bump(p.id, 1)
    playScanFeedback('ok')
    setLastScan({
      id,
      outcome: 'ok',
      title: `${p.colorNumber ? `${p.colorNumber} · ` : ''}${p.nameLt}`,
      subtitle: `Suskaičiuota: ${newCount} (sistemoje ${p.stockQuantity})`,
    })
  }

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return products
      .filter(
        (p) =>
          p.nameLt.toLowerCase().includes(q) ||
          (p.colorNumber ?? '').toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.ean ?? '').includes(q)
      )
      .slice(0, 8)
  }, [products, search])

  // Suskaičiuotų prekių eilutės (surūšiuotos pagal pavadinimą)
  const countedRows = useMemo(() => {
    return Object.keys(counts)
      .map((id) => {
        const p = pmap.get(id)
        if (!p) return null
        const counted = counts[id]
        const system = p.stockQuantity ?? 0
        const diff = counted - system
        const unitCents = p.costPriceCents ?? p.priceCents
        return { p, counted, system, diff, valueCents: diff * unitCents }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.p.nameLt.localeCompare(b.p.nameLt, 'lt'))
  }, [counts, pmap])

  const discrepancies = countedRows.filter((r) => r.diff !== 0)
  const totalValueChange = discrepancies.reduce((s, r) => s + r.valueCents, 0)
  const countedProductCount = countedRows.length
  const totalProducts = products.length

  // Nesuskaičiuotos prekės, kurios SISTEMOJE turi likutį — galimi „vaiduokliai"
  // (fiziškai dingusios prekės nuskenuoti neįmanoma, tad jos liktų su senu
  // likučiu). Peržiūroje rodom sąrašą su mygtuku „Nėra → 0".
  const uncountedWithStock = useMemo(() => {
    const q = missingFilter.trim().toLowerCase()
    return products
      .filter(
        (p) =>
          counts[p.id] == null &&
          (p.stockQuantity ?? 0) > 0 &&
          (!q ||
            p.nameLt.toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.ean ?? '').includes(q))
      )
      .sort((a, b) => a.nameLt.localeCompare(b.nameLt, 'lt'))
  }, [products, counts, missingFilter])

  function confirm() {
    const items = discrepancies.map((r) => ({ productId: r.p.id, counted: r.counted }))
    startTransition(async () => {
      const res = await applyRevisionAction(items)
      setResult(res)
      if (res.ok) setStep('done')
    })
  }

  // ── Baigta ──
  if (step === 'done' && result?.ok) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✓</span>
          <div>
            <div className="text-lg font-bold text-brand-gray-900">
              Revizija pritaikyta
            </div>
            <div className="text-sm text-brand-gray-500">
              Atnaujinta {result.applied} prekių likučiai. Žurnale pažymėta
              kaip revizija. Vertės pokytis: {eur(totalValueChange)}.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/sandelis"
            className="px-4 py-2.5 bg-brand-magenta text-white rounded-lg text-[13px] font-semibold hover:bg-brand-magenta-dark"
          >
            Į sandėlį
          </Link>
          <Link
            href="/admin/sandelis/zurnalas"
            className="px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900 hover:bg-[#e8e8ec]"
          >
            Žurnalas
          </Link>
        </div>
      </div>
    )
  }

  // ── Peržiūra ──
  if (step === 'review') {
    return (
      <div className="space-y-5">
        <div className="print-hide px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm font-medium">
          Neatitikimų: <strong>{discrepancies.length}</strong>. Patvirtinę,
          pakeisime šių prekių likučius (žurnale — revizija). Neskaičiuotos ir
          sutampančios prekės nekeičiamos.
        </div>

        {discrepancies.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#eee] p-6 text-center text-sm text-brand-gray-500">
            Neatitikimų nėra — viskas sutampa su sistema. Nieko keisti nereikia.
          </div>
        ) : (
          <div className="print-area bg-white rounded-xl border border-[#eee] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eee] font-bold text-brand-gray-900">
              Revizijos neatitikimai
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-3 py-2 text-left">Prekė</th>
                  <th className="px-3 py-2 text-center w-20">Sistema</th>
                  <th className="px-3 py-2 text-center w-20">Rasta</th>
                  <th className="px-3 py-2 text-center w-20">Skirtumas</th>
                  <th className="px-3 py-2 text-right w-28">Vertė (savik.)</th>
                </tr>
              </thead>
              <tbody>
                {discrepancies.map((r) => (
                  <tr key={r.p.id} className="border-t border-[#eee]">
                    <td className="px-3 py-2">
                      {r.p.colorNumber ? `${r.p.colorNumber} · ` : ''}
                      {r.p.nameLt}
                      {r.p.sku && (
                        <span className="text-[11px] text-brand-gray-400 font-mono ml-1">{r.p.sku}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-brand-gray-500">{r.system}</td>
                    <td className="px-3 py-2 text-center font-semibold">{r.counted}</td>
                    <td className={`px-3 py-2 text-center font-bold ${r.diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {r.diff > 0 ? '+' : ''}{r.diff}
                    </td>
                    <td className={`px-3 py-2 text-right ${r.valueCents < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {eur(r.valueCents)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#eee] font-bold">
                  <td className="px-3 py-2" colSpan={4}>Bendras vertės pokytis</td>
                  <td className={`px-3 py-2 text-right ${totalValueChange < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {eur(totalValueChange)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Nesuskaičiuotos prekės su likučiu — galimi „vaiduokliai" */}
        {uncountedWithStock.length > 0 || missingFilter ? (
          <div className="print-hide bg-white rounded-xl border border-[#eee] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eee]">
              <div className="font-bold text-brand-gray-900">
                Nesuskaičiuotos prekės su likučiu ({uncountedWithStock.length})
              </div>
              <p className="mt-1 text-[12px] text-brand-gray-500">
                Šių prekių nenuskenavote, bet sistemoje jos turi likutį. Jei
                prekės lentynoje tikrai NĖRA — spauskite „Nėra → 0“ (bus
                įtraukta į neatitikimus). Jei tiesiog dar nesuskaičiavote —
                grįžkite į skaičiavimą.
              </p>
              <input
                type="text"
                value={missingFilter}
                onChange={(e) => setMissingFilter(e.target.value)}
                placeholder="Filtruoti…"
                className="mt-2 w-full sm:w-72 px-3 py-2 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
              />
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#f3f3f3]">
              {uncountedWithStock.slice(0, 60).map((p) => (
                <div
                  key={p.id}
                  className="px-4 py-2 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-brand-gray-900 truncate">
                      {p.colorNumber ? `${p.colorNumber} · ` : ''}
                      {p.nameLt}
                    </div>
                    <div className="text-[11px] text-brand-gray-500">
                      sistemoje: {p.stockQuantity}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCount(p.id, 0)}
                    className="shrink-0 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-md text-[12px] font-semibold hover:bg-red-100"
                  >
                    Nėra → 0
                  </button>
                </div>
              ))}
              {uncountedWithStock.length > 60 && (
                <div className="px-4 py-2 text-[12px] text-brand-gray-500">
                  … ir dar {uncountedWithStock.length - 60}. Naudokite filtrą.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="print-hide px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
            Visos prekės su likučiu suskaičiuotos — „vaiduoklių“ nėra. 👍
          </div>
        )}

        {result && !result.ok && (
          <div className="print-hide px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {result.error}
          </div>
        )}

        <div className="print-hide flex items-center gap-2 flex-wrap">
          {discrepancies.length > 0 && (
            <button
              type="button"
              disabled={pending}
              onClick={confirm}
              className="px-6 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50"
            >
              {pending ? 'Taikoma…' : 'Patvirtinti reviziją'}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => setStep('count')}
            className="px-5 py-3 bg-[#F5F5F7] border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#e8e8ec] disabled:opacity-50"
          >
            ← Tęsti skaičiavimą
          </button>
          {discrepancies.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-3 bg-white border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#F5F5F7]"
            >
              🖨 Spausdinti
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Skaičiavimas ──
  const inputCls =
    'w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta'

  return (
    <div className="space-y-5">
      {/* Skenavimas */}
      <div className="bg-white rounded-xl border border-[#eee] p-5 space-y-3">
        <label
          htmlFor="rev-scan"
          className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500"
        >
          Nuskenuokite kiekvieną prekę — +1 prie suskaičiuoto kiekio
        </label>
        <div className="flex gap-2">
          <input
            ref={scanRef}
            id="rev-scan"
            autoComplete="off"
            autoFocus
            placeholder="Nukreipkite skanerį čia…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleScan(e)
            }}
            className="flex-1 px-4 py-3 bg-[#F5F5F7] border-2 border-brand-magenta rounded-lg text-base focus:outline-none focus:bg-white"
          />
          <button
            type="button"
            onClick={handleScan}
            className="px-5 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark whitespace-nowrap"
          >
            +1
          </button>
        </div>
        <ScanResultBanner result={lastScan} />

        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Arba ieškoti prekės be barkodo (pavadinimas, numeris, SKU)…"
            className={inputCls}
          />
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    bump(p.id, 1)
                    setSearch('')
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left"
                >
                  <span className="text-brand-gray-900">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameLt}
                  </span>
                  <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">
                    sistemoje {p.stockQuantity}
                    {counts[p.id] != null ? ` · suskaičiuota ${counts[p.id]}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progresas */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
        <div className="text-brand-gray-500">
          Suskaičiuota prekių:{' '}
          <strong className="text-brand-gray-900">{countedProductCount}</strong> iš{' '}
          {totalProducts} · Neatitikimų:{' '}
          <strong className={discrepancies.length ? 'text-brand-magenta' : 'text-brand-gray-900'}>
            {discrepancies.length}
          </strong>
        </div>
        {countedProductCount > 0 && (
          <button
            type="button"
            onClick={() => setCounts({})}
            className="text-[12px] font-semibold text-brand-gray-500 hover:text-red-600"
          >
            Išvalyti viską
          </button>
        )}
      </div>

      {/* Suskaičiuotų sąrašas */}
      {countedRows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
          Dar nieko nesuskaičiuota. Skenuokite prekes — jos atsiras čia su
          skirtumu nuo sistemos.
        </div>
      ) : (
        <div className="bg-white border border-[#eee] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-3 py-2 text-left">Prekė</th>
                <th className="px-3 py-2 text-center w-20">Sistema</th>
                <th className="px-3 py-2 text-center w-28">Rasta</th>
                <th className="px-3 py-2 text-center w-20">Skirt.</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {countedRows.map((r) => (
                <tr
                  key={r.p.id}
                  className={`border-t border-[#eee] ${r.diff !== 0 ? 'bg-amber-50/40' : ''}`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-brand-gray-900">
                      {r.p.colorNumber ? `${r.p.colorNumber} · ` : ''}
                      {r.p.nameLt}
                    </div>
                    {r.p.sku && (
                      <div className="text-[11px] text-brand-gray-500 font-mono">{r.p.sku}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center text-brand-gray-500">{r.system}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => bump(r.p.id, -1)}
                        className="w-7 h-7 rounded border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
                      >−</button>
                      <input
                        type="number"
                        min={0}
                        value={r.counted}
                        onChange={(e) => setCount(r.p.id, parseInt(e.target.value, 10) || 0)}
                        className="w-14 px-1 py-1.5 border border-[#ddd] rounded-md text-sm text-center font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => bump(r.p.id, 1)}
                        className="w-7 h-7 rounded border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7]"
                      >+</button>
                    </div>
                  </td>
                  <td className={`px-3 py-2 text-center font-bold ${r.diff === 0 ? 'text-brand-gray-400' : r.diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {r.diff > 0 ? '+' : ''}{r.diff}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeCount(r.p.id)}
                      className="text-brand-gray-400 hover:text-red-600"
                      title="Pašalinti iš revizijos"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Į peržiūrą */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={countedProductCount === 0}
          onClick={() => {
            setResult(null)
            setStep('review')
          }}
          className="px-6 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50"
        >
          Peržiūrėti neatitikimus →
        </button>
      </div>
    </div>
  )
}

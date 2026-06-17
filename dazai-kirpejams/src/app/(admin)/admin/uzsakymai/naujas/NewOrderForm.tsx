'use client'

import { useState, useMemo, useRef, useTransition } from 'react'
import Link from 'next/link'
import type { AdminProductListRow } from '@/lib/admin/queries'
import type {
  CreateOrderInput,
  CreateOrderResult,
} from '@/lib/commerce/order-actions'
import { createAdminOrder } from '../actions'
import {
  ScanResultBanner,
  playScanFeedback,
  type ScanResult,
} from '@/components/admin/ScanFeedback'

type Line = {
  id: string
  name: string
  colorNumber: string | null
  sku: string | null
  priceCents: number
  stock: number
  qty: number
}

type Lang = 'lt' | 'en' | 'ru'
type Delivery = 'courier' | 'parcel_locker' | 'pickup'

function effectivePrice(p: AdminProductListRow): number {
  return p.salePriceCents != null &&
    p.salePriceCents > 0 &&
    p.salePriceCents < p.priceCents
    ? p.salePriceCents
    : p.priceCents
}

function eur(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

export type NewOrderPrefill = {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string | null
  isCompany?: boolean
  companyName?: string | null
  companyCode?: string | null
  vatCode?: string | null
  address?: string | null
  city?: string | null
  postal?: string | null
}

export function NewOrderForm({
  products,
  vatRate,
  freeShippingThresholdCents,
  shippingPriceCents,
  prefill,
}: {
  products: AdminProductListRow[]
  vatRate: number
  freeShippingThresholdCents: number
  shippingPriceCents: Record<Delivery, number>
  prefill?: NewOrderPrefill
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<CreateOrderResult | null>(null)
  const [step, setStep] = useState<'form' | 'review'>('form')

  // Klientas (gali būti užpildyta iš esamo kliento)
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '')
  const [lastName, setLastName] = useState(prefill?.lastName ?? '')
  const [phone, setPhone] = useState(prefill?.phone ?? '')
  const [lang, setLang] = useState<Lang>('lt')
  const [isCompany, setIsCompany] = useState(prefill?.isCompany ?? false)
  const [companyName, setCompanyName] = useState(prefill?.companyName ?? '')
  const [companyCode, setCompanyCode] = useState(prefill?.companyCode ?? '')
  const [vatCode, setVatCode] = useState(prefill?.vatCode ?? '')

  // Pristatymas
  const [delivery, setDelivery] = useState<Delivery>('courier')
  const [address, setAddress] = useState(prefill?.address ?? '')
  const [city, setCity] = useState(prefill?.city ?? '')
  const [postal, setPostal] = useState(prefill?.postal ?? '')
  const [notes, setNotes] = useState('')

  // Prekės
  const [list, setList] = useState<Line[]>([])
  const [search, setSearch] = useState('')
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)
  const scanIdRef = useRef(0)

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const inList = new Set(list.map((l) => l.id))
    return products
      .filter(
        (p) =>
          !inList.has(p.id) &&
          (p.nameLt.toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.ean ?? '').includes(q))
      )
      .slice(0, 8)
  }, [products, search, list])

  function addProduct(p: AdminProductListRow) {
    setList((prev) =>
      prev.some((l) => l.id === p.id)
        ? prev
        : [
            ...prev,
            {
              id: p.id,
              name: p.nameLt,
              colorNumber: p.colorNumber,
              sku: p.sku,
              priceCents: effectivePrice(p),
              stock: p.stockQuantity ?? 0,
              qty: 1,
            },
          ]
    )
    setSearch('')
  }

  function setQty(id: string, qty: number) {
    setList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))
    )
  }
  function remove(id: string) {
    setList((prev) => prev.filter((l) => l.id !== id))
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
    const existing = list.find((l) => l.id === p.id)
    const newQty = (existing?.qty ?? 0) + 1
    setList((prev) =>
      existing
        ? prev.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l))
        : [
            ...prev,
            {
              id: p.id,
              name: p.nameLt,
              colorNumber: p.colorNumber,
              sku: p.sku,
              priceCents: effectivePrice(p),
              stock: p.stockQuantity ?? 0,
              qty: 1,
            },
          ]
    )
    playScanFeedback('ok')
    setLastScan({
      id,
      outcome: 'ok',
      title: `${p.colorNumber ? `${p.colorNumber} · ` : ''}${p.nameLt}`,
      subtitle: `Sąraše: ${newQty} vnt. · ${eur(effectivePrice(p))}`,
    })
  }

  const subtotalCents = list.reduce((s, l) => s + l.priceCents * l.qty, 0)
  const totalUnits = list.reduce((s, l) => s + l.qty, 0)
  // Pristatymas/PVM/galutinė suma — kaip skaičiuoja serveris (create_order_atomic):
  // nemokamas pristatymas virš slenksčio; PVM IŠSKIRIAMAS iš sumos (kainos su PVM),
  // tik jei MŪSŲ įmonė PVM mokėtoja (vatRate > 0).
  const shippingCents =
    subtotalCents >= freeShippingThresholdCents
      ? 0
      : (shippingPriceCents[delivery] ?? 0)
  const totalCents = subtotalCents + shippingCents
  const vatCents =
    vatRate > 0 ? Math.round(totalCents - totalCents / (1 + vatRate)) : 0

  const canSubmit =
    !pending &&
    list.length > 0 &&
    email.trim() !== '' &&
    firstName.trim() !== '' &&
    phone.trim() !== '' &&
    (delivery === 'pickup' ||
      (delivery === 'parcel_locker'
        ? address.trim() !== ''
        : address.trim() !== '' && city.trim() !== '' && postal.trim() !== ''))

  function submit() {
    const input: CreateOrderInput = {
      items: list.map((l) => ({
        productId: l.id,
        name: l.name,
        sku: l.sku,
        priceCents: l.priceCents,
        quantity: l.qty,
      })),
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      isCompany,
      companyName: isCompany ? companyName.trim() : undefined,
      companyCode: isCompany ? companyCode.trim() : undefined,
      vatCode: isCompany ? vatCode.trim() : undefined,
      deliveryMethod: delivery,
      deliveryAddress: address.trim() || undefined,
      deliveryCity: city.trim() || undefined,
      deliveryPostalCode: postal.trim() || undefined,
      paymentMethod: 'bank_transfer',
      notes: notes.trim() || undefined,
      locale: lang,
    }
    startTransition(async () => {
      const res = await createAdminOrder(input)
      setResult(res)
    })
  }

  // ── Sėkmė ──
  if (result?.ok) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✓</span>
          <div>
            <div className="text-lg font-bold text-brand-gray-900">
              Užsakymas {result.orderNumber} sukurtas
            </div>
            <div className="text-sm text-brand-gray-500">
              Klientui ({email}) išsiųstas laiškas su banko rekvizitais ir suma.
              Gavę apmokėjimą, pažymėkite užsakymą apmokėtu jo kortelėje.
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/uzsakymai"
            className="px-4 py-2.5 bg-brand-magenta text-white rounded-lg text-[13px] font-semibold hover:bg-brand-magenta-dark"
          >
            Į užsakymų sąrašą
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setList([])
              setEmail('')
              setFirstName('')
              setLastName('')
              setPhone('')
            }}
            className="px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900 hover:bg-[#e8e8ec]"
          >
            + Dar vienas
          </button>
        </div>
      </div>
    )
  }

  const DELIVERY_LABEL: Record<Delivery, string> = {
    courier: 'Kurjeris',
    parcel_locker: 'Paštomatas',
    pickup: 'Atsiėmimas',
  }
  const LANG_LABEL: Record<Lang, string> = {
    lt: 'Lietuvių',
    en: 'English',
    ru: 'Русский',
  }

  // ── Peržiūra prieš siunčiant ──
  if (step === 'review') {
    return (
      <div className="space-y-5">
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm font-medium">
          Patikrinkite užsakymą. Paspaudus mygtuką žemiau, klientui iš karto
          išsiųsim laišką su rekvizitais — pakeisti nebebus galima.
        </div>

        {/* Klientas */}
        <div className="bg-white rounded-xl border border-[#eee] p-5 text-sm space-y-1">
          <h3 className="text-sm font-bold text-brand-gray-900 mb-2">Klientas</h3>
          <div>{[firstName, lastName].filter(Boolean).join(' ') || '—'}</div>
          <div className="text-brand-gray-500">{email} · {phone}</div>
          {isCompany && (
            <div className="text-brand-gray-500">
              Įmonė: {companyName || '—'}
              {companyCode ? ` · į.k. ${companyCode}` : ''}
              {vatCode ? ` · PVM ${vatCode}` : ''}
            </div>
          )}
          <div className="text-brand-gray-500">Laiško kalba: {LANG_LABEL[lang]}</div>
        </div>

        {/* Prekės + suma */}
        <div className="bg-white rounded-xl border border-[#eee] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                <th className="px-3 py-2 text-left">Prekė</th>
                <th className="px-3 py-2 text-center w-16">Kiekis</th>
                <th className="px-3 py-2 text-right w-24">Kaina</th>
                <th className="px-3 py-2 text-right w-24">Suma</th>
              </tr>
            </thead>
            <tbody>
              {list.map((l) => (
                <tr key={l.id} className="border-t border-[#eee]">
                  <td className="px-3 py-2 text-brand-gray-900">
                    {l.colorNumber ? `${l.colorNumber} · ` : ''}
                    {l.name}
                  </td>
                  <td className="px-3 py-2 text-center">{l.qty}</td>
                  <td className="px-3 py-2 text-right text-brand-gray-500">{eur(l.priceCents)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{eur(l.priceCents * l.qty)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[#eee] text-sm">
              <tr>
                <td className="px-3 py-1.5 text-brand-gray-500" colSpan={3}>Tarpinė suma</td>
                <td className="px-3 py-1.5 text-right">{eur(subtotalCents)}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-brand-gray-500" colSpan={3}>
                  Pristatymas — {DELIVERY_LABEL[delivery]}
                  {shippingCents === 0 && subtotalCents > 0 ? ' (nemokamas)' : ''}
                </td>
                <td className="px-3 py-1.5 text-right">{eur(shippingCents)}</td>
              </tr>
              <tr className="font-bold text-brand-gray-900">
                <td className="px-3 py-2" colSpan={3}>Iš viso (su PVM)</td>
                <td className="px-3 py-2 text-right text-base">{eur(totalCents)}</td>
              </tr>
              {vatCents > 0 && (
                <tr className="text-[12px] text-brand-gray-500">
                  <td className="px-3 py-1.5" colSpan={3}>iš jų PVM (21%)</td>
                  <td className="px-3 py-1.5 text-right">{eur(vatCents)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        {/* Pristatymas */}
        <div className="bg-white rounded-xl border border-[#eee] p-5 text-sm">
          <span className="text-brand-gray-500">Pristatymas: </span>
          {DELIVERY_LABEL[delivery]}
          {delivery !== 'pickup' && (
            <span className="text-brand-gray-500">
              {' '}— {[address, city, postal].filter(Boolean).join(', ')}
            </span>
          )}
          {notes && <div className="text-brand-gray-500 mt-1">Pastaba: {notes}</div>}
          <div className="text-brand-gray-500 mt-1">
            Mokėjimas: banko pavedimas (klientas gaus rekvizitus el. paštu)
          </div>
        </div>

        {result && !result.ok && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {result.error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="px-6 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50"
          >
            {pending ? 'Siunčiama…' : 'Patvirtinti ir siųsti klientui'}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setStep('form')}
            className="px-5 py-3 bg-[#F5F5F7] border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#e8e8ec] disabled:opacity-50"
          >
            ← Redaguoti
          </button>
        </div>
      </div>
    )
  }

  const inputCls =
    'w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta'
  const labelCls = 'block text-[12px] font-semibold text-brand-gray-900 mb-1'

  return (
    <div className="space-y-5">
      {result && !result.ok && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {result.error}
        </div>
      )}

      {/* Klientas */}
      <div className="bg-white rounded-xl border border-[#eee] p-5 space-y-3">
        <h3 className="text-sm font-bold text-brand-gray-900">Klientas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>El. paštas *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="klientas@pastas.lt"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Telefonas *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+370…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Vardas *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Pavardė</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Laiško kalba</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className={inputCls}
            >
              <option value="lt">Lietuvių</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-brand-gray-900 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isCompany}
            onChange={(e) => setIsCompany(e.target.checked)}
            className="h-4 w-4 accent-brand-magenta"
          />
          Įmonė (sąskaitai faktūrai)
        </label>
        {isCompany && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Įmonės pavadinimas</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Įmonės kodas</label>
              <input type="text" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PVM kodas</label>
              <input type="text" value={vatCode} onChange={(e) => setVatCode(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* Prekės */}
      <div className="bg-white rounded-xl border border-[#eee] p-5 space-y-4">
        <h3 className="text-sm font-bold text-brand-gray-900">Prekės</h3>

        <div className="bg-[#F9F9FB] rounded-lg border border-[#eee] p-3.5 space-y-3">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Nuskenuokite barkodą — prekė įkris į sąrašą (+1)
          </label>
          <div className="flex gap-2">
            <input
              ref={scanRef}
              autoComplete="off"
              placeholder="Nukreipkite skanerį čia…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleScan(e)
              }}
              className="flex-1 px-4 py-3 bg-white border-2 border-brand-magenta rounded-lg text-base focus:outline-none"
            />
            <button
              type="button"
              onClick={handleScan}
              className="px-5 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark whitespace-nowrap"
            >
              Pridėti
            </button>
          </div>
          <ScanResultBanner result={lastScan} />
        </div>

        <div>
          <label className={labelCls}>Arba pridėkite ranka (paieška)</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ieškoti prekės (pavadinimas, numeris, SKU)…"
            className={inputCls}
          />
          {results.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-[#eee] rounded-lg divide-y divide-[#f0f0f0]">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-[#F9F9FB] text-sm text-left"
                >
                  <span className="text-brand-gray-900">
                    {p.colorNumber ? `${p.colorNumber} · ` : ''}
                    {p.nameLt}
                  </span>
                  <span className="text-[12px] text-brand-gray-500 whitespace-nowrap">
                    {eur(effectivePrice(p))} · likutis {p.stockQuantity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {list.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-lg">
            Sąrašas tuščias — pridėkite prekių.
          </div>
        ) : (
          <div className="border border-[#eee] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-3 py-2 text-left">Prekė</th>
                  <th className="px-3 py-2 text-right w-24">Kaina</th>
                  <th className="px-3 py-2 text-center w-24">Kiekis</th>
                  <th className="px-3 py-2 text-right w-24">Suma</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((l) => (
                  <tr key={l.id} className="border-t border-[#eee]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-brand-gray-900">
                        {l.colorNumber ? `${l.colorNumber} · ` : ''}
                        {l.name}
                      </div>
                      {l.sku && (
                        <div className="text-[11px] text-brand-gray-500 font-mono">{l.sku}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-brand-gray-500">{eur(l.priceCents)}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        value={l.qty}
                        onChange={(e) => setQty(l.id, parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-2 py-1.5 border border-[#ddd] rounded-md text-sm text-center font-semibold"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-brand-gray-900">
                      {eur(l.priceCents * l.qty)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(l.id)}
                        className="text-brand-gray-400 hover:text-red-600"
                        title="Pašalinti"
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
      </div>

      {/* Pristatymas */}
      <div className="bg-white rounded-xl border border-[#eee] p-5 space-y-3">
        <h3 className="text-sm font-bold text-brand-gray-900">Pristatymas</h3>
        <div>
          <label className={labelCls}>Būdas</label>
          <select
            value={delivery}
            onChange={(e) => setDelivery(e.target.value as Delivery)}
            className={inputCls}
          >
            <option value="courier">Kurjeris</option>
            <option value="parcel_locker">Paštomatas</option>
            <option value="pickup">Atsiėmimas</option>
          </select>
        </div>
        {delivery !== 'pickup' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={delivery === 'parcel_locker' ? 'sm:col-span-3' : ''}>
              <label className={labelCls}>
                {delivery === 'parcel_locker' ? 'Paštomatas *' : 'Adresas *'}
              </label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
            </div>
            {delivery === 'courier' && (
              <>
                <div>
                  <label className={labelCls}>Miestas *</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Pašto kodas *</label>
                  <input type="text" value={postal} onChange={(e) => setPostal(e.target.value)} className={inputCls} />
                </div>
              </>
            )}
          </div>
        )}
        <div>
          <label className={labelCls}>Pastaba (nebūtina)</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Pateikimas */}
      <div className="bg-white rounded-xl border border-[#eee] p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-brand-gray-500">
          Prekių: <strong className="text-brand-gray-900">{totalUnits}</strong> vnt. · Tarpinė suma{' '}
          <strong className="text-brand-gray-900">{eur(subtotalCents)}</strong> · Pristatymas{' '}
          <strong className="text-brand-gray-900">{eur(shippingCents)}</strong> · Iš viso{' '}
          <strong className="text-brand-magenta">{eur(totalCents)}</strong>
          {vatCents > 0 && (
            <span className="text-[12px]"> (iš jų PVM {eur(vatCents)})</span>
          )}
          <div className="text-[12px] mt-0.5">
            Toliau pamatysite pilną peržiūrą ir tik tada laiškas bus išsiųstas klientui.
          </div>
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            setResult(null)
            setStep('review')
          }}
          className="px-6 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-50 transition-colors"
        >
          Peržiūrėti užsakymą →
        </button>
      </div>
    </div>
  )
}

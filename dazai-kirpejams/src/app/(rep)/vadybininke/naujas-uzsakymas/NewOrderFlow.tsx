'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { TIER_LABELS, type RepClient, type RepProduct } from '@/lib/rep/types'
import { createRepClient, submitRepOrder } from '../actions'

type DeliveryOption = { value: string; label: string; priceCents: number }

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const fmt = (c: number) => PRICE.format(c / 100)

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Grynais' },
  { value: 'card', label: 'Kortelė' },
  { value: 'bank_transfer', label: 'Pavedimas' },
]

export function NewOrderFlow({
  clients: initialClients,
  products,
  deliveryOptions,
  freeShippingThresholdCents,
  vatRate,
  heldByProduct = {},
  initialClientId = null,
  initialCart,
}: {
  clients: RepClient[]
  products: RepProduct[]
  deliveryOptions: DeliveryOption[]
  freeShippingThresholdCents: number
  vatRate: number
  heldByProduct?: Record<string, number>
  initialClientId?: string | null
  initialCart?: Record<string, number>
}) {
  const [clients, setClients] = useState<RepClient[]>(initialClients)
  const [client, setClient] = useState<RepClient | null>(
    initialClientId ? (initialClients.find((c) => c.id === initialClientId) ?? null) : null
  )
  const [cart, setCart] = useState<Record<string, number>>(initialCart ?? {})
  const [deliveryMethod, setDeliveryMethod] = useState(
    deliveryOptions.find((d) => d.value === 'pickup')?.value ?? deliveryOptions[0]?.value ?? 'pickup'
  )
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  const [payment, setPayment] = useState('cash')
  const [notes, setNotes] = useState('')
  const [submitting, startSubmit] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const tier = client?.pricingTier ?? 'wholesale_1'
  const delivery = deliveryOptions.find((d) => d.value === deliveryMethod)

  // „Galima" prekės kiekis = max(sandėlio likutis, vadybininkės atsargos), nes
  // užsakymą galima įvykdyti arba iš sandėlio, arba iš jos atsargų.
  const availableOf = (p: RepProduct) =>
    Math.max(p.stockQuantity ?? 0, heldByProduct[p.id] ?? 0)

  // Krepšelio eilutės + sumos (kliento pusės peržiūra; serveris perskaičiuoja autoritetingai)
  const lines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([pid, q]) => {
        const p = products.find((x) => x.id === pid)!
        const price = p?.prices[tier]
        const hasPrice = typeof price === 'number'
        const unit = hasPrice ? price : 0
        const available = p ? Math.max(p.stockQuantity ?? 0, heldByProduct[p.id] ?? 0) : 0
        return { product: p, qty: q, unit, total: unit * q, hasPrice, available, overStock: q > available }
      })
      .filter((l) => l.product)
  }, [cart, products, tier, heldByProduct])

  // Prekės, kurioms pasirinkto kliento grupei nėra kainos — užsakymo pateikti
  // negalima (serveris atmestų su NO_PRICE_FOR_TIER). Atsiranda pakeitus klientą
  // į kitos grupės, kai krepšelyje jau yra prekė be tos grupės kainos.
  const unpricedLines = lines.filter((l) => !l.hasPrice)
  // Prekės, kurių užsakyta daugiau nei galima (nei sandėlyje, nei atsargose) —
  // toks užsakymas įstrigtų patvirtinime, todėl blokuojam jau čia.
  const overStockLines = lines.filter((l) => l.overStock)

  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const shipping = subtotal >= freeShippingThresholdCents ? 0 : delivery?.priceCents ?? 0
  const vat = vatRate > 0 ? Math.round((subtotal + shipping) * vatRate) : 0
  const total = subtotal + shipping + vat

  function setQty(pid: string, q: number) {
    setCart((c) => ({ ...c, [pid]: Math.max(0, q) }))
  }

  function handleSubmit() {
    setSubmitError(null)
    if (!client) return setSubmitError('Pasirinkite klientą.')
    const items = lines.map((l) => ({ product_id: l.product.id, quantity: l.qty }))
    if (!items.length) return setSubmitError('Pridėkite bent vieną prekę.')
    if (unpricedLines.length > 0) {
      const names = unpricedLines.map((l) => l.product.nameLt).join(', ')
      return setSubmitError(
        `Šioms prekėms nėra kainos kliento grupei „${TIER_LABELS[tier] ?? tier}": ${names}. Pašalinkite jas iš krepšelio.`
      )
    }
    if (overStockLines.length > 0) {
      const names = overStockLines
        .map((l) => `${l.product.nameLt} (galima ${l.available})`)
        .join(', ')
      return setSubmitError(
        `Nepakanka likučio: ${names}. Sumažinkite kiekį arba pašalinkite iš krepšelio.`
      )
    }
    startSubmit(async () => {
      const res = await submitRepOrder({
        clientId: client.id,
        items,
        deliveryMethod,
        deliveryAddress: address,
        deliveryCity: city,
        deliveryPostalCode: postal,
        paymentMethod: payment,
        notes,
      })
      if (res.ok) setSuccess(res.orderNumber)
      else setSubmitError(res.error)
    })
  }

  function reset() {
    setClient(null)
    setCart({})
    setAddress('')
    setCity('')
    setPostal('')
    setNotes('')
    setSubmitError(null)
    setSuccess(null)
  }

  // ───── Sėkmės ekranas ─────
  if (success) {
    return (
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 py-12 text-center">
        <div className="text-4xl mb-3" aria-hidden>✅</div>
        <h2 className="text-xl font-bold text-brand-gray-900">Užsakymas pateiktas</h2>
        <p className="mt-2 text-sm text-brand-gray-600">
          Nr. <span className="font-mono font-semibold">{success}</span> — perduotas
          administratoriui. Būseną matysite skiltyje „Mano užsakymai“.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            Naujas užsakymas
          </button>
          <Link
            href="/vadybininke/uzsakymai"
            className="px-5 py-2.5 border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
          >
            Mano užsakymai
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 1. Klientas */}
      <ClientStep
        clients={clients}
        selected={client}
        onSelect={setClient}
        onCreated={(c) => {
          setClients((list) => [c, ...list].sort((a, b) => a.name.localeCompare(b.name)))
          setClient(c)
        }}
      />

      {/* 2. Prekės + krepšelis (tik pasirinkus klientą) */}
      {client && (
        <>
          <ProductStep
            products={products}
            tier={tier}
            cart={cart}
            onQty={setQty}
            availableOf={availableOf}
          />

          {lines.length > 0 && (
            <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
              <h3 className="font-bold text-brand-gray-900">Krepšelis</h3>
              <div className="divide-y divide-[#f3f3f3]">
                {lines.map((l) => (
                  <div key={l.product.id} className="flex items-center justify-between py-2 text-sm gap-3">
                    <span className="text-brand-gray-900 min-w-0 truncate">
                      {l.product.nameLt} <span className="text-brand-gray-400">× {l.qty}</span>
                      {l.hasPrice && l.overStock && (
                        <span className="block text-[11px] font-medium text-red-600">
                          Galima tik {l.available} vnt.
                        </span>
                      )}
                    </span>
                    {l.hasPrice ? (
                      l.overStock ? (
                        <button
                          type="button"
                          onClick={() => setQty(l.product.id, l.available)}
                          className="text-[12px] font-semibold text-brand-magenta hover:underline whitespace-nowrap"
                        >
                          Sumažinti iki {l.available}
                        </button>
                      ) : (
                        <span className="font-medium whitespace-nowrap">{fmt(l.total)}</span>
                      )
                    ) : (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-[12px] font-medium text-red-600">Nėra kainos</span>
                        <button
                          type="button"
                          onClick={() => setQty(l.product.id, 0)}
                          className="text-[12px] font-semibold text-brand-magenta hover:underline"
                        >
                          Pašalinti
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Pristatymas / mokėjimas */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
                    Pristatymas
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
                  >
                    {deliveryOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label} ({fmt(d.priceCents)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
                    Mokėjimas
                  </label>
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
                  >
                    {PAYMENT_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {deliveryMethod !== 'pickup' && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Adresas (gatvė, nr.)"
                    className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white sm:col-span-2"
                  />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Miestas"
                    className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
                  />
                  <input
                    value={postal}
                    onChange={(e) => setPostal(e.target.value)}
                    placeholder="Pašto kodas"
                    className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
                  />
                </div>
              )}

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Pastaba (nebūtina)"
                className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
              />

              {/* Sumos */}
              <div className="text-sm space-y-1 border-t border-[#eee] pt-3">
                <Row label="Tarpinė suma" value={fmt(subtotal)} />
                <Row label="Pristatymas" value={shipping === 0 ? 'Nemokamas' : fmt(shipping)} />
                {vatRate > 0 && (
                  <Row label={`PVM (${Math.round(vatRate * 100)}%)`} value={fmt(vat)} />
                )}
                <div className="flex justify-between font-bold text-brand-gray-900 border-t border-[#eee] pt-2 mt-1">
                  <span>Iš viso</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              {submitError && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || unpricedLines.length > 0 || overStockLines.length > 0}
                className="w-full px-5 py-3 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors disabled:opacity-50"
              >
                {submitting ? 'Pateikiama…' : 'Pateikti užsakymą'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-brand-gray-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ───────────────────────── Kliento pasirinkimas ─────────────────────────

function ClientStep({
  clients,
  selected,
  onSelect,
  onCreated,
}: {
  clients: RepClient[]
  selected: RepClient | null
  onSelect: (c: RepClient | null) => void
  onCreated: (c: RepClient) => void
}) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients.slice(0, 8)
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [clients, query])

  if (selected) {
    return (
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-brand-gray-900 truncate">{selected.name}</div>
          <div className="text-[12px] text-brand-gray-500">
            {selected.phone ?? '—'}
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold align-middle">
              {TIER_LABELS[selected.pricingTier] ?? selected.pricingTier}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            setQuery('')
            setCreating(false)
            onSelect(null)
          }}
          className="text-[13px] font-semibold text-brand-magenta hover:underline whitespace-nowrap"
        >
          Keisti
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
        Klientas
      </label>

      {!creating ? (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Ieškokite salono pagal pavadinimą, tel. ar el. paštą…"
            className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
          <div className="mt-2 border border-[#eee] rounded-lg divide-y divide-[#f3f3f3] overflow-hidden">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-[13px] text-brand-gray-400">
                Nerasta. Sukurkite naują klientą žemiau.
              </div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className="w-full text-left px-3 py-2.5 hover:bg-[#F9F9FB] transition-colors flex items-center justify-between gap-2"
              >
                <span className="min-w-0">
                  <span className="font-medium text-brand-gray-900">{c.name}</span>
                  <span className="block text-[11px] text-brand-gray-500">{c.phone ?? c.email ?? '—'}</span>
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {TIER_LABELS[c.pricingTier] ?? c.pricingTier}
                </span>
              </button>
            ))}
            <button
              onClick={() => setCreating(true)}
              className="w-full text-left px-3 py-2.5 bg-[#FbFbFc] hover:bg-[#F5F5F7] text-brand-magenta font-semibold text-[13px]"
            >
              + Sukurti naują klientą{query.trim() ? `: „${query.trim()}"` : ''}
            </button>
          </div>
        </>
      ) : (
        <NewClientForm
          initialName={query.trim()}
          onCancel={() => setCreating(false)}
          onCreated={(c) => {
            setCreating(false)
            setQuery('')
            onCreated(c)
          }}
        />
      )}
    </div>
  )
}

function NewClientForm({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string
  onCancel: () => void
  onCreated: (c: RepClient) => void
}) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Įveskite pavadinimą.')
    if (!phone.trim()) return setError('Įveskite telefono numerį.')
    start(async () => {
      const res = await createRepClient({ name, phone, email })
      if (res.ok) onCreated(res.client)
      else setError(res.error)
    })
  }

  return (
    <form onSubmit={submit} className="space-y-2.5 mt-1">
      <p className="text-[12px] text-brand-gray-500">
        Naujas klientas (kainų grupė — Didmena I; keičia administratorius):
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Salono / kliento pavadinimas *"
        autoFocus
        className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefonas *"
        className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="El. paštas (nebūtina)"
        className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
      />
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-[13px] hover:bg-brand-magenta-dark transition-colors disabled:opacity-50"
        >
          {pending ? 'Kuriama…' : 'Sukurti ir pasirinkti'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#ddd] rounded-lg font-semibold text-[13px] text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
        >
          Atšaukti
        </button>
      </div>
    </form>
  )
}

// ───────────────────────── Produktų pasirinkimas ─────────────────────────

function ProductStep({
  products,
  tier,
  cart,
  onQty,
  availableOf,
}: {
  products: RepProduct[]
  tier: string
  cart: Record<string, number>
  onQty: (pid: string, q: number) => void
  availableOf: (p: RepProduct) => number
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = q
      ? products.filter(
          (p) =>
            p.nameLt.toLowerCase().includes(q) ||
            (p.sku ?? '').toLowerCase().includes(q) ||
            (p.colorNumber ?? '').toLowerCase().includes(q)
        )
      : products
    return base.slice(0, 100)
  }, [products, search])

  return (
    <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
        Prekės
      </label>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Ieškoti prekės…"
        className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white mb-3"
      />
      <div className="border border-[#eee] rounded-lg divide-y divide-[#f3f3f3] max-h-[420px] overflow-y-auto">
        {filtered.map((p) => {
          const price = p.prices[tier]
          const qty = cart[p.id] ?? 0
          const hasPrice = typeof price === 'number'
          const available = availableOf(p)
          const soldOut = available <= 0
          const atMax = qty >= available
          return (
            <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-brand-gray-900 truncate">{p.nameLt}</div>
                <div className="text-[11px] text-brand-gray-400">
                  {p.sku ?? ''}
                  {hasPrice ? ` · ${fmt(price)}` : ' · kaina nenustatyta'}
                  {hasPrice && (
                    <span className={soldOut ? 'text-red-500' : ''}>
                      {' · '}
                      {soldOut ? 'nėra likučio' : `galima ${available}`}
                    </span>
                  )}
                </div>
              </div>
              {hasPrice && !soldOut ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onQty(p.id, qty - 1)}
                    disabled={qty === 0}
                    className="w-7 h-7 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7] disabled:opacity-40"
                  >−</button>
                  <input
                    type="number"
                    min={0}
                    max={available}
                    value={qty}
                    onChange={(e) =>
                      onQty(p.id, Math.min(available, parseInt(e.target.value || '0', 10)))
                    }
                    className="w-12 text-center px-1 py-1 bg-[#F5F5F7] border border-[#ddd] rounded-md text-sm"
                  />
                  <button
                    onClick={() => onQty(p.id, Math.min(available, qty + 1))}
                    disabled={atMax}
                    className="w-7 h-7 rounded-md border border-[#ddd] text-brand-gray-600 hover:bg-[#F5F5F7] disabled:opacity-40"
                  >+</button>
                </div>
              ) : (
                <span className="text-[11px] text-brand-gray-400 flex-shrink-0">—</span>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-[13px] text-brand-gray-400">Prekių nerasta.</div>
        )}
      </div>
    </div>
  )
}

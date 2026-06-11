'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin, X } from 'lucide-react'

/**
 * Omniva paštomato pasirinkimas checkout'e.
 *
 * Sąrašas kraunamas iš /api/omniva-lockers tik tada, kai komponentas
 * atvaizduojamas (t.y. klientui pasirinkus „Paštomatas"). Paieška
 * nejautri lietuviškoms raidėms („siauliai" randa „Šiauliai").
 *
 * `value` — laisvos formos tekstas, kuris keliauja į order.deliveryAddress
 * (kaip ir iki šiol), todėl backend'o, laiškų ir admin'o keisti nereikia.
 * Jei sąrašo užkrauti nepavyksta — fallback į rankinį įvedimą, checkout'as
 * niekada neužsiblokuoja.
 */

type OmnivaLocker = {
  id: string
  name: string
  city: string
  address: string
}

type PickerDict = {
  parcelLockerSelect: string
  parcelLockerPlaceholder: string
  parcelLockerNoResults: string
  parcelLockerLoadError: string
  parcelLockerChange: string
}

const MAX_RESULTS = 50

/** Nuima diakritikus palyginimui: „Šiauliai" → „siauliai". */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function OmnivaLockerPicker({
  value,
  onChange,
  dict,
}: {
  value: string
  onChange: (v: string) => void
  dict: PickerDict
}) {
  const [lockers, setLockers] = useState<OmnivaLocker[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/omniva-lockers')
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((data: OmnivaLocker[]) => {
        if (cancelled) return
        if (!Array.isArray(data) || data.length === 0) throw new Error('empty')
        setLockers(data)
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Uždarom dropdown'ą paspaudus šalia
  useEffect(() => {
    if (!open) return
    const handler = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [open])

  const results = useMemo(() => {
    if (!lockers) return []
    const terms = normalize(query).split(/\s+/).filter(Boolean)
    if (terms.length === 0) return lockers.slice(0, MAX_RESULTS)
    return lockers
      .filter((l) => {
        const haystack = normalize(`${l.name} ${l.city} ${l.address}`)
        return terms.every((t) => haystack.includes(t))
      })
      .slice(0, MAX_RESULTS)
  }, [lockers, query])

  const select = (l: OmnivaLocker) => {
    onChange(`${l.name}, ${l.address}, ${l.city}`)
    setQuery('')
    setOpen(false)
  }

  const labelEl = (
    <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
      {dict.parcelLockerSelect} <span className="text-brand-magenta">*</span>
    </span>
  )

  // Fallback: sąrašas nepasiekiamas — rankinis įvedimas kaip iki šiol
  if (loadFailed) {
    return (
      <label className="block">
        {labelEl}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={dict.parcelLockerPlaceholder}
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl focus:outline-none focus:border-brand-magenta transition-colors text-sm bg-white"
        />
        <span className="block mt-1.5 text-xs text-brand-gray-500">
          {dict.parcelLockerLoadError}
        </span>
      </label>
    )
  }

  // Paštomatas jau pasirinktas (arba prefill iš paskutinio užsakymo)
  if (value) {
    return (
      <div>
        {labelEl}
        <div className="flex items-center gap-3 px-4 py-3 border-2 border-brand-magenta bg-brand-magenta/5 rounded-xl">
          <MapPin className="w-4 h-4 text-brand-magenta shrink-0" />
          <span className="flex-1 text-sm text-brand-gray-900">{value}</span>
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(true)
            }}
            className="text-xs font-semibold text-brand-blue hover:underline shrink-0"
          >
            {dict.parcelLockerChange}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="block">
        {labelEl}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlighted(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || results.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHighlighted((h) => Math.min(h + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHighlighted((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              select(results[highlighted])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder={dict.parcelLockerPlaceholder}
          autoComplete="off"
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl focus:outline-none focus:border-brand-magenta transition-colors text-sm bg-white"
        />
      </label>
      {open && (
        <div
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-brand-gray-50 rounded-xl shadow-lg"
        >
          {lockers === null ? (
            <div className="px-4 py-3 text-sm text-brand-gray-500 animate-pulse">
              …
            </div>
          ) : results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-brand-gray-500">
              <X className="w-4 h-4 shrink-0" />
              {dict.parcelLockerNoResults}
            </div>
          ) : (
            results.map((l, i) => (
              <button
                key={l.id}
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onClick={() => select(l)}
                onPointerEnter={() => setHighlighted(i)}
                className={`block w-full text-left px-4 py-2.5 transition-colors ${
                  i === highlighted ? 'bg-brand-gray-50' : ''
                }`}
              >
                <span className="block text-sm text-brand-gray-900">
                  {l.name}
                </span>
                <span className="block text-xs text-brand-gray-500">
                  {l.address}, {l.city}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

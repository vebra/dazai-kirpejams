'use client'

import { useMemo, useState, useTransition } from 'react'
import { TIER_LABELS, type RepClient } from '@/lib/rep/types'
import { createRepClient } from '../actions'

export function ClientsManager({ clients: initial }: { clients: RepClient[] }) {
  const [clients, setClients] = useState<RepClient[]>(initial)
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
    )
  }, [clients, query])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Ieškoti kliento…"
          className="flex-1 px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
        />
        <button
          onClick={() => setCreating((v) => !v)}
          className="px-4 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
        >
          {creating ? 'Uždaryti' : '+ Naujas klientas'}
        </button>
      </div>

      {creating && (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
          <CreateForm
            onCreated={(c) => {
              setClients((list) => [c, ...list].sort((a, b) => a.name.localeCompare(b.name)))
              setCreating(false)
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-brand-gray-500">
            {clients.length === 0 ? 'Dar neturite klientų.' : 'Nieko nerasta.'}
          </div>
        ) : (
          <div className="divide-y divide-[#f3f3f3]">
            {filtered.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-brand-gray-900 truncate">{c.name}</div>
                  <div className="text-[12px] text-brand-gray-500">
                    {[c.phone, c.email].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold whitespace-nowrap">
                  {TIER_LABELS[c.pricingTier] ?? c.pricingTier}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateForm({
  onCreated,
  onCancel,
}: {
  onCreated: (c: RepClient) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
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
    <form onSubmit={submit} className="space-y-2.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Salono / kliento pavadinimas *"
        autoFocus
        className="w-full px-3 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
      />
      <div className="grid sm:grid-cols-2 gap-2.5">
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
      </div>
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">{error}</div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-[13px] hover:bg-brand-magenta-dark transition-colors disabled:opacity-50"
        >
          {pending ? 'Kuriama…' : 'Sukurti'}
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

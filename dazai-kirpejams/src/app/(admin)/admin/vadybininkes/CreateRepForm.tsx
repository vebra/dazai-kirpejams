'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRepAccount } from './actions'

export function CreateRepForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; link: string } | null>(null)
  const [copied, setCopied] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    start(async () => {
      const res = await createRepAccount({ email, name })
      if (res.ok) {
        setCreated({ email: res.email, link: res.link })
        setEmail('')
        setName('')
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
      {!open && !created && (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
        >
          + Nauja vadybininkė
        </button>
      )}

      {open && !created && (
        <form onSubmit={submit} className="space-y-3">
          <h3 className="text-sm font-bold text-brand-gray-900">Nauja vadybininkė</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="El. paštas *"
              required
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vardas Pavardė *"
              required
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
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
              {pending ? 'Kuriama…' : 'Sukurti'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null) }}
              className="px-4 py-2 border border-[#ddd] rounded-lg font-semibold text-[13px] text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
            >
              Atšaukti
            </button>
          </div>
        </form>
      )}

      {created && (
        <div className="space-y-3">
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[13px]">
            ✓ Vadybininkė <strong>{created.email}</strong> sukurta.
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
              Slaptažodžio nustatymo nuoroda — persiųskite vadybininkei (galioja ribotą laiką)
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={created.link}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 px-3 py-2 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-[12px] font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(created.link)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="px-4 py-2 bg-brand-gray-900 text-white rounded-lg font-semibold text-[13px] whitespace-nowrap"
              >
                {copied ? '✓ Nukopijuota' : 'Kopijuoti'}
              </button>
            </div>
          </div>
          <button
            onClick={() => { setCreated(null); setOpen(false) }}
            className="text-[13px] font-semibold text-brand-magenta hover:underline"
          >
            Sukurti dar vieną / uždaryti
          </button>
        </div>
      )}
    </div>
  )
}

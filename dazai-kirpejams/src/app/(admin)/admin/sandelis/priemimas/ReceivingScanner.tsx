'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { receiveScannedItem } from '../actions'

type LogEntry =
  | { id: number; kind: 'ok'; name: string; sku: string | null; stock: number }
  | { id: number; kind: 'notfound'; ean: string }
  | { id: number; kind: 'error'; message: string }

/** Trumpas garso signalas — patogu skanuojant nežiūrint į ekraną. */
function beep(ok: boolean) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = ok ? 880 : 240
    gain.gain.value = 0.05
    osc.start()
    osc.stop(ctx.currentTime + (ok ? 0.08 : 0.25))
    osc.onended = () => ctx.close()
  } catch {
    /* garsas nebūtinas */
  }
}

export function ReceivingScanner() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [busy, setBusy] = useState(false)
  const idRef = useRef(0)
  const queueRef = useRef<string[]>([])
  const processingRef = useRef(false)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function processQueue() {
    if (processingRef.current) return
    processingRef.current = true
    setBusy(true)
    while (queueRef.current.length > 0) {
      const ean = queueRef.current.shift()!
      const res = await receiveScannedItem(ean)
      const id = ++idRef.current
      if (res.ok && res.found) {
        beep(true)
        setLog((l) => [{ id, kind: 'ok', name: res.name, sku: res.sku, stock: res.stock }, ...l])
      } else if (res.ok && !res.found) {
        beep(false)
        setLog((l) => [{ id, kind: 'notfound', ean: res.ean }, ...l])
      } else {
        beep(false)
        setLog((l) => [{ id, kind: 'error', message: res.error }, ...l])
      }
    }
    processingRef.current = false
    setBusy(false)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = inputRef.current?.value.trim() ?? ''
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.focus()
    if (!val) return
    queueRef.current.push(val)
    void processQueue()
  }

  const okCount = log.filter((l) => l.kind === 'ok').length

  return (
    <div className="space-y-5">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
      >
        <label htmlFor="scan" className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5">
          Nuskenuokite barkodą {busy && <span className="text-brand-magenta">· apdorojama…</span>}
        </label>
        <input
          ref={inputRef}
          id="scan"
          autoComplete="off"
          autoFocus
          placeholder="Nukreipkite skanerį čia ir skenuokite…"
          className="w-full px-4 py-3 bg-[#F5F5F7] border-2 border-brand-magenta rounded-lg text-base focus:outline-none focus:bg-white"
        />
        <p className="mt-2 text-[12px] text-brand-gray-500">
          Skaneris automatiškai prideda <strong>+1</strong> prie likučio pagal barkodą (EAN).
          Laukelis lieka aktyvus — skenuokite vieną po kito. Jei prekė nerasta — pasiūlysiu sukurti.
        </p>
      </form>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-brand-gray-900">
          Priimta šioje sesijoje: {okCount}
        </h3>
        {log.length > 0 && (
          <button
            onClick={() => setLog([])}
            className="text-[12px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            Išvalyti žurnalą
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] divide-y divide-[#f3f3f3] overflow-hidden">
        {log.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-brand-gray-400">
            Dar nieko nenuskenuota.
          </div>
        ) : (
          log.map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              {e.kind === 'ok' ? (
                <>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-brand-gray-900 truncate">{e.name}</div>
                    {e.sku && <div className="text-[11px] text-brand-gray-400 font-mono">{e.sku}</div>}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      +1
                    </span>
                    <div className="text-[12px] text-brand-gray-500 mt-0.5">likutis: {e.stock}</div>
                  </div>
                </>
              ) : e.kind === 'notfound' ? (
                <>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-red-700">Prekė nerasta</div>
                    <div className="text-[11px] text-brand-gray-500 font-mono">EAN: {e.ean}</div>
                  </div>
                  <Link
                    href={`/admin/sandelis/naujas`}
                    className="px-3 py-1.5 bg-brand-magenta text-white rounded-md text-[12px] font-semibold whitespace-nowrap hover:bg-brand-magenta-dark"
                  >
                    + Sukurti
                  </Link>
                </>
              ) : (
                <div className="text-sm text-red-700">{e.message}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import {
  createDownloadAction,
  toggleDownloadAction,
  deleteDownloadAction,
  type DownloadFormState,
} from './actions'
import type { AdminDownloadRow } from '@/lib/admin/queries'

const initialState: DownloadFormState = {}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function CopyLinkButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    const url = `${window.location.origin}/atsisiuntimai/failas/${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Nukopijuokite nuorodą:', url)
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`px-2.5 py-1 border rounded text-[11px] font-semibold transition-colors ${
        copied
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
          : 'bg-[#F5F5F7] hover:bg-[#e8e8ec] border-[#ddd] text-brand-gray-900'
      }`}
    >
      {copied ? '✓ Nukopijuota' : '📋 Nuoroda'}
    </button>
  )
}

export function DownloadsManager({ downloads }: { downloads: AdminDownloadRow[] }) {
  const [state, formAction, isPending] = useActionState(
    createDownloadAction,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)
  const [showForm, setShowForm] = useState(downloads.length === 0)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
          >
            + Įkelti failą
          </button>
        )}
      </div>

      {showForm && (
        <form
          ref={formRef}
          action={formAction}
          className="p-5 bg-[#F9F9FB] border border-[#eee] rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-brand-gray-900">Naujas failas</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[12px] text-brand-gray-500 hover:text-brand-gray-900"
            >
              Uždaryti
            </button>
          </div>

          {state.error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
              ✓ Failas įkeltas
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
              Pavadinimas *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="pvz. Color SHOCK spalvų paletė 2026"
              className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
              Aprašymas (neprivaloma)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              maxLength={200}
              className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label htmlFor="visibility" className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
                Kam matomas
              </label>
              <select
                id="visibility"
                name="visibility"
                defaultValue="public"
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              >
                <option value="public">Visiems</option>
                <option value="pro">Tik profesionalams</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort_order" className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
                Eiliškumas
              </label>
              <input
                type="number"
                id="sort_order"
                name="sort_order"
                defaultValue={0}
                className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
              />
            </div>
            <div>
              <label htmlFor="file" className="block text-[12px] font-semibold text-brand-gray-900 mb-1">
                Failas * (max 25 MB)
              </label>
              <input
                type="file"
                id="file"
                name="file"
                required
                className="w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-brand-magenta file:text-white file:text-[12px] file:font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark disabled:opacity-60 transition-colors"
            >
              {isPending ? 'Įkeliama…' : 'Įkelti'}
            </button>
          </div>
        </form>
      )}

      {downloads.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          Failų dar nėra.
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Pavadinimas</th>
                  <th className="px-4 py-3 text-left">Failas</th>
                  <th className="px-4 py-3 text-center">Matomas</th>
                  <th className="px-4 py-3 text-center">Būsena</th>
                  <th className="px-4 py-3 text-right w-[240px]"></th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr key={d.id} className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-gray-900">{d.title}</div>
                      {d.description && (
                        <div className="text-[12px] text-brand-gray-500">{d.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
                      <div className="font-mono">{d.fileName ?? '—'}</div>
                      <div>{fmtSize(d.fileSizeBytes)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.visibility === 'pro' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-brand-magenta/10 text-brand-magenta border-brand-magenta/20">
                          🔒 Profesionalams
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-gray-100 text-gray-600 border-gray-200">
                          Visiems
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                          Aktyvus
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-gray-100 text-gray-500 border-gray-200">
                          Išjungtas
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <CopyLinkButton id={d.id} />
                        <form action={toggleDownloadAction}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="next_active" value={(!d.isActive).toString()} />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded text-[11px] font-semibold text-brand-gray-900 transition-colors"
                          >
                            {d.isActive ? 'Išjungti' : 'Įjungti'}
                          </button>
                        </form>
                        <form action={deleteDownloadAction}>
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-white border border-[#ddd] rounded text-[11px] font-semibold text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                          >
                            Trinti
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  updateEventRegistrationStatusAction,
  deleteEventRegistrationAction,
} from './actions'
import type { EventRegistrationRow } from '@/lib/admin/queries'

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Patvirtinta',
  cancelled: 'Atšaukta',
  attended: 'Dalyvavo',
  no_show: 'Neatvyko',
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  attended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  no_show: 'bg-red-50 text-red-700 border-red-200',
}

const ROLE_LABELS: Record<string, string> = {
  kirpejas: 'Kirpėjas/-a',
  koloristas: 'Koloristas/-ė',
  savininkas: 'Salono savininkas/-ė',
  kita: 'Kita',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

export function EventRegistrationsTable({
  registrations,
}: {
  registrations: EventRegistrationRow[]
}) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered =
    filter === 'all'
      ? registrations
      : registrations.filter((r) => r.status === filter)

  return (
    <div className="space-y-4">
      {/* Filtrai */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'confirmed', 'attended', 'cancelled', 'no_show'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
              filter === s
                ? 'bg-brand-gray-900 text-white'
                : 'bg-[#F5F5F7] text-brand-gray-500 hover:text-brand-gray-900'
            }`}
          >
            {s === 'all' ? 'Visos' : STATUS_LABELS[s]}
            {s === 'all'
              ? ` (${registrations.length})`
              : ` (${registrations.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          {filter === 'all'
            ? 'Registracijų dar nėra.'
            : 'Nėra registracijų su šia būsena.'}
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Vardas, pavardė</th>
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-left">Telefonas</th>
                  <th className="px-4 py-3 text-left">Salonas</th>
                  <th className="px-4 py-3 text-center w-[70px]">+Sveč.</th>
                  <th className="px-4 py-3 text-center w-[120px]">Būsena</th>
                  <th className="px-4 py-3 text-left w-[140px]">Registruotasi</th>
                  <th className="px-4 py-3 text-right w-[200px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => {
                  const isExpanded = expandedId === reg.id
                  return (
                    <RegistrationRow
                      key={reg.id}
                      registration={reg}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedId(isExpanded ? null : reg.id)
                      }
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function RegistrationRow({
  registration: reg,
  isExpanded,
  onToggle,
}: {
  registration: EventRegistrationRow
  isExpanded: boolean
  onToggle: () => void
}) {
  const fullName = `${reg.firstName} ${reg.lastName}`.trim()
  return (
    <>
      <tr className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="font-semibold text-brand-gray-900 hover:text-brand-magenta transition-colors text-left"
          >
            {fullName}
          </button>
        </td>
        <td className="px-4 py-3">
          <a
            href={`mailto:${reg.email}`}
            className="text-brand-magenta hover:underline text-[12px]"
          >
            {reg.email}
          </a>
        </td>
        <td className="px-4 py-3">
          <a
            href={`tel:${reg.phone}`}
            className="text-brand-gray-500 hover:text-brand-gray-900 text-[12px]"
          >
            {reg.phone}
          </a>
        </td>
        <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
          {reg.salonName || '—'}
        </td>
        <td className="px-4 py-3 text-center text-brand-gray-900 text-[12px] font-semibold">
          {reg.guestsCount > 0 ? `+${reg.guestsCount}` : '—'}
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              STATUS_COLORS[reg.status] ?? STATUS_COLORS.confirmed
            }`}
          >
            {STATUS_LABELS[reg.status] ?? reg.status}
          </span>
        </td>
        <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
          {formatDate(reg.createdAt)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex gap-1">
            <form action={updateEventRegistrationStatusAction}>
              <input type="hidden" name="id" value={reg.id} />
              <select
                name="status"
                defaultValue={reg.status}
                onChange={(e) => {
                  const form = e.target.closest('form')
                  if (form) form.requestSubmit()
                }}
                className="px-2 py-1 bg-[#F5F5F7] border border-[#ddd] rounded text-[11px] font-semibold text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
              >
                <option value="confirmed">Patvirtinta</option>
                <option value="attended">Dalyvavo</option>
                <option value="no_show">Neatvyko</option>
                <option value="cancelled">Atšaukta</option>
              </select>
            </form>
            <form action={deleteEventRegistrationAction}>
              <input type="hidden" name="id" value={reg.id} />
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm(`Ar tikrai trinti registraciją: ${fullName}?`)) {
                    e.preventDefault()
                  }
                }}
                className="px-2.5 py-1 bg-white border border-[#ddd] rounded text-[11px] font-semibold text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                Trinti
              </button>
            </form>
          </div>
        </td>
      </tr>

      {/* Išplėstinė detalė */}
      {isExpanded && (
        <tr className="bg-[#F9F9FB]">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Rolė
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {reg.role ? (ROLE_LABELS[reg.role] ?? reg.role) : '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Dalyvių skaičius
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {1 + reg.guestsCount} žm.{' '}
                  {reg.guestsCount > 0 && `(+${reg.guestsCount} sveč.)`}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Priminimas išsiųstas
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {reg.reminderSentAt ? formatDate(reg.reminderSentAt) : '—'}
                </div>
              </div>
              {reg.notes && (
                <div className="md:col-span-3">
                  <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                    Pastabos
                  </span>
                  <div className="text-brand-gray-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {reg.notes}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  updateEventRegistrationStatusAction,
  deleteEventRegistrationAction,
  updateRegistrationNotesAction,
  bulkUpdateStatusAction,
  resendConfirmationEmailAction,
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

export type TableFeatures = {
  bulkActions: boolean
  manualEmail: boolean
  notes: boolean
  csvExport: boolean
  printView: boolean
}

export function EventRegistrationsTable({
  registrations,
  features,
}: {
  registrations: EventRegistrationRow[]
  features: TableFeatures
}) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = registrations
    .filter((r) => filter === 'all' || r.status === filter)
    .filter((r) => {
      if (!search.trim()) return true
      const term = search.toLowerCase()
      return (
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        (r.salonName ?? '').toLowerCase().includes(term)
      )
    })

  const allSelectedOnPage =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id))

  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (allSelectedOnPage) {
      const next = new Set(selected)
      for (const r of filtered) next.delete(r.id)
      setSelected(next)
    } else {
      const next = new Set(selected)
      for (const r of filtered) next.add(r.id)
      setSelected(next)
    }
  }

  function clearSelection() {
    setSelected(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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

        <div className="ml-auto flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vardas, email, salonas…"
            className="px-3 py-1.5 bg-white border border-[#ddd] rounded-lg text-[12px] focus:outline-none focus:border-brand-magenta w-[220px]"
          />
          {features.csvExport && (
            <a
              href={`/admin/renginiai/eksportas?status=${filter}`}
              className="px-3 py-1.5 bg-white border border-[#ddd] hover:border-brand-magenta text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
              title="Atsisiųsti CSV failą"
            >
              ⤓ CSV
            </a>
          )}
          {features.printView && (
            <a
              href="/admin/renginiai/spausdinti"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white border border-[#ddd] hover:border-brand-magenta text-brand-gray-900 rounded-lg text-[12px] font-semibold transition-colors"
              title="Atspausdinamas dalyvių sąrašas"
            >
              🖨 Spausdinti
            </a>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {features.bulkActions && selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          ids={Array.from(selected)}
          onClear={clearSelection}
        />
      )}

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          {filter === 'all' && !search.trim()
            ? 'Registracijų dar nėra.'
            : 'Nėra registracijų pagal filtrus.'}
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  {features.bulkActions && (
                    <th className="px-3 py-3 w-[40px]">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-brand-magenta cursor-pointer"
                        aria-label="Pažymėti visus"
                      />
                    </th>
                  )}
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
                {filtered.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    registration={reg}
                    isExpanded={expandedId === reg.id}
                    onToggle={() =>
                      setExpandedId(expandedId === reg.id ? null : reg.id)
                    }
                    isSelected={selected.has(reg.id)}
                    onSelectToggle={() => toggleSelect(reg.id)}
                    features={features}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function BulkActionBar({
  count,
  ids,
  onClear,
}: {
  count: number
  ids: string[]
  onClear: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-brand-magenta/5 border border-brand-magenta/20 rounded-xl">
      <span className="text-sm font-semibold text-brand-magenta">
        Pažymėta: {count}
      </span>
      <form
        action={bulkUpdateStatusAction}
        className="flex items-center gap-2"
        onSubmit={() => onClear()}
      >
        <input type="hidden" name="ids" value={ids.join(',')} />
        <select
          name="status"
          defaultValue="attended"
          className="px-2 py-1 bg-white border border-[#ddd] rounded text-[12px] font-semibold text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
        >
          <option value="attended">Pažymėti „Dalyvavo“</option>
          <option value="no_show">Pažymėti „Neatvyko“</option>
          <option value="cancelled">Pažymėti „Atšaukta“</option>
          <option value="confirmed">Pažymėti „Patvirtinta“</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1 bg-brand-magenta hover:bg-brand-magenta-dark text-white rounded text-[12px] font-semibold transition-colors"
        >
          Taikyti
        </button>
      </form>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto px-2 py-1 text-[12px] text-brand-gray-500 hover:text-brand-gray-900"
      >
        Išvalyti
      </button>
    </div>
  )
}

function RegistrationRow({
  registration: reg,
  isExpanded,
  onToggle,
  isSelected,
  onSelectToggle,
  features,
}: {
  registration: EventRegistrationRow
  isExpanded: boolean
  onToggle: () => void
  isSelected: boolean
  onSelectToggle: () => void
  features: TableFeatures
}) {
  const fullName = `${reg.firstName} ${reg.lastName}`.trim()
  const colSpan = features.bulkActions ? 9 : 8

  return (
    <>
      <tr
        className={`border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors ${
          isSelected ? 'bg-brand-magenta/[0.03]' : ''
        }`}
      >
        {features.bulkActions && (
          <td className="px-3 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelectToggle}
              className="w-4 h-4 accent-brand-magenta cursor-pointer"
              aria-label={`Pažymėti ${fullName}`}
            />
          </td>
        )}
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

      {isExpanded && (
        <tr className="bg-[#F9F9FB]">
          <td colSpan={colSpan} className="px-6 py-4">
            <div className="space-y-4">
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
              </div>

              {features.manualEmail && (
                <ManualEmailButtons
                  id={reg.id}
                  hasReminder={Boolean(reg.reminderSentAt)}
                />
              )}

              {features.notes && (
                <NotesEditor id={reg.id} initialNotes={reg.notes} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function ManualEmailButtons({
  id,
  hasReminder,
}: {
  id: string
  hasReminder: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<
    { ok: boolean; msg: string } | null
  >(null)

  function send(kind: 'confirmation' | 'reminder') {
    setFeedback(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      fd.set('kind', kind)
      const result = await resendConfirmationEmailAction(fd)
      if (result.ok) {
        setFeedback({
          ok: true,
          msg:
            kind === 'reminder'
              ? 'Priminimas išsiųstas.'
              : 'Patvirtinimas išsiųstas iš naujo.',
        })
      } else {
        setFeedback({
          ok: false,
          msg: 'Nepavyko išsiųsti. Patikrinkite log.',
        })
      }
    })
  }

  return (
    <div className="pt-3 border-t border-[#eee]">
      <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
        Email veiksmai
      </span>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => send('confirmation')}
          className="px-3 py-1.5 bg-white border border-[#ddd] hover:border-brand-magenta text-brand-gray-900 rounded text-[12px] font-semibold transition-colors disabled:opacity-50"
        >
          ✉ Persiųsti patvirtinimą + ICS
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (hasReminder) {
              if (!confirm('Priminimas jau išsiųstas. Siųsti dar kartą?')) return
            }
            send('reminder')
          }}
          className="px-3 py-1.5 bg-white border border-[#ddd] hover:border-brand-magenta text-brand-gray-900 rounded text-[12px] font-semibold transition-colors disabled:opacity-50"
        >
          🔔 Siųsti priminimą
        </button>
        {pending && (
          <span className="text-[12px] text-brand-gray-500">Siunčiama…</span>
        )}
        {feedback && (
          <span
            className={`text-[12px] font-semibold ${
              feedback.ok ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {feedback.msg}
          </span>
        )}
      </div>
    </div>
  )
}

function NotesEditor({
  id,
  initialNotes,
}: {
  id: string
  initialNotes: string | null
}) {
  const [value, setValue] = useState(initialNotes ?? '')
  const [saving, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const dirty = (initialNotes ?? '') !== value

  function save() {
    if (!dirty) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('id', id)
      fd.set('notes', value)
      const result = await updateRegistrationNotesAction(fd)
      if (result.ok) setSavedAt(Date.now())
    })
  }

  return (
    <div className="pt-3 border-t border-[#eee]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
          Admin pastabos
        </span>
        {savedAt && !dirty && (
          <span className="text-[11px] text-emerald-700 font-semibold">
            ✓ Išsaugota
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        rows={2}
        placeholder="Pvz. „VIP klientas“, „atvyks su 2 kolegomis“…"
        className="mt-1.5 w-full px-3 py-2 bg-white border border-[#ddd] rounded text-[13px] text-brand-gray-900 focus:outline-none focus:border-brand-magenta resize-y"
      />
      {dirty && !saving && (
        <div className="mt-1 text-[11px] text-brand-gray-500">
          Spustelkite kitur, kad išsaugoti.
        </div>
      )}
      {saving && (
        <div className="mt-1 text-[11px] text-brand-gray-500">Saugoma…</div>
      )}
    </div>
  )
}

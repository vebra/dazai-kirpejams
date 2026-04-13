'use client'

import { useState } from 'react'
import {
  updateB2bInquiryStatusAction,
  deleteB2bInquiryAction,
} from './actions'
import type { B2bInquiryRow } from '@/lib/admin/queries'

const STATUS_LABELS: Record<string, string> = {
  new: 'Nauja',
  contacted: 'Susisiekta',
  converted: 'Konvertuota',
  closed: 'Uždaryta',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200',
  converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

export function B2bInquiriesTable({
  inquiries,
}: {
  inquiries: B2bInquiryRow[]
}) {
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered =
    filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter)

  return (
    <div className="space-y-4">
      {/* Filtrai */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'new', 'contacted', 'converted', 'closed'].map((s) => (
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
              ? ` (${inquiries.length})`
              : ` (${inquiries.filter((i) => i.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          {filter === 'all'
            ? 'B2B užklausų dar nėra.'
            : 'Nėra užklausų su šia būsena.'}
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Salonas</th>
                  <th className="px-4 py-3 text-left">Kontaktas</th>
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-left">Telefonas</th>
                  <th className="px-4 py-3 text-center w-[120px]">Būsena</th>
                  <th className="px-4 py-3 text-left w-[140px]">Data</th>
                  <th className="px-4 py-3 text-right w-[180px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inq) => {
                  const isExpanded = expandedId === inq.id
                  return (
                    <InquiryRow
                      key={inq.id}
                      inquiry={inq}
                      isExpanded={isExpanded}
                      onToggle={() =>
                        setExpandedId(isExpanded ? null : inq.id)
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

function InquiryRow({
  inquiry: inq,
  isExpanded,
  onToggle,
}: {
  inquiry: B2bInquiryRow
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="font-semibold text-brand-gray-900 hover:text-brand-magenta transition-colors text-left"
          >
            {inq.salonName}
          </button>
        </td>
        <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
          {inq.contactName}
        </td>
        <td className="px-4 py-3">
          <a
            href={`mailto:${inq.email}`}
            className="text-brand-magenta hover:underline text-[12px]"
          >
            {inq.email}
          </a>
        </td>
        <td className="px-4 py-3">
          <a
            href={`tel:${inq.phone}`}
            className="text-brand-gray-500 hover:text-brand-gray-900 text-[12px]"
          >
            {inq.phone}
          </a>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              STATUS_COLORS[inq.status] ?? STATUS_COLORS.new
            }`}
          >
            {STATUS_LABELS[inq.status] ?? inq.status}
          </span>
        </td>
        <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
          {formatDate(inq.createdAt)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex gap-1">
            <form action={updateB2bInquiryStatusAction}>
              <input type="hidden" name="id" value={inq.id} />
              <select
                name="status"
                defaultValue={inq.status}
                onChange={(e) => {
                  const form = e.target.closest('form')
                  if (form) form.requestSubmit()
                }}
                className="px-2 py-1 bg-[#F5F5F7] border border-[#ddd] rounded text-[11px] font-semibold text-brand-gray-900 focus:outline-none focus:border-brand-magenta"
              >
                <option value="new">Nauja</option>
                <option value="contacted">Susisiekta</option>
                <option value="converted">Konvertuota</option>
                <option value="closed">Uždaryta</option>
              </select>
            </form>
            <form action={deleteB2bInquiryAction}>
              <input type="hidden" name="id" value={inq.id} />
              <button
                type="submit"
                onClick={(e) => {
                  if (
                    !confirm(`Ar tikrai trinti užklausą nuo ${inq.salonName}?`)
                  ) {
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
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Adresas
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {inq.address || '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Mėnesinis poreikis
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {inq.monthlyVolume || '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Kalba
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {inq.locale === 'lt'
                    ? 'Lietuvių'
                    : inq.locale === 'en'
                      ? 'English'
                      : 'Русский'}
                </div>
              </div>
              {inq.message && (
                <div className="md:col-span-3">
                  <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                    Žinutė
                  </span>
                  <div className="text-brand-gray-900 mt-0.5 whitespace-pre-wrap leading-relaxed">
                    {inq.message}
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

'use client'

import { useState, useActionState } from 'react'
import {
  approveUserAction,
  rejectUserAction,
  viewVerificationDocumentAction,
  type RejectUserState,
} from './actions'
import type { UserProfileRow } from '@/lib/admin/queries'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Laukia',
  approved: 'Patvirtintas',
  rejected: 'Atmestas',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  hairdresser: 'Kirpėjas',
  salon: 'Salonas',
  other: 'Kita',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

export function VerificationTable({
  profiles,
}: {
  profiles: UserProfileRow[]
}) {
  const [filter, setFilter] = useState<string>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered =
    filter === 'all'
      ? profiles
      : profiles.filter((p) => p.verificationStatus === filter)

  return (
    <div className="space-y-4">
      {/* Filtrai */}
      <div className="flex items-center gap-2 flex-wrap">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
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
            {s === 'all' ? 'Visi' : STATUS_LABELS[s]}
            {s === 'all'
              ? ` (${profiles.length})`
              : ` (${profiles.filter((p) => p.verificationStatus === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-brand-gray-500 bg-[#F9F9FB] border border-[#eee] rounded-xl">
          {filter === 'pending'
            ? 'Nėra laukiančių peržiūros vartotojų.'
            : 'Nėra vartotojų su šia būsena.'}
        </div>
      ) : (
        <div className="border border-[#eee] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Vartotojas</th>
                  <th className="px-4 py-3 text-left">Tipas</th>
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-center w-[120px]">Būsena</th>
                  <th className="px-4 py-3 text-left w-[140px]">
                    Registracija
                  </th>
                  <th className="px-4 py-3 text-right w-[200px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <ProfileRow
                    key={p.id}
                    profile={p}
                    isExpanded={expandedId === p.id}
                    onToggle={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
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

const rejectInitialState: RejectUserState = {}

function ProfileRow({
  profile: p,
  isExpanded,
  onToggle,
}: {
  profile: UserProfileRow
  isExpanded: boolean
  onToggle: () => void
}) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectState, rejectFormAction, isRejecting] = useActionState(
    rejectUserAction,
    rejectInitialState
  )

  const fullName =
    `${p.firstName} ${p.lastName}`.trim() || p.email || 'Be vardo'

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
          {p.salonName && (
            <div className="text-[11px] text-brand-gray-500">{p.salonName}</div>
          )}
        </td>
        <td className="px-4 py-3 text-[12px] text-brand-gray-500">
          {BUSINESS_TYPE_LABELS[p.businessType ?? ''] ?? '—'}
        </td>
        <td className="px-4 py-3">
          <a
            href={`mailto:${p.email}`}
            className="text-brand-magenta hover:underline text-[12px]"
          >
            {p.email}
          </a>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              STATUS_COLORS[p.verificationStatus]
            }`}
          >
            {STATUS_LABELS[p.verificationStatus]}
          </span>
        </td>
        <td className="px-4 py-3 text-brand-gray-500 text-[12px]">
          {formatDate(p.createdAt)}
        </td>
        <td className="px-4 py-3 text-right">
          {p.verificationStatus === 'pending' && (
            <div className="inline-flex gap-1">
              <form action={approveUserAction}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  Patvirtinti
                </button>
              </form>
              <button
                type="button"
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="px-3 py-1 bg-white border border-[#ddd] rounded text-[11px] font-semibold text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                Atmesti
              </button>
            </div>
          )}
          {p.verificationStatus === 'rejected' && (
            <form action={approveUserAction}>
              <input type="hidden" name="id" value={p.id} />
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                Vis tiek patvirtinti
              </button>
            </form>
          )}
          {p.verificationStatus === 'approved' && (
            <span className="text-[11px] text-brand-gray-500">
              {p.verifiedAt ? formatDate(p.verifiedAt) : ''}
            </span>
          )}
        </td>
      </tr>

      {/* Detalės */}
      {isExpanded && (
        <tr className="bg-[#F9F9FB]">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Telefonas
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {p.phone || '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Įmonės kodas
                </span>
                <div className="text-brand-gray-900 mt-0.5">
                  {p.companyCode || '—'}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                  Dokumentas
                </span>
                <div className="mt-0.5">
                  {p.verificationDocumentUrl ? (
                    <form action={viewVerificationDocumentAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-brand-magenta hover:underline font-medium"
                      >
                        Peržiūrėti dokumentą
                      </button>
                    </form>
                  ) : (
                    <span className="text-brand-gray-500">Nepateiktas</span>
                  )}
                </div>
              </div>
              {p.verificationNotes && (
                <div className="md:col-span-3">
                  <span className="text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
                    Vartotojo komentaras
                  </span>
                  <div className="text-brand-gray-900 mt-0.5 whitespace-pre-wrap">
                    {p.verificationNotes}
                  </div>
                </div>
              )}
              {p.rejectionReason && (
                <div className="md:col-span-3">
                  <span className="text-[11px] font-semibold text-red-600 uppercase tracking-[0.5px]">
                    Atmetimo priežastis
                  </span>
                  <div className="text-red-700 mt-0.5 whitespace-pre-wrap">
                    {p.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Atmetimo forma */}
      {showRejectForm && p.verificationStatus === 'pending' && (
        <tr className="bg-red-50/50">
          <td colSpan={6} className="px-6 py-4">
            <form action={rejectFormAction} className="max-w-lg space-y-3">
              <input type="hidden" name="id" value={p.id} />
              {rejectState.error && (
                <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded text-[12px]">
                  {rejectState.error}
                </div>
              )}
              <div>
                <label
                  htmlFor={`reject-reason-${p.id}`}
                  className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
                >
                  Atmetimo priežastis *
                </label>
                <textarea
                  id={`reject-reason-${p.id}`}
                  name="reason"
                  required
                  rows={2}
                  placeholder="Pvz. Dokumentas neįskaitomas, prašome pateikti naują..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {isRejecting ? 'Atmetama…' : 'Atmesti'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 bg-white border border-[#ddd] rounded-lg text-[12px] font-semibold text-brand-gray-500 hover:text-brand-gray-900 transition-colors"
                >
                  Atšaukti
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}

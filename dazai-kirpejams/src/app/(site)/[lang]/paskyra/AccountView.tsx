'use client'

import { useActionState } from 'react'
import type { Locale } from '@/i18n/config'
import type { VerificationStatus } from '@/lib/auth/verification'
import {
  uploadDocumentAction,
  logoutAction,
  type UploadDocState,
} from './actions'

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; description: string }
> = {
  pending: {
    label: 'Laukia patvirtinimo',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    description:
      'Jūsų paskyra peržiūrima. Kai administratorius patvirtins dokumentą, galėsite matyti kainas ir pirkti. Tai užtrunka iki 1 darbo dienos.',
  },
  approved: {
    label: 'Patvirtinta',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description:
      'Jūsų paskyra patvirtinta. Galite matyti kainas ir pirkti produktus.',
  },
  rejected: {
    label: 'Atmesta',
    color: 'bg-red-50 text-red-600 border-red-200',
    description:
      'Jūsų dokumentas buvo atmestas. Įkelkite naują dokumentą ir bandykite dar kartą.',
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = Record<string, any> | null

const BUSINESS_LABELS: Record<string, string> = {
  hairdresser: 'Kirpėjas / koloristas',
  salon: 'Grožio salonas',
  other: 'Kita profesinė veikla',
}

const uploadInitial: UploadDocState = {}

export function AccountView({
  lang,
  email,
  status,
  profile,
}: {
  lang: Locale
  email: string
  userId: string
  status: VerificationStatus
  profile: Profile
}) {
  const [uploadState, uploadFormAction, isUploading] = useActionState(
    uploadDocumentAction,
    uploadInitial
  )

  const statusKey = status ?? 'pending'
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending
  const hasDocument = !!profile?.verification_document_url

  return (
    <div className="space-y-6">
      {/* Vartotojo info */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-brand-gray-900 mb-1">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-sm text-brand-gray-500">{email}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${cfg.color}`}
          >
            {cfg.label}
          </span>
        </div>

        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed border ${cfg.color}`}>
          {cfg.description}
          {statusKey === 'rejected' && profile?.rejection_reason && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <strong>Priežastis:</strong> {profile.rejection_reason}
            </div>
          )}
        </div>

        {/* Profilio duomenys */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
          <InfoRow
            label="Veiklos tipas"
            value={BUSINESS_LABELS[profile?.business_type] ?? '—'}
          />
          <InfoRow label="Telefonas" value={profile?.phone || '—'} />
          {profile?.salon_name && (
            <InfoRow label="Salonas" value={profile.salon_name} />
          )}
          {profile?.company_code && (
            <InfoRow label="Įmonės kodas" value={profile.company_code} />
          )}
        </div>
      </div>

      {/* Dokumento įkėlimas */}
      {statusKey !== 'approved' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-brand-gray-900 mb-2">
            Profesinės kvalifikacijos dokumentas
          </h3>
          <p className="text-sm text-brand-gray-500 mb-5 leading-relaxed">
            Įkelkite kirpėjo sertifikatą arba verslo liudijimą. Leidžiami
            formatai: JPG, PNG, WebP, PDF. Maksimalus dydis — 10 MB.
          </p>

          {hasDocument && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              Dokumentas jau įkeltas.{' '}
              {statusKey === 'rejected'
                ? 'Galite įkelti naują.'
                : 'Laukiame patvirtinimo.'}
            </div>
          )}

          {uploadState.success && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              Dokumentas sėkmingai įkeltas!
            </div>
          )}

          {uploadState.error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {uploadState.error}
            </div>
          )}

          <form action={uploadFormAction} className="space-y-4">
            <label className="block">
              <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
                Pasirinkite failą <span className="text-brand-magenta">*</span>
              </span>
              <input
                type="file"
                name="document"
                required
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="block w-full text-sm text-brand-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-magenta/10 file:text-brand-magenta hover:file:bg-brand-magenta/20 file:cursor-pointer file:transition-colors"
              />
            </label>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-3 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Įkeliama…' : 'Įkelti dokumentą'}
            </button>
          </form>
        </div>
      )}

      {/* Atsijungimas */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-brand-gray-900">
              Atsijungti
            </h3>
            <p className="text-sm text-brand-gray-500">
              Atsijungsite nuo savo paskyros.
            </p>
          </div>
          <form action={logoutAction}>
            <input type="hidden" name="lang" value={lang} />
            <button
              type="submit"
              className="px-5 py-2.5 border border-[#E0E0E0] rounded-xl text-sm font-semibold text-brand-gray-900 hover:bg-brand-gray-50 transition-colors"
            >
              Atsijungti
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold text-brand-gray-500 uppercase tracking-[0.5px]">
        {label}
      </span>
      <span className="text-brand-gray-900 mt-0.5">{value}</span>
    </div>
  )
}

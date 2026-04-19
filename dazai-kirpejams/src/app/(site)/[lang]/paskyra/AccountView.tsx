'use client'

import { useActionState } from 'react'
import type { Locale } from '@/i18n/config'
import type { VerificationStatus } from '@/lib/auth/verification'
import type { CustomerInvoice } from '@/lib/invoices/queries'
import {
  uploadDocumentAction,
  logoutAction,
  downloadCustomerInvoiceAction,
  type UploadDocState,
} from './actions'

const LOCALE_MAP: Record<string, string> = { lt: 'lt-LT', en: 'en-GB', ru: 'ru-RU' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = Record<string, any> | null

type AccountDict = {
  statusLabels: { pending: string; approved: string; rejected: string }
  statusDescriptions: { pending: string; approved: string; rejected: string }
  rejectionReason: string
  businessTypes: { hairdresser: string; salon: string; other: string }
  labels: { businessType: string; phone: string; salon: string; companyCode: string }
  document: {
    title: string
    desc: string
    alreadyUploaded: string
    canUploadNew: string
    waitingApproval: string
    uploadSuccess: string
    fileLabel: string
    uploading: string
    uploadCta: string
  }
  invoices: {
    title: string
    desc: string
    empty: string
    orderPrefix: string
    downloadPdf: string
    pdfPending: string
  }
  logout: { title: string; desc: string; cta: string }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

const uploadInitial: UploadDocState = {}

export function AccountView({
  lang,
  email,
  status,
  profile,
  invoices,
  dict,
}: {
  lang: Locale
  email: string
  userId: string
  status: VerificationStatus
  profile: Profile
  invoices: CustomerInvoice[]
  dict: AccountDict
}) {
  const [uploadState, uploadFormAction, isUploading] = useActionState(
    uploadDocumentAction,
    uploadInitial
  )

  const priceFormatter = new Intl.NumberFormat(LOCALE_MAP[lang] ?? 'lt-LT', {
    style: 'currency',
    currency: 'EUR',
  })
  const dateFormatter = new Intl.DateTimeFormat(LOCALE_MAP[lang] ?? 'lt-LT', {
    dateStyle: 'long',
  })

  const statusKey = (status ?? 'pending') as keyof typeof dict.statusLabels
  const colorClass = STATUS_COLORS[statusKey] ?? STATUS_COLORS.pending
  const statusLabel = dict.statusLabels[statusKey] ?? dict.statusLabels.pending
  const statusDesc =
    dict.statusDescriptions[statusKey] ?? dict.statusDescriptions.pending
  const hasDocument = !!profile?.verification_document_url
  const businessType = profile?.business_type as
    | keyof typeof dict.businessTypes
    | undefined
  const businessLabel = businessType ? dict.businessTypes[businessType] : '—'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-brand-gray-900 mb-1">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-sm text-brand-gray-500">{email}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${colorClass}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed border ${colorClass}`}>
          {statusDesc}
          {statusKey === 'rejected' && profile?.rejection_reason && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <strong>{dict.rejectionReason}</strong> {profile.rejection_reason}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-sm">
          <InfoRow label={dict.labels.businessType} value={businessLabel ?? '—'} />
          <InfoRow label={dict.labels.phone} value={profile?.phone || '—'} />
          {profile?.salon_name && (
            <InfoRow label={dict.labels.salon} value={profile.salon_name} />
          )}
          {profile?.company_code && (
            <InfoRow label={dict.labels.companyCode} value={profile.company_code} />
          )}
        </div>
      </div>

      {statusKey !== 'approved' && (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-bold text-brand-gray-900 mb-2">
            {dict.document.title}
          </h3>
          <p className="text-sm text-brand-gray-500 mb-5 leading-relaxed">
            {dict.document.desc}
          </p>

          {hasDocument && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              {dict.document.alreadyUploaded}{' '}
              {statusKey === 'rejected'
                ? dict.document.canUploadNew
                : dict.document.waitingApproval}
            </div>
          )}

          {uploadState.success && (
            <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              {dict.document.uploadSuccess}
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
                {dict.document.fileLabel} <span className="text-brand-magenta">*</span>
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
              {isUploading ? dict.document.uploading : dict.document.uploadCta}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-brand-gray-900 mb-2">
          {dict.invoices.title}
        </h3>
        <p className="text-sm text-brand-gray-500 mb-5 leading-relaxed">
          {dict.invoices.desc}
        </p>

        {invoices.length === 0 ? (
          <div className="px-4 py-6 bg-brand-gray-50 border border-[#eee] rounded-xl text-sm text-brand-gray-500 text-center">
            {dict.invoices.empty}
          </div>
        ) : (
          <ul className="divide-y divide-[#eee] border border-[#eee] rounded-xl overflow-hidden">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-4 p-4 flex-wrap bg-white"
              >
                <div className="min-w-0">
                  <div className="font-mono font-semibold text-brand-gray-900 text-sm">
                    {inv.invoiceNumber}
                  </div>
                  <div className="text-[12px] text-brand-gray-500 mt-0.5">
                    {dict.invoices.orderPrefix}{' '}
                    <span className="font-mono">{inv.orderNumber}</span> ·{' '}
                    {dateFormatter.format(new Date(inv.issuedAt))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-gray-900">
                    {priceFormatter.format(inv.totalCents / 100)}
                  </span>
                  {inv.pdfPath ? (
                    <form action={downloadCustomerInvoiceAction}>
                      <input type="hidden" name="invoice_id" value={inv.id} />
                      <input type="hidden" name="lang" value={lang} />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-brand-magenta text-white rounded-lg text-[13px] font-semibold hover:bg-brand-magenta/90 transition-colors"
                      >
                        {dict.invoices.downloadPdf}
                      </button>
                    </form>
                  ) : (
                    <span className="text-[12px] text-brand-gray-500 italic">
                      {dict.invoices.pdfPending}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-brand-gray-900">
              {dict.logout.title}
            </h3>
            <p className="text-sm text-brand-gray-500">{dict.logout.desc}</p>
          </div>
          <form action={logoutAction}>
            <input type="hidden" name="lang" value={lang} />
            <button
              type="submit"
              className="px-5 py-2.5 border border-[#E0E0E0] rounded-xl text-sm font-semibold text-brand-gray-900 hover:bg-brand-gray-50 transition-colors"
            >
              {dict.logout.cta}
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

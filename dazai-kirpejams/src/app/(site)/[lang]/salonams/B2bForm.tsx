'use client'

import { useActionState } from 'react'
import { submitB2bInquiryAction, type B2bFormState } from './actions'
import type { Locale } from '@/i18n/config'

type B2bLabels = {
  formSalonName: string
  formSalonPlaceholder: string
  formContactPerson: string
  formContactPlaceholder: string
  formEmail: string
  formEmailPlaceholder: string
  formPhone: string
  formPhonePlaceholder: string
  formAddress: string
  formAddressPlaceholder: string
  formVolume: string
  formVolumePlaceholder: string
  formVolumeOpt1: string
  formVolumeOpt2: string
  formVolumeOpt3: string
  formVolumeOpt4: string
  formMessage: string
  formMessagePlaceholder: string
  formSubmit: string
  formSubmitting: string
  formSuccessTitle: string
  formSuccessDesc: string
}

const initialState: B2bFormState = {}

export function B2bForm({ lang, labels }: { lang: Locale; labels: B2bLabels }) {
  const [state, formAction, isPending] = useActionState(
    submitB2bInquiryAction,
    initialState
  )

  if (state.success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-bold text-brand-gray-900">
          {labels.formSuccessTitle}
        </h3>
        <p className="text-sm text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
          {labels.formSuccessDesc}
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={lang} />

      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <B2BField
        label={labels.formSalonName}
        name="salon_name"
        required
        placeholder={labels.formSalonPlaceholder}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <B2BField
          label={labels.formContactPerson}
          name="contact_name"
          required
          placeholder={labels.formContactPlaceholder}
        />
        <B2BField
          label={labels.formEmail}
          name="email"
          type="email"
          required
          placeholder={labels.formEmailPlaceholder}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <B2BField
          label={labels.formPhone}
          name="phone"
          type="tel"
          placeholder={labels.formPhonePlaceholder}
        />
        <B2BField
          label={labels.formAddress}
          name="address"
          placeholder={labels.formAddressPlaceholder}
        />
      </div>

      <div>
        <label
          htmlFor="b2b-volume"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          {labels.formVolume}
        </label>
        <select
          id="b2b-volume"
          name="monthly_volume"
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] cursor-pointer focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        >
          <option value="">{labels.formVolumePlaceholder}</option>
          <option value="iki-10">{labels.formVolumeOpt1}</option>
          <option value="10-50">{labels.formVolumeOpt2}</option>
          <option value="50-100">{labels.formVolumeOpt3}</option>
          <option value="100+">{labels.formVolumeOpt4}</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="b2b-message"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          {labels.formMessage}
        </label>
        <textarea
          id="b2b-message"
          name="message"
          rows={4}
          placeholder={labels.formMessagePlaceholder}
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] resize-y min-h-[110px] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-8 py-4 bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? labels.formSubmitting : labels.formSubmit}
      </button>
    </form>
  )
}

function B2BField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  const autoComplete =
    name === 'salon_name'
      ? 'organization'
      : name === 'contact_name'
        ? 'name'
        : name === 'address'
          ? 'street-address'
          : type === 'email'
            ? 'email'
            : type === 'tel'
              ? 'tel'
              : undefined
  const inputMode =
    type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined

  return (
    <div>
      <label
        htmlFor={`b2b-${name}`}
        className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
      >
        {label}
        {required && <span className="text-brand-magenta ml-1">*</span>}
      </label>
      <input
        id={`b2b-${name}`}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] placeholder:text-[#B0B0B0] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
      />
    </div>
  )
}

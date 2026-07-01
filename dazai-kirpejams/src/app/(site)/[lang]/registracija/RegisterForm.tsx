'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { registerAction, type RegisterState } from './actions'
import { trackCompleteRegistration } from '@/lib/analytics'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

const initialState: RegisterState = {}

type RegisterFormDict = {
  success: { title: string; desc: string; loginCta: string }
  auth: {
    legend: string
    email: string
    emailPlaceholder: string
    password: string
    passwordPlaceholder: string
  }
  personal: {
    legend: string
    firstName: string
    firstNamePlaceholder: string
    lastName: string
    lastNamePlaceholder: string
    phone: string
    phonePlaceholder: string
    city: string
    cityPlaceholder: string
  }
  business: {
    legend: string
    typeLabel: string
    options: {
      hairdresser: string
      colorist: string
      salon_owner: string
      student: string
      other: string
    }
    salonName: string
    salonNamePlaceholder: string
    companyCode: string
    companyCodePlaceholder: string
    dailyDyes: string
    dailyDyesPlaceholder: string
    dailyDyesOpt1: string
    dailyDyesOpt2: string
    dailyDyesOpt3: string
    dailyDyesOpt4: string
    notes: string
    notesPlaceholder: string
    noticeStrong: string
    noticeText: string
    confirmLabel: string
    confirmHint: string
  }
  submit: string
  submitting: string
  haveAccount: string
  loginCta: string
  oauthGoogle: string
  oauthFacebook: string
  oauthOr: string
  oauthHint: string
}

export function RegisterForm({
  lang,
  dict,
}: {
  lang: Locale
  dict: RegisterFormDict
}) {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  )
  const [businessType, setBusinessType] = useState('hairdresser')

  useEffect(() => {
    if (state.success) {
      // trackCompleteRegistration tipas siaurai apibrėžia tik 3 reikšmes —
      // žemėlapis sumažina iki to set'o, kad analytics neraportuotų neaiškių.
      const mapped: 'hairdresser' | 'salon' | 'other' =
        businessType === 'salon_owner'
          ? 'salon'
          : businessType === 'hairdresser' || businessType === 'colorist'
            ? 'hairdresser'
            : 'other'
      trackCompleteRegistration({
        businessType: mapped,
        locale: lang,
      })
    }
  }, [state.success, businessType, lang])

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-bold text-brand-gray-900">
          {dict.success.title}
        </h3>
        <p className="text-sm text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
          {dict.success.desc}
        </p>
        <Link
          href={`${langPrefix(lang)}/prisijungimas`}
          className="inline-flex px-6 py-3 bg-brand-magenta text-white rounded-xl font-semibold hover:bg-brand-magenta/90 transition-colors"
        >
          {dict.success.loginCta}
        </Link>
      </div>
    )
  }

  // React 19 po kiekvieno action'o resetina uncontrolled laukus į defaultValue
  // — net kai grąžinta klaida. Todėl klaidos atveju action'as grąžina įvestas
  // reikšmes (be slaptažodžio), o čia jos tampa defaultValue — laukai
  // nebeišsivalo. Sėkmės atveju forma keičiama į padėkos bloką (žr. aukščiau).
  const v = state.values ?? {}

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="lang" value={lang} />

      <OAuthButtons
        lang={lang}
        dict={{
          google: dict.oauthGoogle,
          facebook: dict.oauthFacebook,
          or: dict.oauthOr,
        }}
      />
      <p className="text-[0.78rem] text-brand-gray-500 leading-[1.6] -mt-2">
        {dict.oauthHint}
      </p>

      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-2">
          {dict.auth.legend}
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label={dict.auth.email}
            name="email"
            type="email"
            required
            placeholder={dict.auth.emailPlaceholder}
            defaultValue={v.email}
          />
          <Field
            label={dict.auth.password}
            name="password"
            type="password"
            required
            placeholder={dict.auth.passwordPlaceholder}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-2">
          {dict.personal.legend}
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label={dict.personal.firstName}
            name="first_name"
            required
            autoComplete="given-name"
            placeholder={dict.personal.firstNamePlaceholder}
            defaultValue={v.first_name}
          />
          <Field
            label={dict.personal.lastName}
            name="last_name"
            required
            autoComplete="family-name"
            placeholder={dict.personal.lastNamePlaceholder}
            defaultValue={v.last_name}
          />
          <Field
            label={dict.personal.phone}
            name="phone"
            type="tel"
            required
            placeholder={dict.personal.phonePlaceholder}
            defaultValue={v.phone}
          />
          <Field
            label={dict.personal.city}
            name="city"
            required
            autoComplete="address-level2"
            placeholder={dict.personal.cityPlaceholder}
            defaultValue={v.city}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-2">
          {dict.business.legend}
        </legend>

        <div>
          <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
            {dict.business.typeLabel} <span className="text-brand-magenta">*</span>
          </span>
          {/* Aiškus pasirinkimas-pažymėjimas: KIRPĖJAS / SALONO SAVININKAS / KITA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                { value: 'hairdresser', label: dict.business.options.hairdresser },
                { value: 'salon_owner', label: dict.business.options.salon_owner },
                { value: 'other', label: dict.business.options.other },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-center gap-2 px-3 py-3 border-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors text-center ${
                  businessType === opt.value
                    ? 'border-brand-magenta bg-brand-magenta/5 text-brand-magenta'
                    : 'border-brand-gray-50 text-brand-gray-900 hover:border-brand-magenta/40'
                }`}
              >
                <input
                  type="radio"
                  name="business_type"
                  value={opt.value}
                  required
                  checked={businessType === opt.value}
                  onChange={() => setBusinessType(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label={dict.business.salonName}
            name="salon_name"
            required
            autoComplete="organization"
            placeholder={dict.business.salonNamePlaceholder}
            defaultValue={v.salon_name}
          />
          <Field
            label={dict.business.companyCode}
            name="company_code"
            placeholder={dict.business.companyCodePlaceholder}
            defaultValue={v.company_code}
          />
        </div>

        <div>
          <label
            htmlFor="daily_dyes_count"
            className="block text-xs font-medium text-brand-gray-500 mb-1.5"
          >
            {dict.business.dailyDyes}
          </label>
          <select
            id="daily_dyes_count"
            name="daily_dyes_count"
            defaultValue={v.daily_dyes_count ?? ''}
            className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
          >
            <option value="">{dict.business.dailyDyesPlaceholder}</option>
            <option value="1-3">{dict.business.dailyDyesOpt1}</option>
            <option value="4-7">{dict.business.dailyDyesOpt2}</option>
            <option value="8-15">{dict.business.dailyDyesOpt3}</option>
            <option value="16+">{dict.business.dailyDyesOpt4}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="verification_notes"
            className="block text-xs font-medium text-brand-gray-500 mb-1.5"
          >
            {dict.business.notes}
          </label>
          <textarea
            id="verification_notes"
            name="verification_notes"
            rows={2}
            defaultValue={v.verification_notes}
            placeholder={dict.business.notesPlaceholder}
            className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors resize-none"
          />
        </div>

        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 leading-relaxed">
          <strong>{dict.business.noticeStrong}</strong> {dict.business.noticeText}
        </div>

        <label className="flex items-start gap-3 px-4 py-3 border border-brand-gray-50 rounded-xl cursor-pointer hover:border-brand-magenta/40 transition-colors">
          <input
            type="checkbox"
            name="confirm_professional"
            required
            defaultChecked={v.confirm_professional === 'on'}
            className="mt-0.5 w-4 h-4 accent-brand-magenta shrink-0"
          />
          <span className="text-sm text-brand-gray-900 leading-snug">
            {dict.business.confirmLabel}{' '}
            <span className="text-brand-magenta">*</span>
            <span className="block mt-1 text-[12px] text-brand-gray-500">
              {dict.business.confirmHint}
            </span>
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? dict.submitting : dict.submit}
      </button>

      <p className="text-center text-xs text-brand-gray-500">
        {dict.haveAccount}{' '}
        <Link
          href={`${langPrefix(lang)}/prisijungimas`}
          className="text-brand-magenta font-semibold hover:underline"
        >
          {dict.loginCta}
        </Link>
      </p>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
  autoComplete,
  inputMode,
  defaultValue,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal' | 'search' | 'url'
  defaultValue?: string
}) {
  const defaultAutoComplete =
    autoComplete ??
    (type === 'email'
      ? 'email'
      : type === 'tel'
        ? 'tel'
        : type === 'password'
          ? name === 'password'
            ? 'new-password'
            : 'current-password'
          : undefined)
  const defaultInputMode =
    inputMode ?? (type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined)

  return (
    <label className="block">
      <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
        {label} {required && <span className="text-brand-magenta">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete={defaultAutoComplete}
        inputMode={defaultInputMode}
        defaultValue={defaultValue}
        className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
      />
    </label>
  )
}

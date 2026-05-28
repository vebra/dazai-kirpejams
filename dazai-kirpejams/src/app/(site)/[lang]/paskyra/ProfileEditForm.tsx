'use client'

import { useActionState } from 'react'
import type { Locale } from '@/i18n/config'
import { updateProfileAction, type UpdateProfileState } from './actions'

type Dict = {
  title: string
  desc: string
  firstName: string
  lastName: string
  phone: string
  phonePlaceholder: string
  city: string
  cityPlaceholder: string
  salon: string
  salonPlaceholder: string
  companyCode: string
  companyCodePlaceholder: string
  dailyDyesCount: string
  dailyDyesPlaceholder: string
  emailLang: string
  emailLangHint: string
  langLt: string
  langEn: string
  langRu: string
  emailReadOnly: string
  emailReadOnlyHint: string
  save: string
  saving: string
  successMessage: string
}

const initialState: UpdateProfileState = {}

export function ProfileEditForm({
  lang,
  email,
  defaults,
  dict,
}: {
  lang: Locale
  email: string
  defaults: {
    firstName: string
    lastName: string
    phone: string
    city: string
    salonName: string
    companyCode: string
    dailyDyesCount: string
    preferredLang: Locale
  }
  dict: Dict
}) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialState
  )

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <h3 className="text-lg font-bold text-brand-gray-900 mb-2">
        {dict.title}
      </h3>
      <p className="text-sm text-brand-gray-500 mb-5 leading-relaxed">
        {dict.desc}
      </p>

      {state.success && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          {dict.successMessage}
        </div>
      )}

      {state.error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {/* `_form_lang` — error message lokalizacijai (puslapio kalba).
            `lang` paduodamas per <select> žemiau ir įrašomas į
            user_profiles.lang (email pranešimų kalba). */}
        <input type="hidden" name="_form_lang" value={lang} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            name="first_name"
            label={dict.firstName}
            defaultValue={defaults.firstName}
            required
            autoComplete="given-name"
          />
          <Field
            name="last_name"
            label={dict.lastName}
            defaultValue={defaults.lastName}
            required
            autoComplete="family-name"
          />
          <Field
            name="phone"
            label={dict.phone}
            defaultValue={defaults.phone}
            placeholder={dict.phonePlaceholder}
            autoComplete="tel"
            inputMode="tel"
          />
          <Field
            name="city"
            label={dict.city}
            defaultValue={defaults.city}
            placeholder={dict.cityPlaceholder}
            autoComplete="address-level2"
          />
          <Field
            name="salon_name"
            label={dict.salon}
            defaultValue={defaults.salonName}
            placeholder={dict.salonPlaceholder}
            autoComplete="organization"
          />
          <Field
            name="company_code"
            label={dict.companyCode}
            defaultValue={defaults.companyCode}
            placeholder={dict.companyCodePlaceholder}
          />
        </div>

        <Field
          name="daily_dyes_count"
          label={dict.dailyDyesCount}
          defaultValue={defaults.dailyDyesCount}
          placeholder={dict.dailyDyesPlaceholder}
        />

        <label className="block">
          <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
            {dict.emailLang}
          </span>
          <select
            name="lang"
            defaultValue={defaults.preferredLang}
            className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
          >
            <option value="lt">{dict.langLt}</option>
            <option value="en">{dict.langEn}</option>
            <option value="ru">{dict.langRu}</option>
          </select>
          <span className="block text-[11px] text-brand-gray-500 mt-1.5">
            {dict.emailLangHint}
          </span>
        </label>

        <div className="pt-2 border-t border-[#eee]">
          <div className="text-xs font-medium text-brand-gray-500 mb-1.5">
            {dict.emailReadOnly}
          </div>
          <div className="px-4 py-3 bg-brand-gray-50 border border-[#eee] rounded-xl text-sm text-brand-gray-500">
            {email}
          </div>
          <div className="text-[11px] text-brand-gray-500 mt-1.5">
            {dict.emailReadOnlyHint}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? dict.saving : dict.save}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  required,
  autoComplete,
  inputMode,
}: {
  name: string
  label: string
  defaultValue: string
  placeholder?: string
  required?: boolean
  autoComplete?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
        {label}
        {required && <span className="text-brand-magenta"> *</span>}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
      />
    </label>
  )
}

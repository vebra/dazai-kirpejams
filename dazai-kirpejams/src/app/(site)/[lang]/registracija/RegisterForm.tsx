'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registerAction, type RegisterState } from './actions'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

const initialState: RegisterState = {}

export function RegisterForm({
  lang,
}: {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}) {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  )
  const [businessType, setBusinessType] = useState('hairdresser')

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-bold text-brand-gray-900">
          Registracija sėkminga!
        </h3>
        <p className="text-sm text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
          Jūsų paskyra sukurta. Patvirtinkite el. paštą (patikrinkite inbox'ą ir
          spam'ą), tada laukite, kol mūsų komanda peržiūrės Jūsų dokumentą ir
          patvirtins paskyrą. Tai užtrunka iki 1 darbo dienos.
        </p>
        <Link
          href={`${langPrefix(lang)}/prisijungimas`}
          className="inline-flex px-6 py-3 bg-brand-magenta text-white rounded-xl font-semibold hover:bg-brand-magenta/90 transition-colors"
        >
          Prisijungti
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {/* Prisijungimo duomenys */}
      <fieldset className="space-y-4">
        <legend className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-2">
          Prisijungimo duomenys
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="El. paštas"
            name="email"
            type="email"
            required
            placeholder="jusu@paštas.lt"
          />
          <Field
            label="Slaptažodis"
            name="password"
            type="password"
            required
            placeholder="Min. 6 simboliai"
          />
        </div>
      </fieldset>

      {/* Asmeninė informacija */}
      <fieldset className="space-y-4">
        <legend className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-2">
          Asmeninė informacija
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Vardas"
            name="first_name"
            required
            placeholder="Jonas"
          />
          <Field
            label="Pavardė"
            name="last_name"
            required
            placeholder="Jonaitis"
          />
          <Field
            label="Telefonas"
            name="phone"
            type="tel"
            placeholder="+370 600 00000"
          />
        </div>
      </fieldset>

      {/* Veiklos informacija */}
      <fieldset className="space-y-4">
        <legend className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-2">
          Profesinė veikla
        </legend>

        <div>
          <label
            htmlFor="business_type"
            className="block text-xs font-medium text-brand-gray-500 mb-1.5"
          >
            Veiklos tipas <span className="text-brand-magenta">*</span>
          </label>
          <select
            id="business_type"
            name="business_type"
            required
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
          >
            <option value="hairdresser">
              Kirpėjas / koloristas (sertifikatas)
            </option>
            <option value="salon">Grožio salonas (verslo liudijimas)</option>
            <option value="other">Kita profesinė veikla</option>
          </select>
        </div>

        {(businessType === 'salon' || businessType === 'other') && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Salono / įmonės pavadinimas"
              name="salon_name"
              placeholder={'Grožio salonas „Stilius"'}
            />
            <Field
              label="Įmonės kodas"
              name="company_code"
              placeholder="305123456"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="verification_notes"
            className="block text-xs font-medium text-brand-gray-500 mb-1.5"
          >
            Papildoma informacija
          </label>
          <textarea
            id="verification_notes"
            name="verification_notes"
            rows={2}
            placeholder={'Pvz. dirbu salone „Stilius", Kaune, 5+ metų patirtis...'}
            className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors resize-none"
          />
        </div>

        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 leading-relaxed">
          <strong>Svarbu:</strong> Po registracijos Jums reikės įkelti
          profesinės kvalifikacijos dokumentą (kirpėjo sertifikatą arba verslo
          liudijimą). Tai galėsite padaryti prisijungę prie paskyros. Be
          dokumento kainos nebus matomos.
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Registruojama…' : 'Registruotis'}
      </button>

      <p className="text-center text-xs text-brand-gray-500">
        Jau turite paskyrą?{' '}
        <Link
          href={`${langPrefix(lang)}/prisijungimas`}
          className="text-brand-magenta font-semibold hover:underline"
        >
          Prisijungti
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
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
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
        className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
      />
    </label>
  )
}

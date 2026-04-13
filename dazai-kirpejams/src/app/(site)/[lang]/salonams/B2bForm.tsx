'use client'

import { useActionState } from 'react'
import { submitB2bInquiryAction, type B2bFormState } from './actions'
import type { Locale } from '@/i18n/config'

const initialState: B2bFormState = {}

export function B2bForm({ lang }: { lang: Locale }) {
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
          Užklausa išsiųsta!
        </h3>
        <p className="text-sm text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
          Dėkojame už susidomėjimą. Mūsų vadybininkas susisieks su Jumis per 1
          darbo dieną.
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
        label="Salono pavadinimas"
        name="salon_name"
        required
        placeholder={'Pvz., Grožio studija „Aura"'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <B2BField
          label="Kontaktinis asmuo"
          name="contact_name"
          required
          placeholder="Vardas Pavardė"
        />
        <B2BField
          label="El. paštas"
          name="email"
          type="email"
          required
          placeholder="info@jusu-salonas.lt"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <B2BField
          label="Telefono numeris"
          name="phone"
          type="tel"
          placeholder="+370 ..."
        />
        <B2BField
          label="Salono adresas"
          name="address"
          placeholder="Miestas, gatvė"
        />
      </div>

      <div>
        <label
          htmlFor="b2b-volume"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          Mėnesinis poreikis
        </label>
        <select
          id="b2b-volume"
          name="monthly_volume"
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] cursor-pointer focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        >
          <option value="">Pasirinkite apytikslę apimtį...</option>
          <option value="iki-10">Iki 10 vnt. per mėnesį</option>
          <option value="10-50">10–50 vnt. per mėnesį</option>
          <option value="50-100">50–100 vnt. per mėnesį</option>
          <option value="100+">100+ vnt. per mėnesį</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="b2b-message"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          Papildoma žinutė
        </label>
        <textarea
          id="b2b-message"
          name="message"
          rows={4}
          placeholder="Kokie produktai domėtų? Ar turite specialių pageidavimų?"
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] resize-y min-h-[110px] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-8 py-4 bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Siunčiama…' : 'Gauti pasiūlymą →'}
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
        className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] placeholder:text-[#B0B0B0] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
      />
    </div>
  )
}

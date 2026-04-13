'use client'

import { useActionState } from 'react'
import { submitContactAction, type ContactFormState } from './actions'
import type { Locale } from '@/i18n/config'

const initialState: ContactFormState = {}

export function ContactForm({ lang }: { lang: Locale }) {
  const [state, formAction, isPending] = useActionState(
    submitContactAction,
    initialState
  )

  if (state.success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-bold text-brand-gray-900">
          Žinutė išsiųsta!
        </h3>
        <p className="text-sm text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
          Dėkojame, kad susisiekėte. Atsakysime per 1 darbo dieną.
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

      <FormField label="Vardas" name="name" required placeholder="Jūsų vardas" />
      <FormField
        label="El. paštas"
        name="email"
        type="email"
        required
        placeholder="jusu@pastas.lt"
      />
      <FormField
        label="Telefono numeris"
        name="phone"
        type="tel"
        placeholder="+370 ..."
      />
      <div>
        <label
          htmlFor="contact-subject"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          Užklausos tipas
        </label>
        <select
          id="contact-subject"
          name="subject"
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] cursor-pointer focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        >
          <option value="Bendras klausimas">Bendras klausimas</option>
          <option value="Užsakymo klausimas">Užsakymo klausimas</option>
          <option value="B2B bendradarbiavimas">B2B bendradarbiavimas</option>
          <option value="Kita">Kita</option>
        </select>
      </div>
      <div>
        <label
          htmlFor="contact-message"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          Žinutė <span className="text-brand-magenta">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          placeholder="Jūsų žinutė..."
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] resize-y min-h-[120px] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-8 py-4 bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Siunčiama…' : 'Siųsti žinutę →'}
      </button>
    </form>
  )
}

function FormField({
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
        htmlFor={`contact-${name}`}
        className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
      >
        {label}
        {required && <span className="text-brand-magenta ml-1">*</span>}
      </label>
      <input
        id={`contact-${name}`}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] placeholder:text-[#B0B0B0] focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
      />
    </div>
  )
}

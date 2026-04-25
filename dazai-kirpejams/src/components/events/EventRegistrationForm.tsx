'use client'

import { useActionState, useEffect } from 'react'
import {
  registerForEventAction,
  type EventRegistrationState,
} from '@/app/(site)/[lang]/renginys/actions'
import { trackLead } from '@/lib/analytics'

const initialState: EventRegistrationState = {}

export function EventRegistrationForm() {
  const [state, formAction, isPending] = useActionState(
    registerForEventAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      trackLead({
        leadType: 'event',
        locale: 'lt',
        userType: 'guest',
        eventId: state.eventId,
      })
    }
  }, [state.success, state.eventId])

  if (state.success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <span className="text-3xl" aria-hidden="true">
            ✓
          </span>
        </div>
        <h3 className="text-lg font-bold text-brand-gray-900">
          Registracija patvirtinta
        </h3>
        <p className="text-sm text-brand-gray-500 max-w-sm mx-auto leading-relaxed">
          Išsiuntėme patvirtinimą su kalendoriaus failu į Jūsų el. paštą.
          Patikrinkite inbox (ir spam, jei nerandate).
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
      >
        <label>
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </label>
      </div>

      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="Vardas"
          name="first_name"
          required
          autoComplete="given-name"
        />
        <Field
          label="Pavardė"
          name="last_name"
          required
          autoComplete="family-name"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field
          label="El. paštas"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="vardas@pastas.lt"
        />
        <Field
          label="Telefonas"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="+370 600 00000"
        />
      </div>

      <Field
        label="Salono pavadinimas"
        name="salon_name"
        autoComplete="organization"
        placeholder="Nebūtinas"
      />

      <div>
        <label
          htmlFor="event-role"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          Pareigos
        </label>
        <select
          id="event-role"
          name="role"
          defaultValue=""
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] cursor-pointer focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        >
          <option value="">Pasirinkite (nebūtina)</option>
          <option value="kirpejas">Kirpėjas(-a)</option>
          <option value="koloristas">Koloristas(-ė)</option>
          <option value="savininkas">Salono savininkas(-ė)</option>
          <option value="kita">Kita</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="event-guests"
          className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
        >
          Atvyksiu su kolega (kiek papildomai?)
        </label>
        <select
          id="event-guests"
          name="guests_count"
          defaultValue="0"
          className="w-full px-4 py-[14px] border border-[#E0E0E0] rounded-lg bg-white text-brand-gray-900 text-[0.95rem] cursor-pointer focus:outline-none focus:border-brand-magenta focus:shadow-[0_0_0_3px_rgba(233,30,140,0.1)] transition-all"
        >
          <option value="0">Tik aš</option>
          <option value="1">+1 kolega</option>
          <option value="2">+2 kolegos</option>
          <option value="3">+3 kolegos</option>
          <option value="4">+4 kolegos</option>
        </select>
        <p className="mt-1.5 text-xs text-brand-gray-500">
          Jei kolega nori savo kalendoriaus priminimo — tegul užsiregistruoja
          atskirai.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-8 py-4 bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Registruojama…' : 'Registruotis nemokamai'}
      </button>

      <p className="text-xs text-brand-gray-500 text-center leading-relaxed">
        Spausdami „Registruotis" sutinkate, kad Jūsų duomenys bus naudojami
        renginio organizavimui. Daugiau informacijos{' '}
        <a
          href="/lt/privatumo-politika"
          className="underline hover:text-brand-magenta"
        >
          Privatumo politikoje
        </a>
        .
      </p>
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  autoComplete,
  placeholder,
}: FieldProps) {
  const inputMode =
    type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined

  return (
    <div>
      <label
        htmlFor={`event-${name}`}
        className="block text-[0.9rem] font-semibold text-brand-gray-900 mb-2"
      >
        {label}
        {required && <span className="text-brand-magenta ml-1">*</span>}
      </label>
      <input
        id={`event-${name}`}
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

'use client'

import { useActionState } from 'react'
import {
  updateCompanyInfoAction,
  type UpdateCompanyInfoState,
} from './actions'
import type { CompanyInfo } from '@/lib/admin/queries'

const initialState: UpdateCompanyInfoState = {}

export function CompanyInfoForm({ info }: { info: CompanyInfo }) {
  const [state, formAction, isPending] = useActionState(
    updateCompanyInfoAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Nustatymai išsaugoti
        </div>
      )}

      {/* Įmonės rekvizitai */}
      <div>
        <h4 className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-3">
          Juridinė informacija
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Juridinis pavadinimas"
            name="legal_name"
            defaultValue={info.legalName}
            placeholder="MB Dažai Kirpėjams"
            className="md:col-span-2"
          />
          <Field
            label="Įmonės kodas"
            name="reg_code"
            defaultValue={info.regCode}
            placeholder="305123456"
          />
          <Field
            label="PVM mokėtojo kodas"
            name="vat_code"
            defaultValue={info.vatCode}
            placeholder="LT100012345678"
          />
          <Field
            label="Adresas"
            name="address"
            defaultValue={info.address}
            placeholder="Gedimino pr. 1, LT-01103 Vilnius"
            className="md:col-span-2"
          />
        </div>
      </div>

      {/* Kontaktai */}
      <div>
        <h4 className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-3">
          Kontaktai
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="El. paštas"
            name="email"
            type="email"
            defaultValue={info.email}
            placeholder="info@dazaikirpejams.lt"
          />
          <Field
            label="Telefonas"
            name="phone"
            type="tel"
            defaultValue={info.phone}
            placeholder="+370 600 00000"
          />
        </div>
      </div>

      {/* Banko duomenys */}
      <div>
        <h4 className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-3">
          Banko duomenys (pavedimams)
        </h4>
        <p className="text-[12px] text-brand-gray-500 mb-3">
          Šie duomenys rodomi pavedimo instrukcijose klientams, pasirinkusiems
          „Banko pavedimas" kaip apmokėjimo būdą.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Gavėjas"
            name="bank_recipient"
            defaultValue={info.bankRecipient}
            placeholder="MB Dažai Kirpėjams"
            className="md:col-span-2"
          />
          <Field
            label="IBAN"
            name="bank_iban"
            defaultValue={info.bankIban}
            placeholder="LT00 0000 0000 0000 0000"
            mono
          />
          <Field
            label="Bankas"
            name="bank_name"
            defaultValue={info.bankName}
            placeholder="Swedbank"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saugoma…' : 'Išsaugoti nustatymus'}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = 'text',
  className = '',
  mono,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  type?: string
  className?: string
  mono?: boolean
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
      >
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white ${
          mono ? 'font-mono' : ''
        }`}
      />
    </div>
  )
}

'use client'

import { useActionState, useState } from 'react'
import {
  updateInvoiceTemplateAction,
  type UpdateInvoiceTemplateState,
} from './actions'
import type { InvoiceTemplateSettings } from '@/lib/admin/queries'

const initialState: UpdateInvoiceTemplateState = {}

export function InvoiceTemplateForm({
  settings,
}: {
  settings: InvoiceTemplateSettings
}) {
  const [state, formAction, isPending] = useActionState(
    updateInvoiceTemplateAction,
    initialState
  )

  // Live preview spalvos — kad admin'as matytų akcento pokytį dar
  // neišsaugojęs. Pradinė reikšmė — esama iš DB.
  const [accentColor, setAccentColor] = useState(settings.accentColor)

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Sąskaitos šablonas atnaujintas
        </div>
      )}

      {/* Prekės ženklas */}
      <div>
        <h4 className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-3">
          Prekės ženklas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Prekės ženklo pavadinimas"
            name="brand_name"
            defaultValue={settings.brandName}
            placeholder="Dažai Kirpėjams"
          />
          <Field
            label="Šūkis"
            name="tagline"
            defaultValue={settings.tagline}
            placeholder="Profesionalūs plaukų dažai kirpėjams"
          />
          <div className="md:col-span-2">
            <label
              htmlFor="accent_color"
              className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
            >
              Akcentinė spalva (HEX)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="accent_color_picker"
                value={accentColor || '#E91E8C'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-14 rounded border border-[#ddd] cursor-pointer"
                aria-label="Spalvos pasirinkimas"
              />
              <input
                type="text"
                id="accent_color"
                name="accent_color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#E91E8C"
                className="flex-1 px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm font-mono focus:outline-none focus:border-brand-magenta focus:bg-white"
              />
              <div
                className="h-10 w-20 rounded border border-[#ddd]"
                style={{ backgroundColor: accentColor || '#E91E8C' }}
                aria-hidden
              />
            </div>
            <p className="mt-1 text-[11px] text-brand-gray-500">
              Naudojama sąskaitos antraštei, „Mokėti" sumos spalvai ir
              mokėjimo bloko kraštui.
            </p>
          </div>
        </div>
      </div>

      {/* Tekstai */}
      <div>
        <h4 className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-3">
          Tekstai
        </h4>
        <div className="space-y-4">
          <TextareaField
            label="Poraštės tekstas"
            name="footer_text"
            defaultValue={settings.footerText}
            placeholder="Paliekant tuščią — generuojama automatiškai iš įmonės rekvizitų."
            rows={2}
            hint="Rodoma PDF'o apačioje. Jei tuščia — surenkama iš įmonės pavadinimo, kodo, el. pašto ir telefono."
          />
          <TextareaField
            label="Standartinės pastabos"
            name="default_notes"
            defaultValue={settings.defaultNotes}
            placeholder="Pvz. „Prekės grąžinamos per 14 dienų."
            rows={3}
            hint="Įrašomos į visas naujas sąskaitas, jei užsakymas neturi savų pastabų. Individualios pastabos konkrečiai sąskaitai gali būti nurodytos išrašymo formoje."
          />
        </div>
      </div>

      {/* Mokėjimo terminas */}
      <div>
        <h4 className="text-[13px] font-bold text-brand-gray-900 uppercase tracking-[0.5px] mb-3">
          Mokėjimo sąlygos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="payment_terms_days"
              className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
            >
              Apmokėjimo terminas (dienomis)
            </label>
            <input
              type="number"
              id="payment_terms_days"
              name="payment_terms_days"
              defaultValue={settings.paymentTermsDays}
              min={0}
              max={365}
              step={1}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
            <p className="mt-1 text-[11px] text-brand-gray-500">
              0 — mokėtina iš karto. Paprastai B2B — 14 arba 30 d.
              Reikšmė pridedama prie išrašymo datos ir rodoma kaip „Apmokėti iki".
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saugoma…' : 'Išsaugoti šabloną'}
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
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  type?: string
  className?: string
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
        className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
      />
    </div>
  )
}

function TextareaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  hint?: string
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white resize-y"
      />
      {hint && (
        <p className="mt-1 text-[11px] text-brand-gray-500">{hint}</p>
      )}
    </div>
  )
}

'use client'

import { useActionState } from 'react'
import {
  updateShopSettingsAction,
  type UpdateSettingsState,
} from './actions'
import type { ShopSettings } from '@/lib/admin/queries'

const initialState: UpdateSettingsState = {}

function centsToEur(cents: number): string {
  return (cents / 100).toFixed(2)
}

export function ShopSettingsForm({ settings }: { settings: ShopSettings }) {
  const [state, formAction, isPending] = useActionState(
    updateShopSettingsAction,
    initialState
  )

  return (
    <form action={formAction} className="space-y-5">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="free_shipping_threshold_eur"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Nemokamo pristatymo riba (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="free_shipping_threshold_eur"
            name="free_shipping_threshold_eur"
            defaultValue={centsToEur(settings.freeShippingThresholdCents)}
            required
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            Nuo kokios sumos pristatymas nemokamas
          </p>
        </div>

        <div>
          <label
            htmlFor="min_order_eur"
            className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
          >
            Minimali užsakymo suma (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="min_order_eur"
            name="min_order_eur"
            defaultValue={centsToEur(settings.minOrderCents)}
            required
            className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
          />
          <p className="mt-1 text-[11px] text-brand-gray-500">
            0 = apribojimo nėra
          </p>
        </div>
      </div>

      <div className="pt-5 border-t border-[#eee]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-3">
          Pristatymo kainos
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label
              htmlFor="delivery_cost_courier_eur"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Kurjeris (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="delivery_cost_courier_eur"
              name="delivery_cost_courier_eur"
              defaultValue={centsToEur(settings.deliveryCostCourierCents)}
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="delivery_cost_parcel_locker_eur"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Paštomatas (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="delivery_cost_parcel_locker_eur"
              name="delivery_cost_parcel_locker_eur"
              defaultValue={centsToEur(settings.deliveryCostParcelLockerCents)}
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
          <div>
            <label
              htmlFor="delivery_cost_pickup_eur"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Atsiėmimas (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="delivery_cost_pickup_eur"
              name="delivery_cost_pickup_eur"
              defaultValue={centsToEur(settings.deliveryCostPickupCents)}
              required
              className="w-full px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
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

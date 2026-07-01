'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * Krepšelio būsena. Snapshot'inam produkto duomenis (pavadinimą, kainą,
 * paveikslėlį) pridėjimo metu, kad krepšelio kortelės veiktų nepriklausomai
 * nuo DB užklausų — jei produktas bus pašalintas, krepšelyje vis tiek
 * matysis istoriniai duomenys.
 */
export type CartItem = {
  productId: string
  slug: string
  categorySlug: string
  sku: string | null
  name: string
  priceCents: number
  volumeMl: number | null
  imageUrl: string | null
  colorHex: string | null
  colorNumber: string | null
  quantity: number
}

/**
 * Maksimalus vienos prekės kiekis krepšelyje. UI apsauga nuo netyčinio ar
 * tyčinio (localStorage redagavimas) milžiniško kiekio, kuris iškreiptų sumą.
 * Realų likutį galutinai tikrina serveris checkout metu.
 */
const MAX_ITEM_QTY = 99

type CartState = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  /** Atnaujina krepšelio kainas iš serverio (productId → efektyvi kaina centais). */
  refreshPrices: (priceMap: Record<string, number>) => void
  clear: () => void
  // Computed helper'iai (funkcijos, ne selektoriai, kad nereikėtų re-render'inti)
  getTotalItems: () => number
  getSubtotalCents: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + quantity, MAX_ITEM_QTY),
                    }
                  : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, MAX_ITEM_QTY) },
            ],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        const clamped = Math.min(quantity, MAX_ITEM_QTY)
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clamped } : i
          ),
        }))
      },

      refreshPrices: (priceMap) => {
        set((state) => ({
          items: state.items.map((i) =>
            priceMap[i.productId] != null
              ? { ...i, priceCents: priceMap[i.productId] }
              : i
          ),
        }))
      },

      clear: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      getSubtotalCents: () => {
        return get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
      },
    }),
    {
      name: 'dk-cart', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Tik `items` persistuojame — funkcijos pačios pridedamos iš create
      partialize: (state) => ({ items: state.items }),
      // Klampinam kiekius ir įkeliant iš localStorage — apsauga, jei saugoma
      // reikšmė buvo rankiniu būdu pakeista į netikroviškai didelį skaičių.
      merge: (persisted, current) => {
        const p = persisted as { items?: CartItem[] } | undefined
        const items = Array.isArray(p?.items)
          ? p.items.map((i) => ({
              ...i,
              quantity: Math.min(Math.max(1, i.quantity), MAX_ITEM_QTY),
            }))
          : []
        return { ...current, items }
      },
    }
  )
)

/**
 * Saugus hook'as SSR'ui — grąžina 0 kol hydration nesibaigia.
 * Naudojamas Header'yje, kad nebūtų hydration klaidų.
 */
import { useEffect, useState } from 'react'

export function useCartCount(): number {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration pattern'as: mounted vėliavėlė tyčia nustatoma efekte, kad serveris ir pirmas kliento renderis grąžintų 0 (be hydration mismatch)
    setMounted(true)
  }, [])

  if (!mounted) return 0
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

export function useCartSubtotalCents(): number {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SSR hydration pattern'as: mounted vėliavėlė tyčia nustatoma efekte, kad serveris ir pirmas kliento renderis grąžintų 0 (be hydration mismatch)
    setMounted(true)
  }, [])

  if (!mounted) return 0
  return items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0)
}

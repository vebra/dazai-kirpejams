'use client'

import { useEffect } from 'react'
import { trackPurchase } from '@/lib/analytics'
import type { CheckoutItem, LocaleCode } from '@/lib/analytics-types'

type Props = {
  orderNumber: string
  items: CheckoutItem[]
  value: number
  shipping?: number
  tax?: number
  locale: LocaleCode
}

/**
 * Client-side Purchase event'o emitter'is, naudojamas server-rendered
 * užsakymo patvirtinimo puslapyje. `trackPurchase` pats deduplikuoja per
 * sessionStorage pagal `orderNumber` — refresh'ai / back-button / tiesioginis
 * link'as neduplikuos Meta/GA pirkimo įrašo.
 */
export function PurchaseTracker({
  orderNumber,
  items,
  value,
  shipping,
  tax,
  locale,
}: Props) {
  useEffect(() => {
    trackPurchase({
      orderNumber,
      items,
      value,
      currency: 'EUR',
      shipping,
      tax,
      locale,
      userType: 'professional',
    })
  }, [orderNumber, items, value, shipping, tax, locale])

  return null
}

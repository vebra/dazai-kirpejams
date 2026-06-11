import { describe, it, expect } from 'vitest'
import {
  calculateShippingCents,
  calculateOrderTotals,
  meetsMinimumOrder,
  vatRateFromVatCode,
  VAT_RATE,
  FREE_SHIPPING_THRESHOLD_CENTS,
  MIN_ORDER_CENTS,
  SHIPPING_COURIER_CENTS,
  SHIPPING_PARCEL_LOCKER_CENTS,
  SHIPPING_PICKUP_CENTS,
} from './constants'

describe('calculateShippingCents', () => {
  it('charges the courier tariff below the free-shipping threshold', () => {
    expect(calculateShippingCents(4000, 'courier')).toBe(SHIPPING_COURIER_CENTS)
  })

  it('charges the parcel-locker tariff below the threshold', () => {
    expect(calculateShippingCents(4000, 'parcel_locker')).toBe(
      SHIPPING_PARCEL_LOCKER_CENTS
    )
  })

  it('pickup is always free', () => {
    expect(calculateShippingCents(100, 'pickup')).toBe(SHIPPING_PICKUP_CENTS)
    expect(calculateShippingCents(100, 'pickup')).toBe(0)
  })

  it('is free exactly at the threshold (boundary)', () => {
    expect(calculateShippingCents(FREE_SHIPPING_THRESHOLD_CENTS, 'courier')).toBe(
      0
    )
  })

  it('still charges one cent below the threshold', () => {
    expect(
      calculateShippingCents(FREE_SHIPPING_THRESHOLD_CENTS - 1, 'courier')
    ).toBe(SHIPPING_COURIER_CENTS)
  })

  it('is free above the threshold', () => {
    expect(
      calculateShippingCents(FREE_SHIPPING_THRESHOLD_CENTS + 10000, 'courier')
    ).toBe(0)
  })
})

describe('calculateOrderTotals — basic math', () => {
  it('adds shipping and extracts inclusive 21% VAT', () => {
    const t = calculateOrderTotals(4000, 'courier')
    expect(t.subtotalCents).toBe(4000)
    expect(t.discountCents).toBe(0)
    expect(t.shippingCents).toBe(SHIPPING_COURIER_CENTS)
    expect(t.totalCents).toBe(4000 + SHIPPING_COURIER_CENTS)
    // VAT is the inclusive portion: total - total / 1.21, rounded
    expect(t.vatCents).toBe(868)
  })

  it('extracts VAT correctly for a round 100 EUR pickup order', () => {
    const t = calculateOrderTotals(10000, 'pickup')
    expect(t.totalCents).toBe(10000)
    expect(t.vatCents).toBe(1736)
  })
})

describe('calculateOrderTotals — discount clamping', () => {
  it('clamps a discount larger than the subtotal down to the subtotal', () => {
    const t = calculateOrderTotals(4000, 'courier', 5000)
    expect(t.discountCents).toBe(4000)
    // 4000 - 4000 + shipping
    expect(t.totalCents).toBe(SHIPPING_COURIER_CENTS)
  })

  it('clamps a negative discount up to zero', () => {
    const t = calculateOrderTotals(4000, 'courier', -100)
    expect(t.discountCents).toBe(0)
    expect(t.totalCents).toBe(4000 + SHIPPING_COURIER_CENTS)
  })

  it('applies a normal partial discount', () => {
    const t = calculateOrderTotals(4000, 'courier', 1000)
    expect(t.discountCents).toBe(1000)
    expect(t.totalCents).toBe(3000 + SHIPPING_COURIER_CENTS)
  })
})

describe('calculateOrderTotals — free shipping uses pre-discount subtotal', () => {
  it('keeps free shipping even when a coupon drops the payable amount below the threshold', () => {
    // Documented business rule: the free-shipping threshold is evaluated
    // against the gross subtotal, NOT the discounted amount, so a coupon
    // never revokes the customer's earned free shipping.
    const t = calculateOrderTotals(
      FREE_SHIPPING_THRESHOLD_CENTS,
      'courier',
      4000
    )
    expect(t.shippingCents).toBe(0)
    expect(t.discountCents).toBe(4000)
    expect(t.totalCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS - 4000)
  })
})

describe('vatRateFromVatCode', () => {
  it('returns 0 when there is no VAT code (not a VAT payer)', () => {
    expect(vatRateFromVatCode(null)).toBe(0)
    expect(vatRateFromVatCode(undefined)).toBe(0)
    expect(vatRateFromVatCode('')).toBe(0)
    expect(vatRateFromVatCode('   ')).toBe(0)
  })

  it('returns the standard rate once a VAT code is set (VAT payer)', () => {
    expect(vatRateFromVatCode('LT100012345678')).toBe(VAT_RATE)
  })
})

describe('calculateOrderTotals — non-VAT payer (vatRate = 0)', () => {
  it('produces zero VAT so the UI/invoice hides the VAT line', () => {
    const t = calculateOrderTotals(4000, 'courier', 0, 0)
    expect(t.vatCents).toBe(0)
    // Totals are otherwise unchanged — VAT is inclusive, not additive
    expect(t.totalCents).toBe(4000 + SHIPPING_COURIER_CENTS)
    expect(t.subtotalCents).toBe(4000)
    expect(t.shippingCents).toBe(SHIPPING_COURIER_CENTS)
  })

  it('still extracts VAT when an explicit 21% rate is passed (VAT payer)', () => {
    const t = calculateOrderTotals(4000, 'courier', 0, VAT_RATE)
    expect(t.vatCents).toBe(868)
  })

  it('defaults to the standard VAT rate when no rate argument is given', () => {
    const explicit = calculateOrderTotals(4000, 'courier', 0, VAT_RATE)
    const defaulted = calculateOrderTotals(4000, 'courier', 0)
    expect(defaulted.vatCents).toBe(explicit.vatCents)
  })
})

describe('meetsMinimumOrder', () => {
  it('rejects one cent below the minimum', () => {
    expect(meetsMinimumOrder(MIN_ORDER_CENTS - 1)).toBe(false)
  })

  it('accepts exactly the minimum (boundary)', () => {
    expect(meetsMinimumOrder(MIN_ORDER_CENTS)).toBe(true)
  })

  it('accepts above the minimum', () => {
    expect(meetsMinimumOrder(MIN_ORDER_CENTS + 1)).toBe(true)
  })

  it('respects a custom minimum from shop settings', () => {
    expect(meetsMinimumOrder(1000, 0)).toBe(true)
    expect(meetsMinimumOrder(1000, 1500)).toBe(false)
  })
})

describe('shop settings override (shop_settings DB → ShippingSettings)', () => {
  const custom = {
    courierCents: 750,
    parcelLockerCents: 350,
    pickupCents: 0,
    freeShippingThresholdCents: 8000,
    minOrderCents: 2000,
  }

  it('uses custom prices and threshold instead of defaults', () => {
    expect(calculateShippingCents(4000, 'courier', custom)).toBe(750)
    expect(calculateShippingCents(4000, 'parcel_locker', custom)).toBe(350)
    // Default threshold (5000) would make this free — custom (8000) must not
    expect(calculateShippingCents(6000, 'courier', custom)).toBe(750)
    expect(calculateShippingCents(8000, 'courier', custom)).toBe(0)
  })

  it('flows custom settings through calculateOrderTotals', () => {
    const t = calculateOrderTotals(4000, 'parcel_locker', 0, VAT_RATE, custom)
    expect(t.shippingCents).toBe(350)
    expect(t.totalCents).toBe(4350)
  })
})

import { describe, it, expect } from 'vitest'
import { stripProductPricing } from './pricing-gate'
import type { Product } from '@/lib/types'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    slug: 'color-shock-4-23',
    sku: 'CS-4-23',
    category_id: 'c1',
    brand_id: 'b1',
    name_lt: 'Color SHOCK 4.23',
    price_cents: 790,
    compare_price_cents: 990,
    b2b_price_cents: 650,
    stock_quantity: 12,
    is_active: true,
    ...overrides,
  } as Product
}

describe('stripProductPricing', () => {
  it('zeroes price and nulls compare/b2b price for guests', () => {
    const gated = stripProductPricing(makeProduct())
    expect(gated.price_cents).toBe(0)
    expect(gated.compare_price_cents).toBeNull()
    expect(gated.b2b_price_cents).toBeNull()
  })

  it('preserves all non-pricing fields (name, slug, stock, etc.)', () => {
    const gated = stripProductPricing(
      makeProduct({ slug: 'x', stock_quantity: 5, name_lt: 'Test' })
    )
    expect(gated.slug).toBe('x')
    expect(gated.stock_quantity).toBe(5)
    expect(gated.name_lt).toBe('Test')
    expect(gated.id).toBe('p1')
  })

  it('does not mutate the original product (returns a copy)', () => {
    const original = makeProduct()
    stripProductPricing(original)
    expect(original.price_cents).toBe(790)
    expect(original.compare_price_cents).toBe(990)
  })

  it('is idempotent — gating an already-gated product stays zeroed', () => {
    const once = stripProductPricing(makeProduct())
    const twice = stripProductPricing(once)
    expect(twice.price_cents).toBe(0)
    expect(twice.compare_price_cents).toBeNull()
    expect(twice.b2b_price_cents).toBeNull()
  })
})

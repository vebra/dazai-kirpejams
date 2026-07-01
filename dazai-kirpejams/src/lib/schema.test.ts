import { describe, it, expect } from 'vitest'
import { productSchema } from './schema'
import { stripProductPricing } from './data/pricing-gate'
import type { Product, Category } from '@/lib/types'

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
    volume_ml: 180,
    is_active: true,
    ...overrides,
  } as Product
}

const category = { id: 'c1', slug: 'dazai', name_lt: 'Dažai' } as Category
const url = 'https://www.dazaikirpejams.lt/produktai/dazai/color-shock-4-23'

describe('productSchema', () => {
  it('returns null for guests (price stripped to 0) — no incomplete Product for GSC', () => {
    const guestProduct = stripProductPricing(makeProduct())
    expect(productSchema(guestProduct, category, 'lt', url)).toBeNull()
  })

  it('emits a complete Product with offers when a price is present', () => {
    const schema = productSchema(makeProduct(), category, 'lt', url)
    expect(schema).not.toBeNull()
    expect(schema!['@type']).toBe('Product')
    const offers = schema!.offers as Record<string, unknown>
    expect(offers).toBeDefined()
    expect(offers.price).toBe('7.90')
    expect(offers.priceCurrency).toBe('EUR')
  })

  it('returns null when price_cents is 0 regardless of other fields', () => {
    expect(productSchema(makeProduct({ price_cents: 0 }), category, 'lt', url)).toBeNull()
  })
})

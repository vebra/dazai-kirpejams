'use client'

import { useState } from 'react'
import { ProductPriceBlock } from './ProductPriceBlock'
import type { Locale } from '@/i18n/config'

/**
 * Vieno dydžio (varianto) duomenys, jau perskaičiuoti serveryje. Kiekvienas
 * variantas yra atskira prekė su savo `id`, likučiu ir SKU, todėl krepšelis
 * juos laiko atskiromis eilutėmis, o sandėlis mažina to dydžio likutį.
 */
export type VariantVM = {
  id: string
  slug: string
  size: string
  priceCents: number
  comparePriceCents: number | null
  stock: number
  sku: string | null
  imageUrl: string | null
  colorHex: string | null
  colorNumber: string | null
  volumeMl: number | null
}

type Props = {
  lang: Locale
  langPrefixStr: string
  categorySlug: string
  /** Bazinis pavadinimas be dydžio — dydis pridedamas prie krepšelio eilutės. */
  name: string
  variants: VariantVM[]
  sizeLabel: string
  outOfStockLabel: string
  labels: React.ComponentProps<typeof ProductPriceBlock>['labels']
}

export function VariantPurchase({
  lang,
  langPrefixStr,
  categorySlug,
  name,
  variants,
  sizeLabel,
  outOfStockLabel,
  labels,
}: Props) {
  // Numatytai pažymim pirmą dydį, kurio yra sandėlyje; jei visi tušti — pirmą.
  const firstInStock = variants.findIndex((v) => v.stock > 0)
  const [selected, setSelected] = useState(
    firstInStock >= 0 ? firstInStock : 0
  )

  const v = variants[selected]
  const price = v.priceCents / 100
  const comparePrice = v.comparePriceCents ? v.comparePriceCents / 100 : null
  const savings = comparePrice ? comparePrice - price : null

  return (
    <div className="mb-6">
      {/* Dydžio pasirinkimas */}
      <div className="mb-5">
        <div className="text-[0.82rem] font-semibold uppercase tracking-[1px] text-brand-gray-500 mb-2.5">
          {sizeLabel}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {variants.map((variant, idx) => {
            const isSelected = idx === selected
            const isOut = variant.stock <= 0
            return (
              <button
                key={variant.id}
                type="button"
                disabled={isOut}
                onClick={() => setSelected(idx)}
                aria-pressed={isSelected}
                title={isOut ? outOfStockLabel : undefined}
                className={`min-w-[56px] px-4 py-2.5 rounded-lg text-[0.95rem] font-semibold border-2 transition-colors ${
                  isOut
                    ? 'border-[#E0E0E0] text-brand-gray-400 line-through cursor-not-allowed bg-brand-gray-50'
                    : isSelected
                      ? 'border-brand-magenta bg-brand-magenta text-white'
                      : 'border-[#E0E0E0] text-brand-gray-900 hover:border-brand-magenta'
                }`}
              >
                {variant.size}
              </button>
            )
          })}
        </div>
        {v.stock <= 0 && (
          <div className="mt-2 text-[0.82rem] text-brand-gray-500">
            {outOfStockLabel}
          </div>
        )}
      </div>

      {/* Kaina + „Į krepšelį" pasirinktam dydžiui */}
      <ProductPriceBlock
        lang={lang}
        langPrefixStr={langPrefixStr}
        price={price}
        comparePrice={comparePrice}
        savings={savings}
        pricePerMl={null}
        volumeMl={v.volumeMl}
        cartItem={{
          productId: v.id,
          slug: v.slug,
          categorySlug,
          sku: v.sku,
          name: `${name} (${v.size})`,
          priceCents: v.priceCents,
          volumeMl: v.volumeMl,
          imageUrl: v.imageUrl,
          colorHex: v.colorHex,
          colorNumber: v.colorNumber,
        }}
        labels={labels}
      />
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useIsVerified } from '@/components/auth/VerificationProvider'
import { AddToCartButton } from '@/components/commerce/AddToCartButton'
import { formatPrice } from '@/lib/utils'
import type { Locale } from '@/i18n/config'

type Props = {
  lang: Locale
  langPrefixStr: string
  price: number
  comparePrice: number | null
  savings: number | null
  pricePerMl: string | null
  volumeMl: number | null
  // AddToCartButton item data
  cartItem: {
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
  }
  labels: {
    volumeDouble: string
    pricePerMl: string
    priceOnlyPro: string
    loginToSeePrice: string
    login: string
    register: string
    registerPro: string
    b2bPrice: string
    addToCart: string
    addedToCart: string
    youSave: string
  }
}

export function ProductPriceBlock({
  lang,
  langPrefixStr,
  price,
  comparePrice,
  savings,
  pricePerMl,
  volumeMl,
  cartItem,
  labels,
}: Props) {
  const isVerified = useIsVerified()

  return (
    <>
      {/* 180 ml badge row */}
      {volumeMl === 180 && (
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-brand-gray-50 rounded-xl border border-[#E0E0E0]">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-brand-magenta text-white text-[0.85rem] font-bold rounded-lg">
              180 ml
            </div>
            <div className="text-[0.82rem] text-brand-gray-500 leading-snug">
              {labels.volumeDouble}
            </div>
          </div>
          {pricePerMl && isVerified && (
            <div className="text-[0.88rem] text-brand-gray-900 ml-auto">
              {labels.pricePerMl}{' '}
              <strong className="text-brand-magenta">
                €{pricePerMl}
              </strong>
            </div>
          )}
        </div>
      )}

      {/* Price */}
      {isVerified ? (
        <div className="flex items-baseline flex-wrap gap-3 mb-5">
          {comparePrice && (
            <span className="text-[1.1rem] text-brand-gray-500 line-through">
              {formatPrice(comparePrice, lang)}
            </span>
          )}
          <span className="text-[2.25rem] font-extrabold text-brand-magenta leading-none">
            {formatPrice(price, lang)}
          </span>
          {savings && savings > 0 && (
            <span className="px-3 py-1 bg-brand-magenta/10 text-brand-magenta text-[0.78rem] font-bold rounded-full">
              {labels.youSave} {formatPrice(savings, lang)}
            </span>
          )}
        </div>
      ) : (
        <div className="mb-5 px-5 py-5 bg-brand-gray-50 rounded-xl border border-[#E0E0E0]">
          <p className="text-[0.95rem] text-brand-gray-900 font-semibold mb-1.5">
            {labels.priceOnlyPro}
          </p>
          <p className="text-[0.88rem] text-brand-gray-500 mb-4 leading-[1.5]">
            {labels.loginToSeePrice}
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href={`${langPrefixStr}/prisijungimas`}
              className="flex-1 flex items-center justify-center min-h-[48px] px-6 py-3 bg-brand-magenta text-white rounded-lg text-[0.95rem] font-semibold hover:bg-brand-magenta-dark transition-colors"
            >
              {labels.login}
            </Link>
            <Link
              href={`${langPrefixStr}/registracija`}
              className="flex-1 flex items-center justify-center min-h-[48px] px-6 py-3 border-2 border-brand-magenta text-brand-magenta rounded-lg text-[0.95rem] font-semibold hover:bg-brand-magenta hover:text-white transition-all"
            >
              {labels.register}
            </Link>
          </div>
        </div>
      )}

      {/* CTA */}
      {isVerified ? (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <AddToCartButton
            variant="large"
            className="flex-1 !px-10 !py-[18px] !rounded-lg !text-[1.05rem]"
            label={labels.addToCart}
            labelAdded={labels.addedToCart}
            item={cartItem}
          />
          <Link
            href={`${langPrefixStr}/salonams`}
            className="inline-flex items-center justify-center px-8 py-[18px] border-2 border-brand-magenta text-brand-magenta rounded-lg font-semibold hover:bg-brand-magenta hover:text-white transition-all"
          >
            {labels.b2bPrice}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            href={`${langPrefixStr}/registracija`}
            className="flex-1 flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.05rem] font-semibold hover:bg-brand-magenta/90 transition-colors"
          >
            {labels.registerPro}
          </Link>
          <Link
            href={`${langPrefixStr}/salonams`}
            className="inline-flex items-center justify-center px-8 py-[18px] border-2 border-brand-magenta text-brand-magenta rounded-lg font-semibold hover:bg-brand-magenta hover:text-white transition-all"
          >
            {labels.b2bPrice}
          </Link>
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useVerification } from '@/components/auth/VerificationProvider'
import { useProductPrice } from '@/components/products/ProductPricesProvider'
import { AddToCartButton } from '@/components/commerce/AddToCartButton'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/commerce/cart-store'
import type { Locale } from '@/i18n/config'

/**
 * Mobilioji „Į krepšelį" juosta — fiksuota apačioje, pasirodo nuslinkus pro
 * pagrindinį CTA (sekamas #buybar-anchor elementas). Verifikuotam profesionalui
 * rodo kainą + „Į krepšelį"; svečiui — „Prisijungti". Prisijungusiam, bet dar
 * nepatvirtintam — nerodoma (pagrindinis blokas viską paaiškina).
 * Kai juosta matoma, mobiliajame paslepiamas WhatsApp mygtukas (kad nesikirstų).
 */
export function StickyBuyBar({
  lang,
  langPrefixStr,
  price: price_prop,
  cartItem,
  labels,
}: {
  lang: Locale
  langPrefixStr: string
  price: number
  cartItem: Omit<CartItem, 'quantity'>
  labels: {
    addToCart: string
    addedToCart: string
    login: string
    priceOnlyPro: string
  }
}) {
  const { isVerified, isLoggedIn, isLoading: verifLoading } = useVerification()
  const [show, setShow] = useState(false)

  // Kaina: statiniame puslapyje iš naršyklės; be provider'io — iš prop'o.
  const { price: clientPrice, hasProvider } = useProductPrice(cartItem.productId)
  let price = price_prop
  let resolvedCartItem = cartItem
  let priceReady = !hasProvider
  if (hasProvider && clientPrice) {
    const onSale =
      clientPrice.salePriceCents != null &&
      clientPrice.salePriceCents > 0 &&
      clientPrice.salePriceCents < clientPrice.priceCents
    const effCents = onSale ? clientPrice.salePriceCents! : clientPrice.priceCents
    price = effCents / 100
    resolvedCartItem = { ...cartItem, priceCents: effCents }
    priceReady = true
  }

  useEffect(() => {
    const anchor = document.getElementById('buybar-anchor')
    if (!anchor) return
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (!e) return
        setShow(!e.isIntersecting && e.boundingClientRect.top < 0)
      },
      { threshold: 0 }
    )
    io.observe(anchor)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dk-buybar-open', show)
    return () => document.body.classList.remove('dk-buybar-open')
  }, [show])

  // Kol verifikacija kraunasi — juostos nerodom (kad nemirksėtų „prisijungti").
  if (verifLoading) return null
  // Prisijungęs, bet dar nepatvirtintas — juostos nerodom.
  if (isLoggedIn && !isVerified) return null
  // Patvirtintas, bet kaina dar fetch'inama — juostos nerodom, kol nebus.
  if (isVerified && !priceReady) return null

  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
        show ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border-t border-[#E0E0E0] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center gap-3">
        {isVerified ? (
          <>
            <div className="min-w-0">
              <div className="text-[0.7rem] text-brand-gray-500 leading-none mb-1 truncate">
                {cartItem.name}
              </div>
              <div className="text-[1.3rem] font-extrabold text-brand-magenta leading-none">
                {formatPrice(price, lang)}
              </div>
            </div>
            <AddToCartButton
              variant="large"
              className="ml-auto shrink-0 !px-6 !py-3 !rounded-lg !text-[0.95rem]"
              label={labels.addToCart}
              labelAdded={labels.addedToCart}
              item={resolvedCartItem}
            />
          </>
        ) : (
          <>
            <div className="min-w-0 text-[0.82rem] text-brand-gray-500 leading-snug">
              {labels.priceOnlyPro}
            </div>
            <Link
              href={`${langPrefixStr}/prisijungimas`}
              className="ml-auto shrink-0 btn-shine bg-brand-gradient text-white px-6 py-3 rounded-lg text-[0.95rem] font-semibold whitespace-nowrap hover:brightness-110 transition-all"
            >
              {labels.login}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

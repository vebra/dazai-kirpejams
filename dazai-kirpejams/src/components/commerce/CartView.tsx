'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '@/lib/commerce/cart-store'
import { useVerifiedUser } from '@/lib/auth/useVerifiedUser'
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  MIN_ORDER_CENTS,
  meetsMinimumOrder,
} from '@/lib/commerce/constants'
import { formatPrice } from '@/lib/utils'
import type { Locale } from '@/i18n/config'

type CartViewProps = {
  lang: Locale
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
}

/**
 * Pagrindinis krepšelio vaizdas. Client component, nes dirba su zustand store.
 * SSR saugus — iki hydration nerodo items, kad nebūtų mismatch'ų.
 */
export function CartView({ lang, dict }: CartViewProps) {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clear = useCartStore((s) => s.clear)
  const { isVerified, isLoading: authLoading, user, status } = useVerifiedUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <CartSkeleton />
  }

  if (items.length === 0) {
    return <EmptyCart lang={lang} dict={dict} />
  }

  const subtotalCents = items.reduce(
    (sum, i) => sum + i.priceCents * i.quantity,
    0
  )
  const reachedFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
  const freeShippingRemaining = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents
  )
  const progressPct = Math.min(
    100,
    Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100)
  )
  const meetsMin = meetsMinimumOrder(subtotalCents)
  const minOrderRemaining = Math.max(0, MIN_ORDER_CENTS - subtotalCents)

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-10">
      {/* Prekių sąrašas */}
      <div>
        <div className="bg-white rounded-2xl border border-brand-gray-50 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_120px_140px_40px] gap-4 px-6 py-4 bg-brand-gray-50 text-xs font-semibold text-brand-gray-500 uppercase tracking-wider">
            <div>{dict.cart.product}</div>
            <div className="text-center">{dict.cart.quantity}</div>
            <div className="text-right">{dict.cart.total}</div>
            <div />
          </div>

          {items.map((item) => {
            const lineTotal = item.priceCents * item.quantity
            return (
              <div
                key={item.productId}
                className="flex flex-col gap-3 px-4 py-4 border-t border-brand-gray-50 md:grid md:grid-cols-[1fr_120px_140px_40px] md:gap-4 md:px-6 md:py-5 md:items-center"
              >
                {/* Prekė */}
                <div className="flex items-center gap-4">
                  <Link
                    href={`/${lang}/produktai/${item.categorySlug}/${item.slug}`}
                    className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-brand-gray-50 flex-shrink-0"
                    style={
                      !item.imageUrl && item.colorHex
                        ? { backgroundColor: item.colorHex }
                        : undefined
                    }
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    {item.colorNumber && (
                      <div className="text-xs font-medium text-brand-magenta uppercase tracking-wider mb-1">
                        Color SHOCK · {item.colorNumber}
                      </div>
                    )}
                    <Link
                      href={`/${lang}/produktai/${item.categorySlug}/${item.slug}`}
                      className="text-sm font-semibold text-brand-gray-900 hover:text-brand-magenta transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <div className="text-xs text-brand-gray-500 mt-1">
                      {formatPrice(item.priceCents / 100, lang)}
                      {item.volumeMl ? ` · ${item.volumeMl} ml` : ''}
                    </div>
                  </div>
                </div>

                {/* Kiekis + Suma + Pašalinti — vienoje eilutėje mobiliajame */}
                <div className="flex items-center justify-between md:contents">
                  <div className="flex items-center">
                    <div className="inline-flex items-center border border-brand-gray-50 rounded-full">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-9 h-9 flex items-center justify-center text-brand-gray-900 hover:text-brand-magenta transition-colors"
                        aria-label="-"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-9 h-9 flex items-center justify-center text-brand-gray-900 hover:text-brand-magenta transition-colors"
                        aria-label="+"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right text-base font-bold text-brand-gray-900 tabular-nums">
                    {formatPrice(lineTotal / 100, lang)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="justify-self-end w-9 h-9 flex items-center justify-center text-brand-gray-500 hover:text-brand-magenta transition-colors"
                    aria-label={dict.cart.remove}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <Link
            href={`/${lang}/produktai`}
            className="text-sm font-medium text-brand-gray-500 hover:text-brand-gray-900 transition-colors"
          >
            ← {dict.cart.continueShopping}
          </Link>
          <button
            type="button"
            onClick={clear}
            className="text-sm font-medium text-brand-gray-500 hover:text-brand-magenta transition-colors"
          >
            {dict.cart.clearCart}
          </button>
        </div>
      </div>

      {/* Suvestinė */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="bg-brand-gray-50 rounded-2xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-brand-gray-900">
            {dict.checkout.orderSummary}
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-brand-gray-900">
              <span>{dict.cart.subtotal}</span>
              <span className="font-semibold tabular-nums">
                {formatPrice(subtotalCents / 100, lang)}
              </span>
            </div>
            <div className="flex justify-between text-brand-gray-500">
              <span>{dict.cart.shipping}</span>
              <span className="tabular-nums">
                {dict.cart.shippingCalculatedAtCheckout}
              </span>
            </div>
          </div>

          {/* Nemokamo pristatymo progresas */}
          <div className="pt-4 border-t border-brand-gray-50/60">
            {reachedFreeShipping ? (
              <div className="text-sm font-semibold text-brand-magenta">
                ✓ {dict.cart.freeShippingUnlocked}
              </div>
            ) : (
              <>
                <div className="text-xs text-brand-gray-500 mb-2">
                  {dict.cart.freeShippingProgress.replace(
                    '{amount}',
                    formatPrice(freeShippingRemaining / 100, lang)
                  )}
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-magenta transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Iš viso */}
          <div className="flex justify-between items-baseline pt-4 border-t border-brand-gray-50/60">
            <span className="text-base font-bold text-brand-gray-900">
              {dict.cart.total}
            </span>
            <span className="text-2xl font-bold text-brand-gray-900 tabular-nums">
              {formatPrice(subtotalCents / 100, lang)}
            </span>
          </div>

          {/* Minimalios sumos įspėjimas */}
          {!meetsMin && (
            <div className="bg-white border border-brand-magenta/20 text-brand-magenta text-xs rounded-xl p-3">
              {dict.cart.minOrderWarning.replace(
                '{amount}',
                formatPrice(minOrderRemaining / 100, lang)
              )}
            </div>
          )}

          {/* Auth/verification gate */}
          {!authLoading && !isVerified && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              {!user ? (
                <>
                  Norėdami pirkti,{' '}
                  <Link
                    href={`/${lang}/prisijungimas`}
                    className="font-semibold text-brand-magenta hover:underline"
                  >
                    prisijunkite
                  </Link>{' '}
                  arba{' '}
                  <Link
                    href={`/${lang}/registracija`}
                    className="font-semibold text-brand-magenta hover:underline"
                  >
                    registruokitės
                  </Link>
                  .
                </>
              ) : status === 'pending' ? (
                'Jūsų paskyra dar nepatvirtinta. Laukiame, kol administratorius peržiūrės dokumentą.'
              ) : status === 'rejected' ? (
                <>
                  Jūsų dokumentas buvo atmestas.{' '}
                  <Link
                    href={`/${lang}/paskyra`}
                    className="font-semibold text-brand-magenta hover:underline"
                  >
                    Įkelkite naują dokumentą
                  </Link>
                  .
                </>
              ) : (
                <>
                  Norėdami pirkti,{' '}
                  <Link
                    href={`/${lang}/prisijungimas`}
                    className="font-semibold text-brand-magenta hover:underline"
                  >
                    prisijunkite
                  </Link>
                  .
                </>
              )}
            </div>
          )}

          {/* CTA */}
          {isVerified ? (
            <Link
              href={meetsMin ? `/${lang}/apmokejimas` : '#'}
              aria-disabled={!meetsMin}
              onClick={(e) => {
                if (!meetsMin) e.preventDefault()
              }}
              className={`flex items-center justify-center gap-2 w-full px-6 py-4 font-semibold rounded-xl transition-colors ${
                meetsMin
                  ? 'bg-brand-magenta text-white hover:bg-brand-magenta/90'
                  : 'bg-brand-gray-500/30 text-brand-gray-500 cursor-not-allowed'
              }`}
            >
              {dict.cart.proceedToCheckout}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full px-6 py-4 font-semibold rounded-xl bg-brand-gray-500/30 text-brand-gray-500 cursor-not-allowed">
              {dict.cart.proceedToCheckout}
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function EmptyCart({ lang, dict }: { lang: Locale; dict: CartViewProps['dict'] }) {
  return (
    <div className="flex flex-col items-center text-center py-16">
      <div className="w-20 h-20 rounded-full bg-brand-gray-50 flex items-center justify-center mb-6">
        <ShoppingBag className="w-10 h-10 text-brand-gray-500" />
      </div>
      <h2 className="text-2xl font-bold text-brand-gray-900 mb-3">
        {dict.cart.empty}
      </h2>
      <p className="text-brand-gray-500 mb-8 max-w-md">{dict.cart.emptyDesc}</p>
      <Link
        href={`/${lang}/produktai`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors"
      >
        {dict.cart.continueShopping}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-10 animate-pulse">
      <div className="space-y-4">
        <div className="h-24 bg-brand-gray-50 rounded-2xl" />
        <div className="h-24 bg-brand-gray-50 rounded-2xl" />
      </div>
      <div className="h-64 bg-brand-gray-50 rounded-2xl" />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, ShoppingCart } from 'lucide-react'
import { useCartStore, type CartItem } from '@/lib/commerce/cart-store'
import { useVerification } from '@/components/auth/VerificationProvider'
import { trackAddToCart } from '@/lib/analytics'
import type { LocaleCode } from '@/lib/analytics-types'

type AddToCartButtonProps = {
  item: Omit<CartItem, 'quantity'>
  quantity?: number
  label: string
  labelAdded?: string
  variant?: 'small' | 'large' | 'icon'
  className?: string
}

/**
 * Universalus „Į krepšelį" mygtukas. Paspaudus:
 * - prideda į krepšelį (zustand)
 * - parodo „Pridėta" state 1.5s
 * - atstato į pradinį state
 */
export function AddToCartButton({
  item,
  quantity = 1,
  label,
  labelAdded,
  variant = 'small',
  className = '',
}: AddToCartButtonProps) {
  const addedLabel = labelAdded ?? label
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)
  const { isVerified } = useVerification()
  const params = useParams<{ lang?: string }>()
  const locale = (params?.lang as LocaleCode | undefined) ?? undefined

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(item, quantity)
    trackAddToCart({
      productId: item.productId,
      name: item.name,
      category: item.categorySlug,
      price: item.priceCents / 100,
      quantity,
      currency: 'EUR',
      locale,
      userType: isVerified ? 'professional' : 'guest',
      packSize: item.volumeMl === 180 ? '180ml' : 'other',
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className={`w-10 h-10 rounded-full border-2 text-[1.2rem] font-semibold flex items-center justify-center transition-all ${
          added
            ? 'bg-brand-magenta text-white border-brand-magenta'
            : 'bg-transparent text-brand-magenta border-brand-magenta hover:bg-brand-magenta hover:text-white'
        } ${className}`}
      >
        {added ? <Check className="w-4 h-4" /> : '+'}
      </button>
    )
  }

  if (variant === 'large') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 ${className}`}
        disabled={added}
      >
        {added ? (
          <>
            <Check className="w-5 h-5" />
            {addedLabel}
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            {label}
          </>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
        added
          ? 'bg-brand-magenta text-white'
          : 'bg-brand-gray-900 text-white hover:bg-brand-magenta'
      } ${className}`}
      aria-label={label}
    >
      {added ? addedLabel : label}
    </button>
  )
}

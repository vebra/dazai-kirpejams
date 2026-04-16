'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartCount } from '@/lib/commerce/cart-store'
import { langPrefix } from '@/lib/utils'

type HeaderCartProps = {
  lang: string
  label: string
}

export function HeaderCart({ lang, label }: HeaderCartProps) {
  const count = useCartCount()

  return (
    <Link
      href={`${langPrefix(lang)}/krepselis`}
      className="relative flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 text-brand-gray-900 hover:text-brand-magenta transition-colors"
      aria-label={`${label}${count > 0 ? ` (${count})` : ''}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {count > 0 && (
        <span
          className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-brand-magenta text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none"
          aria-hidden="true"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

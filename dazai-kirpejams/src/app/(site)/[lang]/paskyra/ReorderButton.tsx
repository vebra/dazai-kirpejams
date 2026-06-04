'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { useCartStore } from '@/lib/commerce/cart-store'
import { reorderToCart } from './actions'

const LABEL: Record<Locale, string> = {
  lt: 'Pakartoti',
  en: 'Reorder',
  ru: 'Повторить',
}
const BUSY: Record<Locale, string> = {
  lt: 'Dedama…',
  en: 'Adding…',
  ru: 'Добавляем…',
}
const UNAVAILABLE: Record<Locale, string> = {
  lt: 'Kai kurių prekių nebėra parduotuvėje ir jos nepridėtos: ',
  en: 'Some items are no longer available and were skipped: ',
  ru: 'Некоторых товаров больше нет, они пропущены: ',
}
const FAILED: Record<Locale, string> = {
  lt: 'Nepavyko pakartoti užsakymo.',
  en: 'Could not reorder.',
  ru: 'Не удалось повторить заказ.',
}

export function ReorderButton({ orderId, lang }: { orderId: string; lang: Locale }) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handle() {
    setError(null)
    start(async () => {
      const res = await reorderToCart(orderId, lang)
      if (!res.ok) {
        setError(res.error || FAILED[lang])
        return
      }
      for (const it of res.items) {
        const { quantity, ...rest } = it
        addItem(rest, quantity)
      }
      if (res.unavailable.length > 0) {
        // Nekritinis – informuojam, bet vis tiek vedam į krepšelį
        alert(UNAVAILABLE[lang] + res.unavailable.join(', '))
      }
      router.push(`${langPrefix(lang)}/krepselis`)
    })
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handle}
        disabled={pending}
        className="px-4 py-2 bg-white border border-brand-gray-900 text-brand-gray-900 rounded-lg text-[13px] font-semibold hover:bg-brand-gray-50 transition-colors whitespace-nowrap disabled:opacity-50"
      >
        {pending ? BUSY[lang] : `↻ ${LABEL[lang]}`}
      </button>
      {error && <span className="mt-1 text-[11px] text-red-600">{error}</span>}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { langPrefix } from '@/lib/utils'
import type { Locale } from '@/i18n/config'

const STORAGE_KEY = 'cookie-consent-v1'

type ConsentValue = 'accepted' | 'rejected'

type Dict = {
  title: string
  message: string
  accept: string
  reject: string
  privacyLink: string
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function updateGoogleConsent(value: ConsentValue) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  const granted = value === 'accepted' ? 'granted' : 'denied'
  window.dataLayer.push('consent', 'update', {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    analytics_storage: granted,
  })
}

export function CookieConsent({ lang, dict }: { lang: Locale; dict: Dict }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      if (existing !== 'accepted' && existing !== 'rejected') {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
  }, [])

  function decide(value: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {}
    updateGoogleConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-[100] pb-4 px-4 sm:pb-6 sm:px-6 pointer-events-none"
    >
      <div className="mx-auto max-w-[760px] bg-white border border-[#E0E0E0] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-6 sm:p-7 pointer-events-auto">
        <h2
          id="cookie-consent-title"
          className="text-[1rem] font-bold text-brand-gray-900 mb-2"
        >
          {dict.title}
        </h2>
        <p
          id="cookie-consent-desc"
          className="text-[0.9rem] text-brand-gray-500 leading-[1.6] mb-5"
        >
          {dict.message}{' '}
          <Link
            href={`${langPrefix(lang)}/privatumo-politika`}
            className="text-brand-magenta font-medium hover:underline"
          >
            {dict.privacyLink}
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => decide('rejected')}
            className="px-6 py-3 rounded-lg border border-[#E0E0E0] text-[0.92rem] font-semibold text-brand-gray-900 hover:border-brand-gray-900 transition-colors"
          >
            {dict.reject}
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            className="px-6 py-3 rounded-lg bg-brand-magenta text-white text-[0.92rem] font-semibold hover:bg-brand-magenta-dark transition-colors"
          >
            {dict.accept}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    fbq?: (...args: unknown[]) => void
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

function updateFacebookConsent(value: ConsentValue) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  window.fbq('consent', value === 'accepted' ? 'grant' : 'revoke')
}

type Phase = 'hidden' | 'entering' | 'visible' | 'exiting'

export function CookieConsent({ lang, dict }: { lang: Locale; dict: Dict }) {
  const [phase, setPhase] = useState<Phase>('hidden')

  useEffect(() => {
    let raf = 0
    try {
      const existing = localStorage.getItem(STORAGE_KEY)
      if (existing !== 'accepted' && existing !== 'rejected') {
        setPhase('entering')
        raf = requestAnimationFrame(() => setPhase('visible'))
      }
    } catch {
      setPhase('entering')
      raf = requestAnimationFrame(() => setPhase('visible'))
    }
    return () => cancelAnimationFrame(raf)
  }, [])

  function decide(value: ConsentValue) {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {}
    updateGoogleConsent(value)
    updateFacebookConsent(value)
    setPhase('exiting')
    setTimeout(() => setPhase('hidden'), 350)
  }

  if (phase === 'hidden') return null

  const isShown = phase === 'visible'

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-0 left-0 right-0 z-[100] sm:pb-6 sm:px-6 pointer-events-none"
    >
      <div
        className={`pointer-events-auto transition-[transform,opacity] duration-[350ms] ease-out bg-white border-t border-[#E0E0E0] sm:border sm:mx-auto sm:max-w-[760px] sm:rounded-2xl sm:shadow-[0_8px_32px_rgba(0,0,0,0.15)] ${
          isShown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        {/* Mobile: kompaktiška juosta ≤80px — vienoje eilutėje žinutė + mygtukai */}
        <div className="sm:hidden flex items-center gap-3 px-3 py-2.5">
          <p
            id="cookie-consent-desc"
            className="flex-1 text-[0.72rem] leading-[1.35] text-brand-gray-500 line-clamp-2"
          >
            <span className="font-semibold text-brand-gray-900">
              {dict.title}.
            </span>{' '}
            {dict.message}{' '}
            <Link
              href={`${langPrefix(lang)}/privatumo-politika`}
              className="text-brand-magenta font-medium hover:underline"
            >
              {dict.privacyLink}
            </Link>
          </p>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => decide('rejected')}
              className="px-3 py-1.5 rounded-md border border-[#E0E0E0] text-[0.72rem] font-semibold text-brand-gray-900 hover:border-brand-gray-900 transition-colors"
            >
              {dict.reject}
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              className="px-3 py-1.5 rounded-md bg-brand-magenta text-white text-[0.72rem] font-semibold hover:bg-brand-magenta-dark transition-colors"
            >
              {dict.accept}
            </button>
          </div>
        </div>

        {/* Desktop: pilnas card'o dizainas */}
        <div className="hidden sm:block p-7">
          <h2
            id="cookie-consent-title"
            className="text-[1rem] font-bold text-brand-gray-900 mb-2"
          >
            {dict.title}
          </h2>
          <p className="text-[0.9rem] text-brand-gray-500 leading-[1.6] mb-5">
            {dict.message}{' '}
            <Link
              href={`${langPrefix(lang)}/privatumo-politika`}
              className="text-brand-magenta font-medium hover:underline"
            >
              {dict.privacyLink}
            </Link>
            .
          </p>
          <div className="flex flex-row gap-3 justify-end">
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
    </div>
  )
}

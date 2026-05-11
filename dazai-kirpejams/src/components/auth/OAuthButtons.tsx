'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import type { Locale } from '@/i18n/config'

type OAuthDict = {
  google: string
  facebook: string
  or: string
}

/**
 * Google ir Facebook OAuth mygtukai. Naudojami /prisijungimas ir
 * /registracija formose. Po sėkmingo OAuth, Supabase grąžina į
 * /auth/callback (jau egzistuoja), o ten exchange'inam code į sesiją.
 *
 * Provider'iai turi būti įjungti Supabase Dashboard:
 *   Authentication → Providers → Google / Facebook → Enable.
 * Reikalingi: Client ID + Secret iš Google Cloud Console arba
 * Facebook Developer'io app'o.
 */
export function OAuthButtons({
  lang,
  dict,
}: {
  lang: Locale
  dict: OAuthDict
}) {
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)

  async function signIn(provider: 'google' | 'facebook') {
    if (loading) return
    setLoading(provider)
    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Vercel domeno absoliutus URL — Supabase grąžins į šitą route'ą.
        // /auth/callback jau exchange'ina code į sesiją ir redirect'ina
        // į /paskyra (žr. src/app/auth/callback/route.ts).
        redirectTo: `${window.location.origin}/auth/callback?lang=${lang}`,
      },
    })
    if (error) {
      console.error(`[oauth:${provider}] error:`, error.message)
      setLoading(null)
    }
    // Sėkmės atveju naršyklė bus redirect'inta į provider'io login puslapį,
    // todėl `setLoading(null)` nebepasiekiamas — tai OK.
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => signIn('google')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-3 w-full min-h-[44px] px-4 py-3 bg-white border border-brand-gray-50 rounded-xl text-sm font-semibold text-brand-gray-900 hover:border-brand-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={dict.google}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading === 'google' ? '…' : dict.google}
        </button>

        <button
          type="button"
          onClick={() => signIn('facebook')}
          disabled={loading !== null}
          className="flex items-center justify-center gap-3 w-full min-h-[44px] px-4 py-3 bg-[#1877F2] text-white rounded-xl text-sm font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={dict.facebook}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
            <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07C2 17.1 5.66 21.27 10.44 22v-7.02H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.78-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.27 22 17.1 22 12.07z" />
          </svg>
          {loading === 'facebook' ? '…' : dict.facebook}
        </button>
      </div>

      <div className="relative flex items-center my-4">
        <div className="flex-1 border-t border-brand-gray-50" />
        <span className="px-3 text-[0.72rem] uppercase tracking-wider text-brand-gray-500 font-semibold">
          {dict.or}
        </span>
        <div className="flex-1 border-t border-brand-gray-50" />
      </div>
    </div>
  )
}

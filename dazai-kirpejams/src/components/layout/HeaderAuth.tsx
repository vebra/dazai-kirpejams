'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { langPrefix } from '@/lib/utils'

type HeaderAuthProps = {
  lang: string
  myAccountLabel: string
  loginLabel: string
}

/**
 * Header auth button — shows login link for guests, user icon for logged-in.
 * Uses client-side Supabase session check to avoid blocking SSR.
 */
export function HeaderAuth({ lang, myAccountLabel, loginLabel }: HeaderAuthProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabase()

    // getSession() skaito sesiją LOKALIAI (be tinklo užklausos) — projekto
    // taisyklė mobiliajam: getUser() tinklo validacija in-app naršyklėse
    // neretai neįvyksta ir prisijungusiam rodydavo „Prisijungti".
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Don't render anything until we know auth state (avoids flash)
  if (isLoggedIn === null) {
    return (
      <div className="w-5 h-5" aria-hidden />
    )
  }

  if (isLoggedIn) {
    return (
      <Link
        href={`${langPrefix(lang)}/paskyra`}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2.5 text-brand-gray-900 hover:text-brand-magenta transition-colors"
        aria-label={myAccountLabel}
      >
        <User className="w-5 h-5" />
      </Link>
    )
  }

  return (
    <Link
      href={`${langPrefix(lang)}/prisijungimas`}
      className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-[0.85rem] font-semibold text-brand-magenta border border-brand-magenta rounded-lg hover:bg-brand-magenta hover:text-white transition-all"
    >
      {loginLabel}
    </Link>
  )
}

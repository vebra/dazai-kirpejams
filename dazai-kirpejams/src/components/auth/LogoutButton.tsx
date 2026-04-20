'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { langPrefix } from '@/lib/utils'
import type { Locale } from '@/i18n/config'

type LogoutButtonProps = {
  lang: Locale
  label: string
  className?: string
}

export function LogoutButton({ lang, label, className }: LogoutButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    if (pending) return
    setPending(true)
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.replace(langPrefix(lang) || '/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={
        className ??
        'px-5 py-2.5 border border-[#E0E0E0] rounded-xl text-sm font-semibold text-brand-gray-900 hover:bg-brand-gray-50 transition-colors disabled:opacity-50'
      }
    >
      {label}
    </button>
  )
}

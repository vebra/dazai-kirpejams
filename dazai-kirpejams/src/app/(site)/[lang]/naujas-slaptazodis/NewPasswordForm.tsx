'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { createBrowserSupabase } from '@/lib/supabase/browser'

type Dict = {
  passwordLabel: string
  passwordPlaceholder: string
  confirmLabel: string
  confirmPlaceholder: string
  submit: string
  submitting: string
  successRedirect: string
}

type ErrorDict = {
  missing: string
  mismatch: string
  weak: string
  noSession: string
  generic: string
}

export function NewPasswordForm({
  lang,
  dict,
  errorDict,
}: {
  lang: Locale
  dict: Dict
  errorDict: ErrorDict
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setError(null)

    const fd = new FormData(e.currentTarget)
    const password = (fd.get('password') as string) ?? ''
    const confirm = (fd.get('confirm') as string) ?? ''

    if (!password || !confirm) {
      setError(errorDict.missing)
      return
    }
    if (password.length < 8) {
      setError(errorDict.weak)
      return
    }
    if (password !== confirm) {
      setError(errorDict.mismatch)
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabase()
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        setError(errorDict.noSession)
        return
      }

      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) {
        console.error('[reset-password] updateUser error:', updateErr.message)
        setError(errorDict.generic)
        return
      }

      setSuccess(true)
      // Trumpa pauzė, kad klientas pamatytų sėkmės žinutę
      setTimeout(() => {
        router.replace(`${langPrefix(lang)}/paskyra`)
        router.refresh()
      }, 1500)
    })
  }

  if (success) {
    return (
      <div className="px-4 py-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm leading-relaxed text-center">
        {dict.successRedirect}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <label className="block">
        <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
          {dict.passwordLabel} <span className="text-brand-magenta">*</span>
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder={dict.passwordPlaceholder}
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
          {dict.confirmLabel} <span className="text-brand-magenta">*</span>
        </span>
        <input
          type="password"
          name="confirm"
          required
          autoComplete="new-password"
          minLength={8}
          placeholder={dict.confirmPlaceholder}
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? dict.submitting : dict.submit}
      </button>
    </form>
  )
}

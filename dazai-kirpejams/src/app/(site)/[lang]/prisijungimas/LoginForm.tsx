'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { trackLogin } from '@/lib/analytics'

type LoginFormDict = {
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  submit: string
  submitting: string
  noAccount: string
  registerCta: string
}

type ErrorDict = {
  loginMissing: string
  loginInvalid: string
  loginUnconfirmedEmail: string
  loginGeneric: string
}

export function LoginForm({
  lang,
  dict,
  errorDict,
}: {
  lang: Locale
  dict: LoginFormDict
  errorDict: ErrorDict
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const email = ((fd.get('email') as string) ?? '').trim().toLowerCase()
    const password = (fd.get('password') as string) ?? ''

    if (!email || !password) {
      setError(errorDict.loginMissing)
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabase()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInErr) {
        const msg = signInErr.message
        if (
          msg.includes('Invalid login') ||
          msg.includes('invalid_credentials')
        ) {
          setError(errorDict.loginInvalid)
        } else if (msg.includes('Email not confirmed')) {
          setError(errorDict.loginUnconfirmedEmail)
        } else {
          console.error('[login] signIn error:', msg)
          setError(errorDict.loginGeneric)
        }
        return
      }

      trackLogin({ locale: lang })
      router.replace(`${langPrefix(lang)}/paskyra`)
      router.refresh()
    })
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
          {dict.emailLabel} <span className="text-brand-magenta">*</span>
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={dict.emailPlaceholder}
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
          {dict.passwordLabel} <span className="text-brand-magenta">*</span>
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder={dict.passwordPlaceholder}
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

      <p className="text-center text-xs text-brand-gray-500">
        {dict.noAccount}{' '}
        <Link
          href={`${langPrefix(lang)}/registracija`}
          className="text-brand-magenta font-semibold hover:underline"
        >
          {dict.registerCta}
        </Link>
      </p>
    </form>
  )
}

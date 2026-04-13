'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginAction, type LoginState } from './actions'
import type { Locale } from '@/i18n/config'

const initialState: LoginState = {}

export function LoginForm({ lang }: { lang: Locale }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  )
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      router.push(`/${lang}/produktai`)
      router.refresh()
    }
  }, [state.success, lang, router])

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      <label className="block">
        <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
          El. paštas <span className="text-brand-magenta">*</span>
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder="jusu@paštas.lt"
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-medium text-brand-gray-500 mb-1.5">
          Slaptažodis <span className="text-brand-magenta">*</span>
        </span>
        <input
          type="password"
          name="password"
          required
          placeholder="Jūsų slaptažodis"
          className="w-full px-4 py-3 border border-brand-gray-50 rounded-xl text-sm focus:outline-none focus:border-brand-magenta transition-colors bg-white"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Jungiamasi…' : 'Prisijungti'}
      </button>

      <p className="text-center text-xs text-brand-gray-500">
        Neturite paskyros?{' '}
        <Link
          href={`/${lang}/registracija`}
          className="text-brand-magenta font-semibold hover:underline"
        >
          Registruotis
        </Link>
      </p>
    </form>
  )
}

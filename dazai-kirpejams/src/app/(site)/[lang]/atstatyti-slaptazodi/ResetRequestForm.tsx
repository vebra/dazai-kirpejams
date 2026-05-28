'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'
import { requestPasswordResetAction, type ResetRequestState } from './actions'

type Dict = {
  emailLabel: string
  emailPlaceholder: string
  submit: string
  submitting: string
  successTitle: string
  successDesc: string
  backToLogin: string
}

const initialState: ResetRequestState = {}

export function ResetRequestForm({
  lang,
  dict,
}: {
  lang: Locale
  dict: Dict
}) {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState
  )

  if (state.success) {
    return (
      <div className="space-y-5">
        <div className="px-4 py-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm leading-relaxed">
          <div className="font-semibold mb-1">{dict.successTitle}</div>
          <div>{dict.successDesc}</div>
        </div>
        <Link
          href={`${langPrefix(lang)}/prisijungimas`}
          className="block text-center text-sm text-brand-magenta font-semibold hover:underline"
        >
          ← {dict.backToLogin}
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="lang" value={lang} />
      {/* Honeypot — bot'ams */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] w-px h-px"
        aria-hidden="true"
      />

      {state.error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {state.error}
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-4 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? dict.submitting : dict.submit}
      </button>

      <Link
        href={`${langPrefix(lang)}/prisijungimas`}
        className="block text-center text-xs text-brand-gray-500 hover:text-brand-gray-900"
      >
        ← {dict.backToLogin}
      </Link>
    </form>
  )
}

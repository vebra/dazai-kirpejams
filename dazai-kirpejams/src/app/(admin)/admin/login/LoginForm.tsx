'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type LoginState } from './actions'

const initialState: LoginState = {}

/**
 * Login forma — atitinka HTML dizaino `admin.html` layout'ą: juodas fonas,
 * balta kortelė su rounded corners, magenta „Prisijungti" mygtukas.
 */
export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialError ? { error: initialError } : initialState
  )

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-5">
      <div className="w-full max-w-[420px] bg-white rounded-2xl px-10 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-gray-900 tracking-tight">
            Dažai Kirpėjams
          </h1>
          <p className="mt-1 text-sm font-medium text-brand-gray-500">
            Administravimas
          </p>
        </div>

        {state.error && (
          <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-500 rounded-lg text-[13px]">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              El. paštas
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="admin@dazaikirpejams.lt"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-brand-gray-900 mb-1.5"
            >
              Slaptažodis
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Slaptažodis"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 px-4 py-3.5 bg-brand-magenta text-white rounded-lg font-semibold text-[15px] hover:bg-brand-magenta-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Jungiamasi…' : 'Prisijungti'}
          </button>
        </form>

        <div className="h-px bg-[#eee] my-6" />

        <Link
          href="/"
          className="block text-center text-[13px] text-brand-gray-500 hover:text-brand-magenta transition-colors"
        >
          Grįžti į svetainę
        </Link>
      </div>
    </div>
  )
}

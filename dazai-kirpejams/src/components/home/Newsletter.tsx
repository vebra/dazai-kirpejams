'use client'

import { useActionState } from 'react'
import { Container } from '@/components/ui/Container'
import {
  subscribeNewsletterAction,
  type NewsletterState,
} from './newsletter-action'
import type { Locale } from '@/i18n/config'

const initialState: NewsletterState = {}

type NewsletterDict = {
  title: string
  subtitle: string
  placeholder: string
  cta: string
  sending: string
  success: string
}

/**
 * Naujienlaiškis — šviesiai pilkas fonas, horizontalus išdėstymas:
 *  - kairėje antraštė + paantraštė
 *  - dešinėje inline email forma
 */
export function Newsletter({
  lang,
  dict,
}: {
  lang: Locale
  dict: NewsletterDict
}) {
  const [state, formAction, isPending] = useActionState(
    subscribeNewsletterAction,
    initialState
  )

  return (
    <section className="py-[60px] bg-brand-gray-50">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div>
            <h3 className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-bold text-brand-gray-900 mb-2">
              {dict.title}
            </h3>
            <p className="text-brand-gray-500">
              {dict.subtitle}
            </p>
          </div>

          {state.success ? (
            <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium">
              <span className="text-lg">✓</span>
              {dict.success}
            </div>
          ) : (
            <form
              action={formAction}
              className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0"
            >
              <input type="hidden" name="locale" value={lang} />

              <div className="relative">
                <input
                  type="email"
                  name="email"
                  placeholder={dict.placeholder}
                  required
                  className="px-5 py-[14px] border border-[#E0E0E0] rounded-lg text-[0.95rem] bg-white w-full sm:w-[300px] focus:outline-none focus:border-brand-magenta transition-colors"
                />
                {state.error && (
                  <div className="absolute -bottom-6 left-0 text-[11px] text-red-600">
                    {state.error}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-[14px] bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? dict.sending : dict.cta}
              </button>
            </form>
          )}
        </div>
      </Container>
    </section>
  )
}

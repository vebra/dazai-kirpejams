'use client'

import { useActionState, useEffect } from 'react'
import { submitB2bInquiryAction, type B2bFormState } from '@/app/(site)/[lang]/salonams/actions'
import { trackLead } from '@/lib/analytics'
import type { Locale } from '@/i18n/config'

type B2BCtaLabels = {
  formTitle: string
  formSalonName: string
  formYourName: string
  formEmail: string
  formPhone: string
  formMessage: string
  formSubmit: string
  formSubmitting: string
  formSuccessTitle: string
  formSuccessDesc: string
}

const initialState: B2bFormState = {}

export function B2BCtaForm({
  lang,
  labels,
}: {
  lang: Locale
  labels: B2BCtaLabels
}) {
  const [state, formAction, isPending] = useActionState(
    submitB2bInquiryAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      trackLead({
        leadType: 'b2b',
        locale: lang,
        userType: 'guest',
        eventId: state.eventId,
      })
    }
  }, [state.success, state.eventId, lang])

  if (state.success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-magenta/25 flex items-center justify-center mx-auto">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h3 className="text-xl font-bold text-white">
          {labels.formSuccessTitle}
        </h3>
        <p className="text-white/80 max-w-sm mx-auto leading-relaxed">
          {labels.formSuccessDesc}
        </p>
      </div>
    )
  }

  return (
    <>
      <h3 className="text-[clamp(1.15rem,2.5vw,1.5rem)] font-bold text-white mb-6">
        {labels.formTitle}
      </h3>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="locale" value={lang} />
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] w-px h-px overflow-hidden"
        >
          <label>
            Website
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              defaultValue=""
            />
          </label>
        </div>

        {state.error && (
          <div className="px-4 py-3 bg-red-500/15 border border-red-400/40 text-red-100 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        <input
          type="text"
          name="salon_name"
          placeholder={labels.formSalonName}
          required
          autoComplete="organization"
          className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
        />
        <input
          type="text"
          name="contact_name"
          placeholder={labels.formYourName}
          required
          autoComplete="name"
          className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
        />
        <input
          type="email"
          name="email"
          placeholder={labels.formEmail}
          required
          autoComplete="email"
          inputMode="email"
          className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
        />
        <input
          type="tel"
          name="phone"
          placeholder={labels.formPhone}
          autoComplete="tel"
          inputMode="tel"
          className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors"
        />
        <textarea
          name="message"
          placeholder={labels.formMessage}
          rows={3}
          className="w-full px-4 py-3 bg-white/[0.08] border border-white/20 rounded-lg text-white placeholder:text-white/45 text-[0.95rem] focus:outline-none focus:border-brand-magenta transition-colors resize-vertical"
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-8 py-[14px] bg-brand-magenta text-white rounded-lg font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isPending ? labels.formSubmitting : `${labels.formSubmit} →`}
        </button>
      </form>
    </>
  )
}

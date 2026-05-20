'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { langPrefix } from '@/lib/utils'
import { checkRateLimit } from '@/lib/rate-limit'

export type LoginState = {
  error?: string
}

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = (formData.get('password') as string) ?? ''
  const lang = resolveLang(formData.get('lang'))
  const { errors } = await getDictionary(lang)

  if (!email || !password) {
    return { error: errors.loginMissing }
  }

  // Brute-force apsauga: 5 bandymai per 10 min iš to paties IP. Tas pats
  // pattern kaip /admin/login ir kaip registracija (žr. checkRateLimit).
  // Supabase Auth turi tik silpną default protection — be šio guard'o
  // atakuotojas gali daryti password spray prieš bet kurį žinomą email'ą.
  const rl = await checkRateLimit({
    action: 'login',
    windowSeconds: 600,
    max: 5,
  })
  if (!rl.allowed) {
    return { error: errors.loginGeneric }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[login] signIn error:', error.message)
    if (
      error.message.includes('Invalid login') ||
      error.message.includes('invalid_credentials')
    ) {
      return { error: errors.loginInvalid }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: errors.loginUnconfirmedEmail }
    }
    return { error: errors.loginGeneric }
  }

  redirect(`${langPrefix(lang)}/paskyra`)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
}

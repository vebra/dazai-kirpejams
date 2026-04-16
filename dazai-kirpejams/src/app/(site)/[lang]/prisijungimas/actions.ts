'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { langPrefix } from '@/lib/utils'

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

  if (!email || !password) {
    return { error: 'Įveskite el. paštą ir slaptažodį.' }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[login] signIn error:', error.message)
    if (
      error.message.includes('Invalid login') ||
      error.message.includes('invalid_credentials')
    ) {
      return { error: 'Neteisingas el. paštas arba slaptažodis.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        error:
          'El. paštas dar nepatvirtintas. Patikrinkite savo inbox ir spam.',
      }
    }
    return { error: 'Nepavyko prisijungti. Bandykite dar kartą.' }
  }

  redirect(`${langPrefix(lang)}/paskyra`)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
}

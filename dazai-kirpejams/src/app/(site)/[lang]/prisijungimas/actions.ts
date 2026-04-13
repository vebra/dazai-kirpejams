'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'

export type LoginState = {
  error?: string
  success?: boolean
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = (formData.get('password') as string) ?? ''

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

  return { success: true }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
}

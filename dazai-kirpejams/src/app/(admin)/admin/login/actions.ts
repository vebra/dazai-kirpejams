'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { isAdminEmail } from '@/lib/admin/auth'

export type LoginState = {
  error?: string
}

/**
 * Server Action prisijungimui. Validuoja email+slaptažodį per Supabase Auth,
 * patikrina ar vartotojas yra admin allow-list'e (ADMIN_EMAILS env var),
 * ir nukreipia į /admin po sėkmingo prisijungimo.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: 'Įveskite el. paštą ir slaptažodį.' }
  }

  if (!isAdminEmail(email)) {
    // Grąžinam bendrą klaidą — nerodom, ar email'as leidžiamas, kad
    // neišduotume informacijos apie allow-list'ą.
    return { error: 'Neteisingas el. paštas arba slaptažodis.' }
  }

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Neteisingas el. paštas arba slaptažodis.' }
  }

  redirect('/admin')
}

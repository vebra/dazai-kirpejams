'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { verifyAdminAfterLogin } from '@/lib/admin/auth'

export type LoginState = {
  error?: string
}

/**
 * Server Action prisijungimui:
 *  1. Validuoja email+slaptažodį per Supabase Auth
 *  2. Po sėkmingo signIn tikrina, ar vartotojas yra `admin_users` lentelėje
 *  3. Jei ne admin — atsijungia ir grąžina bendrą klaidą (be info leakage)
 *  4. Jei admin — redirect į /admin
 *
 * Klaida visais atvejais ta pati („Neteisingas email arba slaptažodis"),
 * kad neišduotume allow-list'o informacijos per klaidos skirtumus.
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

  const supabase = await createServerSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: 'Neteisingas el. paštas arba slaptažodis.' }
  }

  const isAdmin = await verifyAdminAfterLogin(supabase, data.user.id)
  if (!isAdmin) {
    // signOut'intas viduje verifyAdminAfterLogin — grąžinam bendrą klaidą
    return { error: 'Neteisingas el. paštas arba slaptažodis.' }
  }

  redirect('/admin')
}

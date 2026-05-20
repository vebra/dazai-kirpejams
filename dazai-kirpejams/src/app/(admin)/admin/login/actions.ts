'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { verifyAdminAfterLogin } from '@/lib/admin/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { loginSchema, formDataToObject } from '@/lib/validation/auth-schemas'

export type LoginState = {
  error?: string
}

/**
 * Server Action prisijungimui:
 *  1. Rate-limit prieš signIn — kad password spray ant admin allow-list
 *     adresų (mažas tikslo aikštė) neleistų neribotai bandyti
 *  2. Validuoja email+slaptažodį per Supabase Auth
 *  3. Po sėkmingo signIn tikrina, ar vartotojas yra `admin_users` lentelėje
 *  4. Jei ne admin — atsijungia ir grąžina bendrą klaidą (be info leakage)
 *  5. Jei admin — redirect į /admin
 *
 * Klaida visais atvejais ta pati („Neteisingas email arba slaptažodis"),
 * kad neišduotume allow-list'o informacijos per klaidos skirtumus.
 */
export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  // Zod schema validacija — žr. src/lib/validation/auth-schemas.ts
  const parsed = loginSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return { error: 'Įveskite el. paštą ir slaptažodį.' }
  }
  const { email, password } = parsed.data

  // Brute-force apsauga: 5 bandymai per 10 min iš to paties IP. Tikram
  // adminui to užtenka, atakuotojui — neleidžia password spray.
  const rl = await checkRateLimit({
    action: 'admin-login',
    windowSeconds: 600,
    max: 5,
  })
  if (!rl.allowed) {
    return {
      error: 'Per daug bandymų. Pabandykite po kelių minučių.',
    }
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

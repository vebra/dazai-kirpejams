'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { verifyRepAfterLogin } from '@/lib/rep/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { loginSchema, formDataToObject } from '@/lib/validation/auth-schemas'

export type LoginState = { error?: string }

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    return { error: 'Įveskite el. paštą ir slaptažodį.' }
  }
  const { email, password } = parsed.data

  const rl = await checkRateLimit({ action: 'rep-login', windowSeconds: 600, max: 5 })
  if (!rl.allowed) {
    return { error: 'Per daug bandymų. Pabandykite po kelių minučių.' }
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return { error: 'Neteisingas el. paštas arba slaptažodis.' }
  }

  // Po signIn — patikrinam, ar tai vadybininkė (arba admin). Jei ne — atsijungia
  // viduje, grąžinam bendrą klaidą (be info leakage apie role).
  const ok = await verifyRepAfterLogin(supabase, data.user.id)
  if (!ok) {
    return { error: 'Neteisingas el. paštas arba slaptažodis.' }
  }

  redirect('/vadybininke/naujas-uzsakymas')
}

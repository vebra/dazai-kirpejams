'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient as createServiceClient } from '@/lib/supabase/server'

export type RegisterState = {
  error?: string
  success?: boolean
}

/**
 * Kliento registracija:
 *   1) Supabase Auth signUp (email + password)
 *   2) Sukuria `user_profiles` eilutę su verification_status='pending'
 *   3) Jei pateiktas dokumentas — jau bus įkeltas per atskirą client-side
 *      upload'ą (Storage RLS leidžia authenticated user'iui rašyti į
 *      `verification-docs/{user_id}/` path'ą).
 *
 * Po sėkmingo signUp:
 *   - Supabase automatiškai siunčia email patvirtinimo laišką (jei Supabase
 *     Auth > Email Confirmations yra enabled)
 *   - Vartotojas turi laukti, kol admin'as peržiūrės dokumentą ir patvirtins
 */
export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const password = (formData.get('password') as string) ?? ''
  const firstName = ((formData.get('first_name') as string) ?? '').trim()
  const lastName = ((formData.get('last_name') as string) ?? '').trim()
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const businessType = ((formData.get('business_type') as string) ?? '').trim()
  const salonName = ((formData.get('salon_name') as string) ?? '').trim()
  const companyCode = ((formData.get('company_code') as string) ?? '').trim()
  const verificationNotes = (
    (formData.get('verification_notes') as string) ?? ''
  ).trim()

  // Validacijos
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Įveskite teisingą el. paštą.' }
  }
  if (!password || password.length < 6) {
    return { error: 'Slaptažodis turi būti bent 6 simbolių.' }
  }
  if (!firstName) {
    return { error: 'Įveskite vardą.' }
  }
  if (!lastName) {
    return { error: 'Įveskite pavardę.' }
  }
  if (!businessType || !['hairdresser', 'salon', 'other'].includes(businessType)) {
    return { error: 'Pasirinkite veiklos tipą.' }
  }

  // 1) signUp per SSR Supabase klientą (anon key)
  const supabase = await createServerSupabase()
  const { data: signUpData, error: signUpError } =
    await supabase.auth.signUp({
      email,
      password,
    })

  if (signUpError) {
    console.error('[register] signUp error:', signUpError.message)
    if (signUpError.message.includes('already registered')) {
      return {
        error: 'Šis el. paštas jau užregistruotas. Bandykite prisijungti.',
      }
    }
    return { error: 'Nepavyko užregistruoti. Bandykite dar kartą.' }
  }

  if (!signUpData.user) {
    return { error: 'Nepavyko sukurti paskyros.' }
  }

  // 2) user_profiles eilutė — per service role, nes naujas user'is dar neturi
  // sesijos (email dar nepatvirtintas).
  const serviceClient = createServiceClient()
  const { error: profileError } = await serviceClient
    .from('user_profiles')
    .insert({
      id: signUpData.user.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      business_type: businessType,
      salon_name: salonName || null,
      company_code: companyCode || null,
      verification_notes: verificationNotes || null,
      verification_status: 'pending',
    })

  if (profileError) {
    console.error('[register] profile insert error:', profileError.message)
    // Jei profilis nepavyko, bet user sukurtas — nėra gera situacija,
    // bet user galės prisijungti ir profilis bus sukurtas vėliau (admin arba
    // per atnaujintą registracijos formą). Negrąžinam error, nes signUp jau
    // pavyko.
  }

  return { success: true }
}

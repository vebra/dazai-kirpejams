'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient as createServiceClient } from '@/lib/supabase/server'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export type RegisterState = {
  error?: string
  success?: boolean
}

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

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
  const lang = resolveLang(formData.get('lang'))
  const { errors } = await getDictionary(lang)

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: errors.emailInvalid }
  }
  if (!password || password.length < 6) {
    return { error: errors.passwordTooShort }
  }
  if (!firstName) {
    return { error: errors.firstNameRequired }
  }
  if (!lastName) {
    return { error: errors.lastNameRequired }
  }
  if (!businessType || !['hairdresser', 'salon', 'other'].includes(businessType)) {
    return { error: errors.businessTypeRequired }
  }

  const supabase = await createServerSupabase()
  const { data: signUpData, error: signUpError } =
    await supabase.auth.signUp({
      email,
      password,
    })

  if (signUpError) {
    console.error('[register] signUp error:', signUpError.message)
    if (signUpError.message.includes('already registered')) {
      return { error: errors.emailAlreadyRegistered }
    }
    return { error: errors.registerGeneric }
  }

  if (!signUpData.user) {
    return { error: errors.createAccountFailed }
  }

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
  }

  return { success: true }
}

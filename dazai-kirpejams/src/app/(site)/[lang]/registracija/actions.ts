'use server'

import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient as createServiceClient } from '@/lib/supabase/server'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import {
  buildRegistrationPendingEmail,
  buildAdminRegistrationEmail,
} from '@/lib/email/auth-templates'
import { checkRateLimit, isHoneypotTriggered } from '@/lib/rate-limit'

export type RegisterState = {
  error?: string
  success?: boolean
}

const FALLBACK_ADMIN_EMAIL = 'info@dziuljetavebre.lt'

const ALLOWED_BUSINESS_TYPES = [
  'hairdresser',
  'colorist',
  'salon_owner',
  'salon', // legacy reikšmė — paliekame, kad seni linkai/forma neatmestų
  'student',
  'other',
] as const

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
  const city = ((formData.get('city') as string) ?? '').trim()
  const businessType = ((formData.get('business_type') as string) ?? '').trim()
  const salonName = ((formData.get('salon_name') as string) ?? '').trim()
  const companyCode = ((formData.get('company_code') as string) ?? '').trim()
  const dailyDyesCount = ((formData.get('daily_dyes_count') as string) ?? '').trim()
  const verificationNotes = (
    (formData.get('verification_notes') as string) ?? ''
  ).trim()
  const lang = resolveLang(formData.get('lang'))
  const { errors } = await getDictionary(lang)

  // Honeypot: bot'ams apsimetam sėkme, kad nesidomėtų
  if (isHoneypotTriggered(formData)) {
    return { success: true }
  }

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
  if (
    !businessType ||
    !(ALLOWED_BUSINESS_TYPES as readonly string[]).includes(businessType)
  ) {
    return { error: errors.businessTypeRequired }
  }
  // Profesionalo savideklaracija pakeitė dokumento įkėlimą — be jos
  // registracija neleidžiama (parduotuvė tik specialistams).
  if (formData.get('confirm_professional') !== 'on') {
    return { error: errors.confirmProfessionalRequired }
  }

  // Rate-limit prieš signUp — registracija rašo per service-role klientą,
  // todėl be limito galimas masinis fake-account spam'as.
  const rl = await checkRateLimit({
    action: 'register',
    windowSeconds: 3600,
    max: 5,
  })
  if (!rl.allowed) {
    return { error: errors.registerGeneric }
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
      city: city || null,
      business_type: businessType,
      salon_name: salonName || null,
      company_code: companyCode || null,
      daily_dyes_count: dailyDyesCount || null,
      verification_notes: verificationNotes || null,
      // Registracijos kalba įrašoma profilyje, kad admin'as patvirtindamas
      // ar atmesdamas (dienomis vėliau) galėtų išsiųsti laišką ta pačia
      // kalba, kuria vartotojas užsiregistravo. Žr. migraciją 033.
      lang,
      // Registracija laukia admin'o patvirtinimo per /admin/verifikacija.
      // Kainos NEatveriamos, kol statusas netaps `approved` — kliento
      // payload'e jų taip pat nebus (žr. queries.ts kainų vartus).
      verification_status: 'pending',
    })

  if (profileError) {
    console.error('[register] profile insert error:', profileError.message)
  }

  // Email'ai — defensyvūs. Jei Resend nesukonfigūruotas arba lūžta —
  // registracijos srautas nesugriūna, tik konsolėj warning'as.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'

  const pending = buildRegistrationPendingEmail({ firstName, lang, siteUrl })
  await sendEmail({
    to: email,
    subject: pending.subject,
    html: pending.html,
    text: pending.text,
  }).catch((err) => {
    console.error('[register] pending email failed:', err)
  })

  const adminEmail = getAdminNotificationEmail() ?? FALLBACK_ADMIN_EMAIL
  const adminMail = buildAdminRegistrationEmail({
    firstName,
    lastName,
    email,
    phone,
    city: city || null,
    businessType: businessType || null,
    salonName: salonName || null,
    companyCode: companyCode || null,
    dailyDyesCount: dailyDyesCount || null,
    verificationNotes: verificationNotes || null,
    lang,
    createdAt: new Date().toISOString(),
    adminUrl: `${siteUrl}/admin/verifikacija`,
  })
  await sendEmail({
    to: adminEmail,
    subject: adminMail.subject,
    html: adminMail.html,
    text: adminMail.text,
    replyTo: email,
  }).catch((err) => {
    console.error('[register] admin notification email failed:', err)
  })

  return { success: true }
}

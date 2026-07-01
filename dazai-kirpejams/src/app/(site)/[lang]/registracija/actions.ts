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
import { registerSchema, formDataToObject } from '@/lib/validation/auth-schemas'

export type RegisterState = {
  error?: string
  success?: boolean
  /** Įvestos reikšmės klaidos atveju — React 19 po action'o resetina
   * uncontrolled formą, tad be šito vartotojas po klaidos turėtų pildyti
   * visus ~10 laukų iš naujo. Slaptažodis NIEKADA negrąžinamas. */
  values?: Record<string, string>
}

const FALLBACK_ADMIN_EMAIL = 'info@dziuljetavebre.lt'

// Laukai, kuriuos saugu grąžinti formai po klaidos (be password!)
const ECHO_FIELDS = [
  'email',
  'first_name',
  'last_name',
  'phone',
  'city',
  'salon_name',
  'company_code',
  'daily_dyes_count',
  'verification_notes',
  'confirm_professional',
] as const

function echoValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of ECHO_FIELDS) {
    const v = formData.get(k)
    if (typeof v === 'string' && v) out[k] = v
  }
  return out
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
  const lang = resolveLang(formData.get('lang'))
  const { errors } = await getDictionary(lang)

  // Honeypot: bot'ams apsimetam sėkme, kad nesidomėtų
  if (isHoneypotTriggered(formData)) {
    return { success: true }
  }

  // Zod schema validacija. Klaidos `message` string'as yra dictionary
  // raktas (errors.xxx), žr. src/lib/validation/auth-schemas.ts.
  const parsed = registerSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    const key = firstIssue?.message as keyof typeof errors
    return { error: errors[key] ?? errors.registerGeneric, values: echoValues(formData) }
  }
  const {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
    phone,
    city,
    business_type: businessType,
    salon_name: salonName,
    company_code: companyCode,
    daily_dyes_count: dailyDyesCount,
    verification_notes: verificationNotes,
  } = parsed.data

  // Rate-limit prieš signUp — registracija rašo per service-role klientą,
  // todėl be limito galimas masinis fake-account spam'as.
  const rl = await checkRateLimit({
    action: 'register',
    windowSeconds: 3600,
    max: 5,
    failClosed: true,
  })
  if (!rl.allowed) {
    return { error: errors.registerGeneric, values: echoValues(formData) }
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
      return { error: errors.emailAlreadyRegistered, values: echoValues(formData) }
    }
    return { error: errors.registerGeneric, values: echoValues(formData) }
  }

  if (!signUpData.user) {
    return { error: errors.createAccountFailed, values: echoValues(formData) }
  }

  // Dublikato patikra su įjungtu email confirmation: Supabase dėl enumeration
  // protection egzistuojančiam el. paštui grąžina NE klaidą, o obfuskuotą
  // user objektą su TUŠČIU identities masyvu (naujas UUID, kurio auth.users
  // realiai nėra). Be šios patikros dublikato registracija atrodydavo
  // sėkminga: profilio upsert lūždavo ant FK, o vartotojas laukdavo
  // patvirtinimo laiško, kuris niekada neateis (auditas B19).
  if (signUpData.user.identities && signUpData.user.identities.length === 0) {
    return { error: errors.emailAlreadyRegistered, values: echoValues(formData) }
  }

  const serviceClient = createServiceClient()
  // SVARBU: `upsert`, ne `insert`. Migracija 018 trigger'iu jau sukuria
  // user_profiles eilutę (id + pending) iškart po signUp, todėl `insert`
  // su tuo pačiu id meta PK konfliktą ir profesinė info (vardas/telefonas/
  // veiklos tipas) NIEKAD neįsirašydavo. `upsert(onConflict: id)` atnaujina
  // tą trigger'io sukurtą eilutę.
  const { error: profileError } = await serviceClient
    .from('user_profiles')
    .upsert(
      {
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
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    console.error('[register] profile upsert error:', profileError.message)
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

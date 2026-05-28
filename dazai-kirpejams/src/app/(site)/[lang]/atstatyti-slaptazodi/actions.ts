'use server'

import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { buildPasswordResetEmail } from '@/lib/email/auth-templates'
import { checkRateLimit, isHoneypotTriggered } from '@/lib/rate-limit'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export type ResetRequestState = {
  /** Visada `success: true`, nepriklausomai nuo email egzistavimo —
   *  neleidžia atakuotojui patikrinti, ar paskyra egzistuoja. */
  success?: boolean
  error?: string
}

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

export async function requestPasswordResetAction(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const lang = resolveLang(formData.get('lang'))
  const { errors } = await getDictionary(lang)

  if (isHoneypotTriggered(formData)) {
    return { success: true }
  }

  const rawEmail = (formData.get('email') as string | null) ?? ''
  const email = rawEmail.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: errors.loginMissing }
  }

  // Rate-limit: 5 per valandą iš to paties IP. Apsauga nuo email-bombing'o
  // konkrečiam vartotojui (5 atstatymai per valandą — pakanka realiam
  // klientui, bet sustabdo masinį spam'ą).
  const rl = await checkRateLimit({
    action: 'password_reset',
    windowSeconds: 3600,
    max: 5,
  })
  if (!rl.allowed) {
    // Tylus sėkmės atsakas — neleidžia atakuotojui suprasti, kad pasiekė
    // ribą su konkrečiu email.
    return { success: true }
  }

  if (!isSupabaseServerConfigured) {
    console.error('[reset] Supabase service-role nesukonfigūruotas')
    return { success: true }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'

  const admin = createServerClient()

  // generateLink type: 'recovery' — Supabase pats susiranda vartotoją pagal
  // email. Jei email nerastas, error.message bus 'User not found' arba
  // panašiai → tylėdami grąžinam success (account enumeration apsauga).
  // redirectTo nukreipia į mūsų recovery callback'ą, kuris iškeičia code
  // į sesiją ir veda klientą į /naujas-slaptazodis.
  let firstName = ''
  let emailLang: Locale = lang

  try {
    const redirectTo = `${siteUrl}/auth/recovery?lang=${lang}`
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      console.warn(
        '[reset] generateLink (tylėdami):',
        error?.message ?? 'no action_link'
      )
      return { success: true }
    }

    // Pasiimam profilio kalbą + vardą per user.id, kad laiškas eitų ta
    // pačia kalba, kuria klientas užsiregistravo (best-effort).
    if (data.user?.id) {
      try {
        const { data: profile } = await admin
          .from('user_profiles')
          .select('first_name, lang')
          .eq('id', data.user.id)
          .maybeSingle()
        if (profile) {
          firstName = profile.first_name ?? ''
          if (
            profile.lang &&
            (locales as readonly string[]).includes(profile.lang)
          ) {
            emailLang = profile.lang as Locale
          }
        }
      } catch (err) {
        console.error('[reset] profile lookup failed:', err)
      }
    }

    // Recovery link'ą reikia rebuild'inti su tinkama lang query — kad
    // callback'as redirektintų į tą pačią kalbą, kurioje rašysim laišką.
    // (generateLink buvo iškviestas su `lang`, bet profile lang gali skirtis.)
    let resetUrl = data.properties.action_link
    if (emailLang !== lang) {
      try {
        const u = new URL(resetUrl)
        const inner = u.searchParams.get('redirect_to')
        if (inner) {
          const innerUrl = new URL(inner)
          innerUrl.searchParams.set('lang', emailLang)
          u.searchParams.set('redirect_to', innerUrl.toString())
          resetUrl = u.toString()
        }
      } catch (err) {
        console.error('[reset] resetUrl rebuild failed:', err)
      }
    }

    const mail = buildPasswordResetEmail({
      firstName,
      resetUrl,
      lang: emailLang,
      siteUrl,
    })

    await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }).catch((err) => {
      console.error('[reset] sendEmail failed:', err)
    })
  } catch (err) {
    console.error('[reset] generateLink threw:', err)
  }

  return { success: true }
}

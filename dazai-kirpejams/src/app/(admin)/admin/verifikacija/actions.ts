'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import {
  buildWelcomeEmail,
  buildRejectionEmail,
  buildPasswordResetEmail,
} from '@/lib/email/auth-templates'
import { randomUUID } from 'crypto'

const VERIFICATION_BUCKET = 'verification-docs'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
  'https://www.dazaikirpejams.lt'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Admin'as rankiniu būdu prideda naują klientą — sukuria auth vartotoją ir
 * iškart `approved` profilį (kad matytų kainas ir gautų kampanijas). Skirta
 * salonams/kirpėjams, kuriuos onboardinam patys, be self-registracijos.
 *
 * Pasirinktinai išsiunčiama prisijungimo nuoroda (Supabase recovery link),
 * kad klientas pats nusistatytų slaptažodį — tas pats srautas kaip
 * „pamiršau slaptažodį".
 */
export async function createClientAction(formData: FormData): Promise<void> {
  const currentAdmin = await requireAdmin()
  const supabase = createServerClient()

  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  const firstName = ((formData.get('first_name') as string) ?? '').trim()
  const lastName = ((formData.get('last_name') as string) ?? '').trim()
  const salonName = ((formData.get('salon_name') as string) ?? '').trim() || null
  const phone = ((formData.get('phone') as string) ?? '').trim()
  const rawType = ((formData.get('business_type') as string) ?? '').trim()
  const businessType =
    rawType === 'hairdresser' || rawType === 'salon' || rawType === 'other'
      ? rawType
      : null
  const sendInvite = formData.get('send_invite') === 'on'

  if (!isValidEmail(email)) {
    redirect('/admin/verifikacija/naujas?error=invalid-email')
  }

  // 1) Sukuriam auth vartotoją (email patvirtintas, laikinas atsitiktinis slaptažodis)
  const { data: created, error: createErr } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: `${randomUUID()}${randomUUID()}`,
    })

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? ''
    if (/already|registered|exists/i.test(msg)) {
      redirect('/admin/verifikacija/naujas?error=email-exists')
    }
    console.error('[admin/verifikacija] createClient createUser:', msg)
    redirect('/admin/verifikacija/naujas?error=create-failed')
  }

  const userId = created.user.id

  // 2) Įrašom profilį iškart kaip patvirtintą
  const { error: profileErr } = await supabase.from('user_profiles').insert({
    id: userId,
    first_name: firstName,
    last_name: lastName,
    phone,
    salon_name: salonName,
    business_type: businessType,
    lang: 'lt',
    verification_status: 'approved',
    verified_at: new Date().toISOString(),
    verified_by: currentAdmin.id,
  })

  if (profileErr) {
    console.error('[admin/verifikacija] createClient profile:', profileErr.message)
    // Atšaukiam pusiau sukurtą būseną — ištrinam auth vartotoją
    await supabase.auth.admin.deleteUser(userId).catch(() => {})
    redirect('/admin/verifikacija/naujas?error=profile-failed')
  }

  // 3) (Nebūtina) prisijungimo nuoroda — kad klientas nusistatytų slaptažodį.
  // Defensyvu: el. laiško klaida nesugriauna kliento sukūrimo.
  if (sendInvite) {
    try {
      const redirectTo = `${SITE_URL}/auth/recovery?lang=lt`
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      })
      const resetUrl = linkData?.properties?.action_link
      if (resetUrl) {
        const mail = buildPasswordResetEmail({
          firstName,
          resetUrl,
          lang: 'lt',
          siteUrl: SITE_URL,
        })
        await sendEmail({
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        })
      }
    } catch (err) {
      console.error(
        '[admin/verifikacija] createClient invite email failed (non-blocking):',
        err
      )
    }
  }

  revalidatePath('/admin/verifikacija')
  revalidatePath('/', 'layout')
  redirect('/admin/verifikacija?created=1')
}

/**
 * Saugiai konvertuoja `user_profiles.lang` reikšmę į palaikomą locale.
 * NULL / nežinomos reikšmės → 'lt' (numatytasis). Apsauga nuo netinkamo
 * stulpelio turinio el. laiško builder'iuose.
 */
function resolveProfileLang(
  raw: string | null | undefined
): 'lt' | 'en' | 'ru' {
  return raw === 'en' || raw === 'ru' ? raw : 'lt'
}

/**
 * Ištraukia storage PATH'ą iš DB įrašo. Senieji įrašai (prieš bug fix'ą)
 * saugojo `getPublicUrl()` rezultatą — tokiu atveju ištraukiam path'ą iš
 * URL'o. Nauji įrašai saugo vien path'ą.
 */
function extractStoragePath(stored: string): string {
  if (!stored.startsWith('http')) return stored
  const marker = `/${VERIFICATION_BUCKET}/`
  const idx = stored.indexOf(marker)
  if (idx === -1) return stored
  return stored.slice(idx + marker.length).split('?')[0]
}

/**
 * Patvirtina vartotoją — keičia statusą į `approved`, įrašo kas ir kada
 * patvirtino. Nuo šiol vartotojas mato kainas ir gali pirkti.
 */
export async function approveUserAction(formData: FormData): Promise<void> {
  const currentAdmin = await requireAdmin()
  const supabase = createServerClient()

  const userId = (formData.get('id') as string) ?? ''
  if (!userId) redirect('/admin/verifikacija?error=invalid-id')

  const { error } = await supabase
    .from('user_profiles')
    .update({
      verification_status: 'approved',
      rejection_reason: null,
      verified_at: new Date().toISOString(),
      verified_by: currentAdmin.id,
    })
    .eq('id', userId)

  if (error) {
    console.error('[admin/verifikacija/actions] approve:', error.message)
    redirect('/admin/verifikacija?error=update-failed')
  }

  // „Patvirtinta — kainos atvertos" laiškas siunčiamas ČIA (po admin
  // patvirtinimo), o ne registracijos metu. Defensyvu: el. laiško klaida
  // nesugriauna patvirtinimo srauto.
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, lang')
      .eq('id', userId)
      .maybeSingle<{ first_name: string | null; lang: string | null }>()
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email
    if (email) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
        'https://www.dazaikirpejams.lt'
      const lang = resolveProfileLang(profile?.lang)
      const welcome = buildWelcomeEmail({
        firstName: profile?.first_name ?? '',
        lang,
        siteUrl,
      })
      await sendEmail({
        to: email,
        subject: welcome.subject,
        html: welcome.html,
        text: welcome.text,
      })
    }
  } catch (err) {
    console.error(
      '[admin/verifikacija/actions] approve welcome email failed (non-blocking):',
      err
    )
  }

  revalidatePath('/admin/verifikacija')
  // Kliento /paskyra ir produktų puslapiai rodo kainas tik patvirtintiems —
  // būtina išvalyti jų data cache, kad statusas ir kainos atsinaujintų.
  revalidatePath('/', 'layout')
}

/**
 * Grąžina 1 val. galiojantį signed URL'ą, kad admin'as galėtų peržiūrėti
 * privataus bucket'o dokumentą. Kviečiamas iš VerificationTable formos.
 */
export async function viewVerificationDocumentAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const userId = (formData.get('id') as string) ?? ''
  if (!userId) redirect('/admin/verifikacija?error=invalid-id')

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('verification_document_url')
    .eq('id', userId)
    .maybeSingle<{ verification_document_url: string | null }>()

  if (error || !profile?.verification_document_url) {
    console.error('[admin/verifikacija/actions] viewDoc: no document for', userId)
    redirect('/admin/verifikacija?error=no-document')
  }

  const path = extractStoragePath(profile.verification_document_url)
  const { data: signed, error: signErr } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .createSignedUrl(path, 60 * 60)

  if (signErr || !signed?.signedUrl) {
    console.error(
      '[admin/verifikacija/actions] viewDoc: signed URL failed',
      signErr?.message
    )
    redirect('/admin/verifikacija?error=signed-url-failed')
  }

  redirect(signed.signedUrl)
}

/**
 * Atmeta vartotoją — keičia statusą į `rejected` su priežastimi.
 * Vartotojas gauna pranešimą (ateityje — email), kad gali pateikti
 * naują dokumentą.
 */
export type RejectUserState = {
  error?: string
  success?: boolean
}

export async function rejectUserAction(
  _prev: RejectUserState,
  formData: FormData
): Promise<RejectUserState> {
  await requireAdmin()
  const supabase = createServerClient()

  const userId = (formData.get('id') as string) ?? ''
  const reason = ((formData.get('reason') as string) ?? '').trim()

  if (!userId) {
    return { error: 'Trūksta vartotojo ID.' }
  }
  if (!reason) {
    return { error: 'Nurodykite atmetimo priežastį.' }
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({
      verification_status: 'rejected',
      rejection_reason: reason,
      verified_at: null,
      verified_by: null,
    })
    .eq('id', userId)

  if (error) {
    console.error('[admin/verifikacija/actions] reject:', error.message)
    return { error: `Nepavyko atmesti: ${error.message}` }
  }

  // Atmetimo laiškas klientui — kad žinotų statusą ir priežastį. Veidrodis
  // approveUserAction'o el. laiško srautui: defensyvu, klaida non-blocking.
  // Be šio laiško klientas net nesužinotų, kad buvo atmestas.
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, lang')
      .eq('id', userId)
      .maybeSingle<{ first_name: string | null; lang: string | null }>()
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email
    if (email) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
        'https://www.dazaikirpejams.lt'
      const lang = resolveProfileLang(profile?.lang)
      const rejection = buildRejectionEmail({
        firstName: profile?.first_name ?? '',
        reason,
        lang,
        siteUrl,
      })
      await sendEmail({
        to: email,
        subject: rejection.subject,
        html: rejection.html,
        text: rejection.text,
      })
    }
  } catch (err) {
    console.error(
      '[admin/verifikacija/actions] reject email failed (non-blocking):',
      err
    )
  }

  revalidatePath('/admin/verifikacija')
  revalidatePath('/', 'layout')
  return { success: true }
}

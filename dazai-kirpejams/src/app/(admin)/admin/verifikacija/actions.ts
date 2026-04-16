'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

const VERIFICATION_BUCKET = 'verification-docs'

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

  revalidatePath('/admin/verifikacija')
  revalidatePath('/', 'layout')
  return { success: true }
}

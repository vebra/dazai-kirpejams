'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

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
  return { success: true }
}

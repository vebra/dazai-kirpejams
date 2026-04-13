'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'

export type UploadDocState = {
  error?: string
  success?: boolean
}

/**
 * Upload verification document.
 * The file is uploaded to Supabase Storage `verification-docs/{userId}/` bucket,
 * then the URL is saved to user_profiles.verification_document_url.
 */
export async function uploadDocumentAction(
  _prev: UploadDocState,
  formData: FormData
): Promise<UploadDocState> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Turite būti prisijungę.' }

  const file = formData.get('document') as File | null
  if (!file || file.size === 0) {
    return { error: 'Pasirinkite failą.' }
  }

  // Validate file
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Leidžiami formatai: JPG, PNG, WebP, PDF.' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'Failas per didelis. Maksimalus dydis — 10 MB.' }
  }

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${user.id}/document.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('verification-docs')
    .upload(path, file, { upsert: true })

  if (uploadError) {
    console.error('[upload-doc] storage error:', uploadError.message)
    return { error: 'Nepavyko įkelti failo. Bandykite dar kartą.' }
  }

  // Get public/signed URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('verification-docs').getPublicUrl(path)

  // Update profile
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ verification_document_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('[upload-doc] profile update error:', updateError.message)
    return { error: 'Failas įkeltas, bet nepavyko atnaujinti profilio.' }
  }

  revalidatePath('/paskyra', 'page')
  return { success: true }
}

export async function logoutAction(): Promise<never> {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/lt')
}

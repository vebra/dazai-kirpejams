'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient } from '@/lib/supabase/server'
import { getInvoiceSignedUrl } from '@/lib/invoices/queries'

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

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('verification-docs')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error(
      '[upload-doc] storage error:',
      uploadError.message,
      uploadError
    )
    return { error: 'Nepavyko įkelti failo. Bandykite dar kartą.' }
  }

  // verification-docs bucket'as privatus (migration 010). Saugome storage
  // PATH'ą (ne publicUrl), nes privataus bucket'o public URL'as negalioja.
  // Admin'as gauna signed URL on-demand per viewVerificationDocumentAction.
  const profilePayload = {
    id: user.id,
    verification_document_url: path,
    verification_status: 'pending' as const,
  }

  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(profilePayload, { onConflict: 'id' })

  if (upsertError) {
    console.error('[upload-doc] profile upsert error:', upsertError.message)
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

/**
 * Kliento sąskaitos parsisiuntimas. Saugumas:
 *   1. Vartotojas turi būti prisijungęs (auth user.email).
 *   2. Sąskaita per `orders` turi priklausyti tam pačiam email'ui.
 * Jei abu praeina — generuojam 1 val. galiojantį signed URL ir redirect'inam.
 *
 * Naudojam service role klientą sąskaitos tikrinimui, nes `invoices` lentelė
 * neturi RLS, tačiau prieš tai patys patikrinom ownership per email.
 */
export async function downloadCustomerInvoiceAction(
  formData: FormData
): Promise<void> {
  const sessionClient = await createServerSupabase()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  if (!user || !user.email) {
    redirect('/lt/prisijungimas')
  }

  const langRaw = formData.get('lang')
  const lang = typeof langRaw === 'string' && langRaw.length > 0 ? langRaw : 'lt'
  const accountUrl = `/${lang}/paskyra`

  const invoiceId = formData.get('invoice_id')
  if (typeof invoiceId !== 'string' || invoiceId.length === 0) {
    redirect(`${accountUrl}?error=invalid-invoice`)
  }

  const admin = createServerClient()
  const { data: inv, error } = await admin
    .from('invoices')
    .select('pdf_path, orders!inner(email)')
    .eq('id', invoiceId)
    .maybeSingle<{
      pdf_path: string | null
      orders: { email: string } | { email: string }[]
    }>()

  if (error || !inv) {
    console.error('[paskyra/actions] download: invoice lookup failed', error?.message)
    redirect(`${accountUrl}?error=invoice-not-found`)
  }

  const ownerEmail = Array.isArray(inv.orders) ? inv.orders[0]?.email : inv.orders?.email
  if (!ownerEmail || ownerEmail.toLowerCase() !== user.email.toLowerCase()) {
    redirect(`${accountUrl}?error=forbidden`)
  }

  if (!inv.pdf_path) {
    redirect(`${accountUrl}?error=no-pdf`)
  }

  const url = await getInvoiceSignedUrl(inv.pdf_path)
  if (!url) {
    redirect(`${accountUrl}?error=signed-url-failed`)
  }

  redirect(url)
}

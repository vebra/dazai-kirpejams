'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient } from '@/lib/supabase/server'
import { getInvoiceSignedUrl } from '@/lib/invoices/queries'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

export type UploadDocState = {
  error?: string
  success?: boolean
}

function resolveLang(raw: FormDataEntryValue | null): Locale {
  if (typeof raw === 'string' && (locales as readonly string[]).includes(raw)) {
    return raw as Locale
  }
  return defaultLocale
}

export async function uploadDocumentAction(
  _prev: UploadDocState,
  formData: FormData
): Promise<UploadDocState> {
  const lang = resolveLang(formData.get('lang'))
  const { errors } = await getDictionary(lang)

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: errors.mustBeLoggedIn }

  const file = formData.get('document') as File | null
  if (!file || file.size === 0) {
    return { error: errors.selectFile }
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]
  if (!allowedTypes.includes(file.type)) {
    return { error: errors.allowedFormats }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: errors.fileTooLarge }
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
    return { error: errors.uploadFailed }
  }

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
    return { error: errors.profileUpdateFailed }
  }

  revalidatePath('/paskyra', 'page')
  return { success: true }
}

export async function logoutAction(formData: FormData): Promise<never> {
  const lang = resolveLang(formData.get('lang'))
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect(`/${lang}`)
}

export async function downloadCustomerInvoiceAction(
  formData: FormData
): Promise<void> {
  const sessionClient = await createServerSupabase()
  const {
    data: { user },
  } = await sessionClient.auth.getUser()

  const langRaw = formData.get('lang')
  const lang = typeof langRaw === 'string' && langRaw.length > 0 ? langRaw : 'lt'

  if (!user || !user.email) {
    redirect(`/${lang}/prisijungimas`)
  }

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

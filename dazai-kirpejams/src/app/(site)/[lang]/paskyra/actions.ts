'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { createServerClient } from '@/lib/supabase/server'
import { getInvoiceSignedUrl } from '@/lib/invoices/queries'
import { locales, type Locale, defaultLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  updateProfileSchema,
  formDataToObject,
} from '@/lib/validation/auth-schemas'
import { getEffectivePriceCents } from '@/lib/types'

export type UploadDocState = {
  error?: string
  success?: boolean
}

export type UpdateProfileState = {
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

  // Rate-limit dokumentų įkėlimui — net su prisijungimu, sukompromituota
  // sesija galėtų užmaišyti storage'ą. 5 įkėlimai per valandą realiam
  // vartotojui pakanka (paprastai įkelia 1-2 kartus).
  const rl = await checkRateLimit({
    action: 'upload-document',
    windowSeconds: 3600,
    max: 5,
  })
  if (!rl.allowed) {
    return { error: errors.uploadFailed }
  }

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

export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  // `_form_lang` — puslapio kalba klaidos pranešimui. `lang` lieka
  // formData'oje schemos validacijai (email pranešimų kalbos pasirinkimas).
  const lang = resolveLang(formData.get('_form_lang'))
  const { errors } = await getDictionary(lang)

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: errors.mustBeLoggedIn }

  // Rate-limit: 20 per valandą pakanka realiam vartotojui (kelis kartus
  // pakeisti telefoną ar adresą), bet sustabdo masinį spam'inimą.
  const rl = await checkRateLimit({
    action: 'update-profile',
    windowSeconds: 3600,
    max: 20,
  })
  if (!rl.allowed) {
    return { error: errors.uploadFailed }
  }

  const parsed = updateProfileSchema.safeParse(formDataToObject(formData))
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    const key = firstIssue?.message as keyof typeof errors
    return { error: errors[key] ?? errors.profileUpdateFailed }
  }

  const {
    first_name,
    last_name,
    phone,
    city,
    salon_name,
    company_code,
    daily_dyes_count,
    lang: preferredLang,
  } = parsed.data

  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      first_name,
      last_name,
      phone,
      city: city || null,
      salon_name: salon_name || null,
      company_code: company_code || null,
      daily_dyes_count: daily_dyes_count || null,
      lang: preferredLang,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('[paskyra/actions] updateProfile:', updateError.message)
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

// ============================================
// Pakartoti užsakymą (Reorder) → krepšelis
// ============================================

export type ReorderItem = {
  productId: string
  slug: string
  categorySlug: string
  sku: string | null
  name: string
  priceCents: number
  volumeMl: number | null
  imageUrl: string | null
  colorHex: string | null
  colorNumber: string | null
  quantity: number
}

export type ReorderResult =
  | { ok: true; items: ReorderItem[]; unavailable: string[] }
  | { ok: false; error: string }

/**
 * Surenka esamus (dabartinius) produktus pagal seno užsakymo prekes, kad
 * klientas galėtų vienu paspaudimu sudėti juos į krepšelį. Naudoja DABARTINES
 * kainas ir praleidžia nebeaktyvius / išparduotus produktus (juos grąžina
 * `unavailable` sąraše). Savininkystė tikrinama pagal el. paštą.
 */
export async function reorderToCart(
  orderId: string,
  lang: Locale
): Promise<ReorderResult> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Prisijunkite.' }

  const admin = createServerClient()

  const { data: order } = await admin
    .from('orders')
    .select('id, email')
    .eq('id', orderId)
    .maybeSingle<{ id: string; email: string | null }>()
  if (
    !order ||
    (order.email ?? '').toLowerCase() !== (user.email ?? '').toLowerCase()
  ) {
    return { ok: false, error: 'Užsakymas nerastas.' }
  }

  const { data: items } = await admin
    .from('order_items')
    .select('product_id, quantity, product_name')
    .eq('order_id', orderId)
  if (!items || items.length === 0) {
    return { ok: false, error: 'Užsakyme nėra prekių.' }
  }

  const ids = items
    .map((i) => i.product_id)
    .filter((x): x is string => typeof x === 'string')

  let products: Array<Record<string, unknown>> = []
  if (ids.length > 0) {
    const { data } = await admin
      .from('products')
      .select(
        'id, slug, sku, name_lt, name_en, name_ru, price_cents, sale_price_cents, volume_ml, image_urls, color_hex, color_number, is_active, stock_quantity, category:categories(slug)'
      )
      .in('id', ids)
    products = (data as Array<Record<string, unknown>>) ?? []
  }
  const pMap = new Map(products.map((p) => [p.id as string, p]))

  const cart: ReorderItem[] = []
  const unavailable: string[] = []
  for (const it of items) {
    const p = it.product_id ? pMap.get(it.product_id) : undefined
    const active = p?.is_active === true
    const inStock = ((p?.stock_quantity as number) ?? 0) > 0
    if (!p || !active || !inStock) {
      unavailable.push((it.product_name as string) ?? '—')
      continue
    }
    const name =
      lang === 'en'
        ? (p.name_en as string)
        : lang === 'ru'
          ? (p.name_ru as string)
          : (p.name_lt as string)
    const imgs = p.image_urls as string[] | null
    const cat = p.category as { slug: string } | null
    cart.push({
      productId: p.id as string,
      slug: p.slug as string,
      categorySlug: cat?.slug ?? '',
      sku: (p.sku as string) ?? null,
      name,
      // Akcijos kaina, jei aktyvi — kaip ProductCard/krepšelis, kad
      // pakartotas užsakymas per akciją nebūtų pilna kaina.
      priceCents: getEffectivePriceCents({
        price_cents: p.price_cents as number,
        sale_price_cents: (p.sale_price_cents as number | null) ?? null,
      }),
      volumeMl: (p.volume_ml as number) ?? null,
      imageUrl: Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null,
      colorHex: (p.color_hex as string) ?? null,
      colorNumber: (p.color_number as string) ?? null,
      quantity: (it.quantity as number) ?? 1,
    })
  }

  if (cart.length === 0) {
    return { ok: false, error: 'Šių prekių nebėra parduotuvėje.' }
  }
  return { ok: true, items: cart, unavailable }
}

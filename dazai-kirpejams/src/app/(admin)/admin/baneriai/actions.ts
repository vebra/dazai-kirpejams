'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

export type BannerFormState = {
  error?: string
  success?: boolean
}

// Banerių nuotraukos — viešas „products" bucket'as su `banners/` prefiksu (kad
// nereikėtų atskiro bucket'o). Tie patys leidžiami formatai kaip produktams.
const BANNER_BUCKET = 'products'
const BANNER_MAX = 10 * 1024 * 1024
const BANNER_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])

export async function saveBannerAction(
  _prev: BannerFormState,
  formData: FormData
): Promise<BannerFormState> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) || null
  const placement = (formData.get('placement') as string) || 'hero'

  const titleLt = (formData.get('title_lt') as string)?.trim() ?? ''
  const titleEn = (formData.get('title_en') as string)?.trim() ?? ''
  const titleRu = (formData.get('title_ru') as string)?.trim() ?? ''

  if (!titleLt && !titleEn) {
    return { error: 'Reikia bent vieno pavadinimo (LT arba EN).' }
  }

  // Nuotrauka: jei įkeltas failas — į Storage; kitaip naudojam URL lauką.
  let imageUrl = (formData.get('image_url') as string)?.trim() || null
  const file = formData.get('image_file')
  if (file instanceof File && file.size > 0) {
    if (file.size > BANNER_MAX) {
      return { error: 'Nuotrauka per didelė (max 10 MB).' }
    }
    if (!BANNER_MIME.has(file.type)) {
      return { error: 'Netinkamas nuotraukos formatas (JPG, PNG, WebP, AVIF).' }
    }
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const path = `banners/${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabase.storage
      .from(BANNER_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true })
    if (upErr) {
      console.error('[admin/baneriai/actions] image upload:', upErr.message)
      return { error: 'Nepavyko įkelti nuotraukos.' }
    }
    imageUrl = supabase.storage.from(BANNER_BUCKET).getPublicUrl(path).data.publicUrl
  }

  const row = {
    placement,
    title_lt: titleLt || titleEn,
    title_en: titleEn || titleLt,
    title_ru: titleRu || titleLt,
    subtitle_lt: (formData.get('subtitle_lt') as string)?.trim() || null,
    subtitle_en: (formData.get('subtitle_en') as string)?.trim() || null,
    subtitle_ru: (formData.get('subtitle_ru') as string)?.trim() || null,
    badge_lt: (formData.get('badge_lt') as string)?.trim() || null,
    badge_en: (formData.get('badge_en') as string)?.trim() || null,
    badge_ru: (formData.get('badge_ru') as string)?.trim() || null,
    cta_text_lt: (formData.get('cta_text_lt') as string)?.trim() || null,
    cta_text_en: (formData.get('cta_text_en') as string)?.trim() || null,
    cta_text_ru: (formData.get('cta_text_ru') as string)?.trim() || null,
    cta_url: (formData.get('cta_url') as string)?.trim() || null,
    cta_secondary_text_lt:
      (formData.get('cta_secondary_text_lt') as string)?.trim() || null,
    cta_secondary_text_en:
      (formData.get('cta_secondary_text_en') as string)?.trim() || null,
    cta_secondary_text_ru:
      (formData.get('cta_secondary_text_ru') as string)?.trim() || null,
    cta_secondary_url:
      (formData.get('cta_secondary_url') as string)?.trim() || null,
    image_url: imageUrl,
    background_color:
      (formData.get('background_color') as string)?.trim() || null,
    sort_order: parseInt((formData.get('sort_order') as string) || '0', 10),
    is_active: formData.get('is_active') === 'true',
    starts_at: (formData.get('starts_at') as string)?.trim() || null,
    ends_at: (formData.get('ends_at') as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase
      .from('banners')
      .update(row)
      .eq('id', id)
    if (error) {
      console.error('[admin/baneriai/actions] update:', error.message)
      return { error: `Klaida atnaujinant: ${error.message}` }
    }
  } else {
    const { error } = await supabase.from('banners').insert(row)
    if (error) {
      console.error('[admin/baneriai/actions] insert:', error.message)
      return { error: `Klaida kuriant: ${error.message}` }
    }
  }

  revalidatePath('/admin/baneriai')
  revalidatePath('/lt')
  revalidatePath('/en')
  revalidatePath('/ru')
  revalidateTag('banners', 'max')

  return { success: true }
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/baneriai?error=invalid-id')

  const { error } = await supabase.from('banners').delete().eq('id', id)

  if (error) {
    console.error('[admin/baneriai/actions] delete:', error.message)
    redirect('/admin/baneriai?error=delete-failed')
  }

  revalidatePath('/admin/baneriai')
  revalidatePath('/lt')
  revalidatePath('/en')
  revalidatePath('/ru')
  revalidateTag('banners', 'max')
  redirect('/admin/baneriai')
}

export async function toggleBannerActiveAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  const activate = formData.get('activate') === 'true'

  if (!id) return

  const { error } = await supabase
    .from('banners')
    .update({
      is_active: activate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/baneriai/actions] toggle:', error.message)
  }

  revalidatePath('/admin/baneriai')
  revalidatePath('/lt')
  revalidatePath('/en')
  revalidatePath('/ru')
  revalidateTag('banners', 'max')
}

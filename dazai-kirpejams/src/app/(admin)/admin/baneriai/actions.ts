'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

export type BannerFormState = {
  error?: string
  success?: boolean
}

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
    image_url: (formData.get('image_url') as string)?.trim() || null,
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

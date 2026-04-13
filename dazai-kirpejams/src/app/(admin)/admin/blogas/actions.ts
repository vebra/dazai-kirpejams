'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąčęėįšųūž]/g, (c) => {
      const map: Record<string, string> = {
        ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i',
        š: 's', ų: 'u', ū: 'u', ž: 'z',
      }
      return map[c] ?? c
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export type BlogFormState = {
  error?: string
  success?: boolean
}

export async function saveBlogPostAction(
  _prev: BlogFormState,
  formData: FormData
): Promise<BlogFormState> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) || null
  const titleLt = (formData.get('title_lt') as string)?.trim() ?? ''
  const titleEn = (formData.get('title_en') as string)?.trim() ?? ''
  const titleRu = (formData.get('title_ru') as string)?.trim() ?? ''
  const excerptLt = (formData.get('excerpt_lt') as string)?.trim() || null
  const excerptEn = (formData.get('excerpt_en') as string)?.trim() || null
  const excerptRu = (formData.get('excerpt_ru') as string)?.trim() || null
  const contentLt = (formData.get('content_lt') as string)?.trim() || null
  const contentEn = (formData.get('content_en') as string)?.trim() || null
  const contentRu = (formData.get('content_ru') as string)?.trim() || null
  const coverImageUrl =
    (formData.get('cover_image_url') as string)?.trim() || null
  const author = (formData.get('author') as string)?.trim() || null
  const category = (formData.get('category') as string)?.trim() || null
  const isPublished = formData.get('is_published') === 'true'
  const slug =
    (formData.get('slug') as string)?.trim() || slugify(titleLt || titleEn)

  if (!titleLt && !titleEn) {
    return { error: 'Reikia bent vieno pavadinimo (LT arba EN).' }
  }

  if (!slug) {
    return { error: 'Slug yra privalomas.' }
  }

  const row = {
    slug,
    title_lt: titleLt || titleEn,
    title_en: titleEn || titleLt,
    title_ru: titleRu || titleLt,
    excerpt_lt: excerptLt,
    excerpt_en: excerptEn,
    excerpt_ru: excerptRu,
    content_lt: contentLt,
    content_en: contentEn,
    content_ru: contentRu,
    cover_image_url: coverImageUrl,
    author,
    category,
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await supabase
      .from('blog_posts')
      .update(row)
      .eq('id', id)
    if (error) {
      console.error('[admin/blogas/actions] update:', error.message)
      return { error: `Klaida atnaujinant: ${error.message}` }
    }
  } else {
    const { error } = await supabase.from('blog_posts').insert(row)
    if (error) {
      console.error('[admin/blogas/actions] insert:', error.message)
      return { error: `Klaida kuriant: ${error.message}` }
    }
  }

  revalidatePath('/admin/blogas')
  revalidatePath('/lt/blogas')
  revalidatePath('/en/blogas')
  revalidatePath('/ru/blogas')

  return { success: true }
}

export async function deleteBlogPostAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/blogas?error=invalid-id')

  const { error } = await supabase.from('blog_posts').delete().eq('id', id)

  if (error) {
    console.error('[admin/blogas/actions] delete:', error.message)
    redirect('/admin/blogas?error=delete-failed')
  }

  revalidatePath('/admin/blogas')
  revalidatePath('/lt/blogas')
  revalidatePath('/en/blogas')
  revalidatePath('/ru/blogas')
  redirect('/admin/blogas')
}

export async function togglePublishAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  const publish = formData.get('publish') === 'true'

  if (!id) redirect('/admin/blogas?error=invalid-id')

  const { error } = await supabase
    .from('blog_posts')
    .update({
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/blogas/actions] togglePublish:', error.message)
  }

  revalidatePath('/admin/blogas')
  revalidatePath('/lt/blogas')
  revalidatePath('/en/blogas')
  revalidatePath('/ru/blogas')
}

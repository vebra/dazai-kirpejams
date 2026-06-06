'use server'

import { randomUUID } from 'crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

const BUCKET = 'downloads'
const MAX_SIZE = 25 * 1024 * 1024 // 25 MB

export type DownloadFormState = { error?: string; success?: boolean }

function safeName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'failas'
  )
}

export async function createDownloadAction(
  _prev: DownloadFormState,
  formData: FormData
): Promise<DownloadFormState> {
  await requireAdmin()
  const supabase = createServerClient()

  const title = ((formData.get('title') as string) ?? '').trim()
  if (!title) return { error: 'Įveskite pavadinimą.' }

  const description = ((formData.get('description') as string) ?? '').trim() || null
  const visibility =
    (formData.get('visibility') as string) === 'pro' ? 'pro' : 'public'
  const sortOrder = Number((formData.get('sort_order') as string) ?? '0') || 0

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Pasirinkite failą.' }
  }
  if (file.size > MAX_SIZE) {
    return { error: 'Failas per didelis (max 25 MB).' }
  }

  const path = `${randomUUID()}-${safeName(file.name)}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
  if (upErr) {
    console.error('[admin/atsisiuntimai] upload:', upErr.message)
    return { error: 'Nepavyko įkelti failo.' }
  }

  const { error } = await supabase.from('downloads').insert({
    title,
    description,
    file_path: path,
    file_name: file.name,
    file_size_bytes: file.size,
    visibility,
    sort_order: sortOrder,
    is_active: true,
  })
  if (error) {
    console.error('[admin/atsisiuntimai] insert:', error.message)
    // Bandom išvalyti įkeltą failą, kad neliktų našlaičio
    await supabase.storage.from(BUCKET).remove([path])
    return { error: `Nepavyko išsaugoti: ${error.message}` }
  }

  revalidatePath('/admin/atsisiuntimai')
  revalidateTag('downloads', 'max')
  return { success: true }
}

export async function toggleDownloadAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()
  const id = formData.get('id') as string
  const nextActive = formData.get('next_active') === 'true'
  if (!id) redirect('/admin/atsisiuntimai?error=invalid')

  const { error } = await supabase
    .from('downloads')
    .update({ is_active: nextActive })
    .eq('id', id)
  if (error) console.error('[admin/atsisiuntimai] toggle:', error.message)

  revalidatePath('/admin/atsisiuntimai')
  revalidateTag('downloads', 'max')
}

export async function deleteDownloadAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()
  const id = formData.get('id') as string
  if (!id) redirect('/admin/atsisiuntimai?error=invalid')

  const { data: row } = await supabase
    .from('downloads')
    .select('file_path')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('downloads').delete().eq('id', id)
  if (error) {
    console.error('[admin/atsisiuntimai] delete:', error.message)
  } else if (row?.file_path) {
    await supabase.storage.from(BUCKET).remove([row.file_path])
  }

  revalidatePath('/admin/atsisiuntimai')
  revalidateTag('downloads', 'max')
}

'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'

export async function deleteSubscriberAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const id = (formData.get('id') as string) ?? ''
  if (!id) return

  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/naujienlaiskiai] delete:', error.message)
  }

  revalidatePath('/admin/naujienlaiskiai')
}

export async function toggleSubscriberAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = await createServerSupabase()

  const id = (formData.get('id') as string) ?? ''
  const activate = formData.get('activate') === 'true'

  if (!id) return

  const update: Record<string, unknown> = {
    is_active: activate,
  }
  if (!activate) {
    update.unsubscribed_at = new Date().toISOString()
  } else {
    update.unsubscribed_at = null
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update(update)
    .eq('id', id)

  if (error) {
    console.error('[admin/naujienlaiskiai] toggle:', error.message)
  }

  revalidatePath('/admin/naujienlaiskiai')
}

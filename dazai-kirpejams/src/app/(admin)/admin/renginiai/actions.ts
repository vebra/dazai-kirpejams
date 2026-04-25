'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

const VALID_STATUSES = [
  'confirmed',
  'cancelled',
  'attended',
  'no_show',
] as const

export async function updateEventRegistrationStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  const status = (formData.get('status') as string) ?? ''

  if (!id) redirect('/admin/renginiai?error=invalid-id')
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    redirect('/admin/renginiai?error=invalid-status')
  }

  const { error } = await supabase
    .from('event_registrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/renginiai/actions] updateStatus:', error.message)
    redirect('/admin/renginiai?error=update-failed')
  }

  revalidatePath('/admin/renginiai')
}

export async function deleteEventRegistrationAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/renginiai?error=invalid-id')

  const { error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[admin/renginiai/actions] delete:', error.message)
    redirect('/admin/renginiai?error=delete-failed')
  }

  revalidatePath('/admin/renginiai')
}

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'

const VALID_STATUSES = ['new', 'contacted', 'converted', 'closed'] as const

export async function updateB2bInquiryStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  const status = (formData.get('status') as string) ?? ''

  if (!id) redirect('/admin/b2b?error=invalid-id')
  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    redirect('/admin/b2b?error=invalid-status')
  }

  const { error } = await supabase
    .from('b2b_inquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[admin/b2b/actions] updateStatus:', error.message)
    redirect('/admin/b2b?error=update-failed')
  }

  revalidatePath('/admin/b2b')
}

export async function deleteB2bInquiryAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = (formData.get('id') as string) ?? ''
  if (!id) redirect('/admin/b2b?error=invalid-id')

  const { error } = await supabase.from('b2b_inquiries').delete().eq('id', id)

  if (error) {
    console.error('[admin/b2b/actions] delete:', error.message)
    redirect('/admin/b2b?error=delete-failed')
  }

  revalidatePath('/admin/b2b')
}

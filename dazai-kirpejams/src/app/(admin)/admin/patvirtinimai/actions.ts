'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerSupabase } from '@/lib/supabase/ssr'

/**
 * Vadybininkės užsakymų patvirtinimo Server Action'ai.
 *
 * SVARBU: kviečiam per `createServerSupabase()` (admin SESIJOS klientą), NE per
 * service-role. RPC viduje `is_admin()` tikrina `auth.uid()` — service-role
 * klientui jis būtų NULL → NOT_ADMIN. Sesijos klientui auth.uid() = admin'as.
 *
 * Action'ai GRĄŽINA rezultatą (ne redirect), kad klientas galėtų parodyti
 * klaidą inline (pvz. „sandėlyje per mažai" approve metu) ir refetch'inti.
 */

export type ApprovalResult = { ok: boolean; error?: string }

/** RPC klaidų žinutės → suprantamas LT tekstas admin'ui. */
function humanError(raw: string | undefined): string {
  const msg = raw ?? 'Nežinoma klaida.'
  if (/NOT_ADMIN/.test(msg)) return 'Neturite administratoriaus teisių.'
  if (/NOT_PENDING/.test(msg))
    return 'Užsakymas jau apdorotas (nebėra „laukiantis"). Atnaujinkite sąrašą.'
  if (/ORDER_NOT_FOUND/.test(msg)) return 'Užsakymas nerastas.'
  // decrement_stock_for_order trūkstamo sandėlio klaida
  if (/stock|sandėl|insufficient|quantity/i.test(msg))
    return 'Sandėlyje per mažai prekių — negalima patvirtinti. Papildykite sandėlį arba atmeskite užsakymą.'
  return msg
}

export async function approveRepOrder(orderId: string): Promise<ApprovalResult> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Trūksta užsakymo ID.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('approve_rep_order', { p_order_id: orderId })

  if (error) {
    console.error('[admin/patvirtinimai] approve:', error.message)
    return { ok: false, error: humanError(error.message) }
  }

  revalidatePath('/admin/patvirtinimai')
  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  return { ok: true }
}

export async function rejectRepOrder(
  orderId: string,
  reason: string
): Promise<ApprovalResult> {
  await requireAdmin()
  if (!orderId) return { ok: false, error: 'Trūksta užsakymo ID.' }

  const trimmed = (reason ?? '').trim()
  if (trimmed.length === 0)
    return { ok: false, error: 'Nurodykite atmetimo priežastį.' }

  const supabase = await createServerSupabase()
  const { error } = await supabase.rpc('reject_rep_order', {
    p_order_id: orderId,
    p_reason: trimmed,
  })

  if (error) {
    console.error('[admin/patvirtinimai] reject:', error.message)
    return { ok: false, error: humanError(error.message) }
  }

  revalidatePath('/admin/patvirtinimai')
  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  return { ok: true }
}

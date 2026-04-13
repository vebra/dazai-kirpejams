'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/admin/queries'
import { sendEmail } from '@/lib/email/resend'
import { buildStatusChangeEmail } from '@/lib/email/templates'

/**
 * Užsakymo administravimo Server Action'ai.
 *
 * Visi pradeda nuo `requireAdmin()`, po to atnaujina DB per RLS'ą, ir
 * revalidate'ina tiek sąrašo, tiek apžvalgos puslapius. Naudojam `redirect`
 * klaidai grąžinti, nes šie action'ai kviečiami iš tiesioginių `<form>` be
 * `useActionState` (paprasti <button>'ai su hidden input'ais).
 */

function isValidStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === 'string' &&
    (ORDER_STATUSES as readonly string[]).includes(value)
  )
}

// ============================================
// Būsenos keitimas
// ============================================

export async function updateOrderStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string | null
  const status = formData.get('status')

  if (!id) redirect('/admin/uzsakymai?error=invalid-id')
  if (!isValidStatus(status)) {
    redirect(`/admin/uzsakymai/${id}?error=invalid-status`)
  }

  // Jei statusas shipped arba cancelled — reiks siųsti email, todėl
  // pirmiausia paimam užsakymo duomenis
  const shouldEmail = status === 'shipped' || status === 'cancelled'
  let orderData: {
    order_number: string
    email: string
    first_name: string
    tracking_number: string | null
    tracking_carrier: string | null
  } | null = null

  if (shouldEmail) {
    const { data } = await supabase
      .from('orders')
      .select('order_number, email, first_name, tracking_number, tracking_carrier')
      .eq('id', id)
      .maybeSingle()
    orderData = data
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/uzsakymai/actions] updateStatus:', error.message)
    redirect(`/admin/uzsakymai/${id}?error=update-failed`)
  }

  // Siunčiam email klientui (non-blocking — jei nepavyks, statusas vis tiek
  // jau pakeistas)
  if (shouldEmail && orderData) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'https://www.dazaikirpejams.lt'

    try {
      const emailPayload = buildStatusChangeEmail({
        orderNumber: orderData.order_number,
        firstName: orderData.first_name,
        status: status as 'shipped' | 'cancelled',
        trackingNumber: orderData.tracking_number ?? null,
        trackingCarrier: orderData.tracking_carrier ?? null,
        siteUrl,
      })

      await sendEmail({
        to: orderData.email,
        subject: emailPayload.subject,
        html: emailPayload.html,
        text: emailPayload.text,
      })
    } catch (emailErr) {
      console.error('[admin/uzsakymai/actions] Status email failed:', emailErr)
    }
  }

  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  redirect(`/admin/uzsakymai/${id}?status-updated=1`)
}

// ============================================
// Pastabų (admin notes) atnaujinimas
// ============================================

export async function updateOrderNotesAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string | null
  const notes = (formData.get('notes') as string | null)?.trim() || null

  if (!id) redirect('/admin/uzsakymai?error=invalid-id')

  const { error } = await supabase
    .from('orders')
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/uzsakymai/actions] updateNotes:', error.message)
    redirect(`/admin/uzsakymai/${id}?error=update-failed`)
  }

  revalidatePath(`/admin/uzsakymai/${id}`)
  redirect(`/admin/uzsakymai/${id}?notes-updated=1`)
}

// ============================================
// Siuntimo sekimo numeris (tracking)
// ============================================

const CARRIER_OPTIONS = ['omniva', 'dpd', 'lp_express', 'other'] as const

export async function updateTrackingAction(
  formData: FormData
): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string | null
  const trackingNumber =
    (formData.get('tracking_number') as string | null)?.trim() || null
  const trackingCarrier =
    (formData.get('tracking_carrier') as string | null)?.trim() || null

  if (!id) redirect('/admin/uzsakymai?error=invalid-id')

  const carrier =
    trackingCarrier && (CARRIER_OPTIONS as readonly string[]).includes(trackingCarrier)
      ? trackingCarrier
      : trackingCarrier
        ? 'other'
        : null

  const { error } = await supabase
    .from('orders')
    .update({
      tracking_number: trackingNumber,
      tracking_carrier: carrier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[admin/uzsakymai/actions] updateTracking:', error.message)
    redirect(`/admin/uzsakymai/${id}?error=update-failed`)
  }

  revalidatePath(`/admin/uzsakymai/${id}`)
  redirect(`/admin/uzsakymai/${id}?tracking-updated=1`)
}

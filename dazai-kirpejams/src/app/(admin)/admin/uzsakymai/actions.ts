'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/admin/queries'
import { sendEmail } from '@/lib/email/resend'
import {
  buildStatusChangeEmail,
  buildInvoicePaidEmail,
} from '@/lib/email/templates'
import { generateInvoiceForOrder } from '@/lib/invoices/generate'
import {
  getInvoicePdfBuffer,
  getInvoiceSignedUrl,
} from '@/lib/invoices/queries'

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

  // Jei statusas keičiamas į shipped/cancelled/paid — reikės kliento duomenų
  // email pranešimui. Paimam vieną kartą prieš update'ą.
  const shouldEmail =
    status === 'shipped' || status === 'cancelled' || status === 'paid'
  let orderData: {
    order_number: string
    email: string
    first_name: string
    total_cents: number
    tracking_number: string | null
    tracking_carrier: string | null
  } | null = null

  if (shouldEmail) {
    const { data } = await supabase
      .from('orders')
      .select(
        'order_number, email, first_name, total_cents, tracking_number, tracking_carrier'
      )
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

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'

  // Kai užsakymas pažymimas „paid" — auto-generuojam PVM sąskaitą faktūrą ir
  // išsiunčiam ją klientui email'u kaip PDF priedą.
  // Idempotentiška: jei sąskaita jau egzistuoja, grąžina esamą be pakeitimų.
  // Veikia visiems mokėjimo būdams (Paysera callback / Stripe webhook /
  // rankinis bank_transfer patvirtinimas).
  if (status === 'paid') {
    const result = await generateInvoiceForOrder(id)
    if (!result.ok) {
      console.error(
        '[admin/uzsakymai/actions] invoice auto-generation failed:',
        result.error
      )
      // Nenutraukiam srauto — statusas jau pakeistas. Admin'as galės
      // rankiniu būdu iš naujo spausti „Išrašyti sąskaitą" užsakymo kortelėje.
    } else if (orderData) {
      try {
        const pdfBuffer = await getInvoicePdfBuffer(result.pdfPath)
        if (!pdfBuffer) {
          console.error(
            '[admin/uzsakymai/actions] invoice PDF buffer fetch failed for',
            result.pdfPath
          )
        } else {
          const emailPayload = buildInvoicePaidEmail({
            orderNumber: orderData.order_number,
            invoiceNumber: result.invoiceNumber,
            firstName: orderData.first_name,
            totalCents: orderData.total_cents,
            siteUrl,
            accountUrl: `${siteUrl}/lt/paskyra`,
          })

          await sendEmail({
            to: orderData.email,
            subject: emailPayload.subject,
            html: emailPayload.html,
            text: emailPayload.text,
            attachments: [
              {
                filename: `${result.invoiceNumber}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf',
              },
            ],
          })
        }
      } catch (emailErr) {
        console.error('[admin/uzsakymai/actions] Invoice email failed:', emailErr)
      }
    }
  }

  // Siunčiam status change email'ą klientui (shipped/cancelled). „Paid" turi
  // savo atskirą email'ą su PDF priedu (žr. aukščiau).
  if (orderData && (status === 'shipped' || status === 'cancelled')) {
    try {
      const emailPayload = buildStatusChangeEmail({
        orderNumber: orderData.order_number,
        firstName: orderData.first_name,
        status,
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

// ============================================
// Sąskaitų faktūrų veiksmai
// ============================================

/**
 * Rankinis sąskaitos išrašymas — admin'as paspaudžia mygtuką užsakymo
 * kortelėje. Statuso keitimas į „paid" tai daro automatiškai, bet admin'ui
 * kartais reikia išrašyti iš anksto (pvz. B2B pasiūlymai prieš apmokėjimą)
 * arba pakartoti po klaidos.
 */
export async function generateInvoiceAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = formData.get('id') as string | null
  if (!id) redirect('/admin/uzsakymai?error=invalid-id')

  // Opcijonalūs override'ai iš /admin/uzsakymai/[id]/saskaita formos.
  // Jei laukai nepateikti (pvz. kvietimas iš paprastos „Sugeneruoti PDF"
  // formos) — paliekam default'us.
  const paymentDueRaw = formData.get('payment_due_date')
  const customNotesRaw = formData.get('custom_notes')

  const paymentDueDate =
    typeof paymentDueRaw === 'string'
      ? paymentDueRaw.trim() === ''
        ? null
        : paymentDueRaw.trim()
      : undefined

  const customNotes =
    typeof customNotesRaw === 'string' && customNotesRaw.trim().length > 0
      ? customNotesRaw.trim()
      : null

  const result = await generateInvoiceForOrder(id, {
    paymentDueDate,
    customNotes,
  })

  if (!result.ok) {
    console.error('[admin/uzsakymai/actions] generateInvoice:', result.error)
    redirect(
      `/admin/uzsakymai/${id}?error=invoice-failed&reason=${encodeURIComponent(
        result.error
      )}`
    )
  }

  revalidatePath(`/admin/uzsakymai/${id}`)
  redirect(
    `/admin/uzsakymai/${id}?invoice=${result.alreadyExisted ? 'exists' : 'created'}`
  )
}

/**
 * Parsisiuntimo veiksmas — generuoja 1 val. galiojantį signed URL ir redirect'ina
 * naršyklę tiesiai į jį. Supabase'o `download: true` užtikrina, kad failas bus
 * atsiųstas, o ne atidarytas tab'e.
 */
export async function downloadInvoiceAction(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = formData.get('id') as string | null
  if (!id) redirect('/admin/uzsakymai?error=invalid-id')

  const supabase = createServerClient()
  const { data: inv, error } = await supabase
    .from('invoices')
    .select('pdf_path')
    .eq('order_id', id)
    .maybeSingle<{ pdf_path: string | null }>()

  if (error || !inv || !inv.pdf_path) {
    console.error('[admin/uzsakymai/actions] download: no invoice for', id)
    redirect(`/admin/uzsakymai/${id}?error=no-invoice`)
  }

  const url = await getInvoiceSignedUrl(inv.pdf_path)
  if (!url) {
    redirect(`/admin/uzsakymai/${id}?error=signed-url-failed`)
  }

  redirect(url)
}


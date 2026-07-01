'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/admin/queries'
import { sendEmail } from '@/lib/email/resend'
import {
  buildStatusChangeEmail,
  buildInvoicePaidEmail,
} from '@/lib/email/templates'
import {
  generateInvoiceForOrder,
  regenerateInvoiceForOrder,
} from '@/lib/invoices/generate'
import {
  getInvoicePdfBuffer,
  getInvoiceSignedUrl,
} from '@/lib/invoices/queries'
import {
  createOrder,
  type CreateOrderInput,
  type CreateOrderResult,
} from '@/lib/commerce/order-actions'

/**
 * Admino sukurtas užsakymas (telefonu / el. paštu užsisakiusiam klientui).
 * Panaudoja tą patį `createOrder` (serverio kainos, banko „mokėk čia" laiškas
 * klientui), tik be Meta CAPI evento (tai ne web konversija). Klientas gauna
 * patvirtinimo laišką su banko rekvizitais ir suma; toliau, gavus pinigus,
 * admin pažymi „Apmokėta" (→ sąskaita).
 */
export async function createAdminOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const admin = await requireAdmin()
  const res = await createOrder(input, { skipAnalytics: true })
  if (res.ok) {
    // Pažymim, kad užsakymą suformavo admin (placed_by = admino id). Sąraše tai
    // atskiria nuo viešų klientų užsakymų. approval_status lieka NULL — taip
    // skiriasi nuo vadybininkės (rep) užsakymų, kurie turi approval ciklą.
    try {
      const supabase = createServerClient()
      await supabase
        .from('orders')
        .update({ placed_by: admin.id })
        .eq('order_number', res.orderNumber)
    } catch (e) {
      console.error('[admin/uzsakymai/actions] createAdminOrder mark placed_by:', e)
    }
  }
  return res
}

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

/**
 * Apsauga veiksmo lygyje: rep užsakymai, laukiantys patvirtinimo (pending) ar
 * atmesti (rejected), NEgali būti apdorojami įprastame Užsakymų sraute —
 * statuso keitimas / sąskaitos generavimas blokuojami. Juos tvarko TIK
 * /admin/patvirtinimai (approve_rep_order / reject_rep_order). Sąrašo filtras
 * (queries.ts) yra tik UX — tikra apsauga yra čia (blokuoja ir per tiesioginį URL).
 */
async function assertNotAwaitingApproval(
  supabase: ReturnType<typeof createServerClient>,
  id: string
): Promise<void> {
  const { data } = await supabase
    .from('orders')
    .select('approval_status')
    .eq('id', id)
    .maybeSingle<{ approval_status: string | null }>()
  if (
    data?.approval_status === 'pending' ||
    data?.approval_status === 'rejected'
  ) {
    redirect('/admin/uzsakymai?error=approval-locked')
  }
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

  // Pending/rejected rep užsakymo statuso čia keisti negalima — tik per
  // patvirtinimo ekraną (kitaip apeitume sandėlio nuskaitymą per approve).
  await assertNotAwaitingApproval(supabase, id)

  // Reaktyvavimas: cancelled/refunded → aktyvus statusas galimas TIK jei
  // sandėlį pavyksta nurašyti iš naujo (grąžinimas per restore jau įvyko).
  // Kitaip likučiai liktų išpūsti, o antras cancel jų nebegrąžintų
  // (stock_restored flag'as jau būtų suvartotas).
  const { data: prevOrder } = await supabase
    .from('orders')
    .select('status, stock_restored')
    .eq('id', id)
    .maybeSingle<{ status: string; stock_restored: boolean | null }>()

  const reactivating =
    (prevOrder?.status === 'cancelled' || prevOrder?.status === 'refunded') &&
    status !== 'cancelled' &&
    status !== 'refunded'

  if (reactivating) {
    const { data: redecData, error: redecErr } = await supabase.rpc(
      'redecrement_stock_by_order_id',
      { p_order_id: id }
    )
    const redec = redecData as {
      ok?: boolean
      reason?: string
      product?: string
      stock?: number
      needed?: number
    } | null
    if (redecErr || !redec?.ok) {
      const reason =
        redec?.reason === 'insufficient_stock'
          ? `nepakanka likučio („${redec.product}“: yra ${redec.stock}, reikia ${redec.needed})`
          : redec?.reason === 'rep_order'
            ? 'vadybininkės užsakymo reaktyvuoti negalima'
            : (redecErr?.message ?? 'sandėlio nurašymas nepavyko')
      redirect(
        `/admin/uzsakymai/${id}?error=reactivate-failed&reason=${encodeURIComponent(reason)}`
      )
    }
  }

  // Jei statusas keičiamas į shipped/cancelled/paid/delivered — reikės
  // kliento duomenų email pranešimui. Paimam vieną kartą prieš update'ą.
  const shouldEmail =
    status === 'shipped' ||
    status === 'cancelled' ||
    status === 'paid' ||
    status === 'delivered'
  let orderData: {
    order_number: string
    email: string
    first_name: string
    total_cents: number
    vat_cents: number
    tracking_number: string | null
    tracking_carrier: string | null
  } | null = null

  if (shouldEmail) {
    const { data } = await supabase
      .from('orders')
      .select(
        'order_number, email, first_name, total_cents, vat_cents, tracking_number, tracking_carrier'
      )
      .eq('id', id)
      .maybeSingle()
    orderData = data
  }

  // Automatinis payment_status sinchronizavimas pagal užsakymo statusą.
  // Logika: bet kuris „toliau nei pending" statusas implikuoja, kad
  // apmokėjimas gautas (admin'as paprastai pažymi „Apmokėtas" pirma, bet
  // gali iškart pereiti į „Išsiųsta" po fizinio patikrinimo). 'cancelled'
  // ir 'pending' nelieskime — admin'as nuspręs atskirai (gali būti atvejis,
  // kai cancel'inam neapmokėtą užsakymą be refund'o).
  const paymentStatusForStatus: Record<string, string | undefined> = {
    paid: 'paid',
    processing: 'paid',
    shipped: 'paid',
    delivered: 'paid',
    refunded: 'refunded',
  }
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  const newPaymentStatus = paymentStatusForStatus[status]
  if (newPaymentStatus) {
    updatePayload.payment_status = newPaymentStatus
  }

  const { error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)

  if (error) {
    console.error('[admin/uzsakymai/actions] updateStatus:', error.message)
    redirect(`/admin/uzsakymai/${id}?error=update-failed`)
  }

  // Cancelled / refunded — grąžinam prekes į sandėlį. RPC idempotentiškas:
  // jei admin'as cancel'ins ir paskui ištrins užsakymą, sandėlis bus
  // atstatytas tik vieną kartą (orders.stock_restored flag'as).
  if (status === 'cancelled' || status === 'refunded') {
    const { error: restoreErr } = await supabase.rpc(
      'restore_stock_by_order_id',
      { p_order_id: id }
    )
    if (restoreErr) {
      console.error(
        '[admin/uzsakymai/actions] stock restore failed (non-blocking):',
        restoreErr.message
      )
      // Sandėlis NEatstatytas po atšaukimo — likučiai išsiderina tyliai.
      Sentry.captureMessage(`Stock restore failed: ${restoreErr.message}`, {
        level: 'error',
        tags: { area: 'stock' },
        extra: { orderId: id },
      })
    }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'

  // Sąskaita + jos el. laiškas vykdomi FONE (after()) — statusas pažymimas ir
  // puslapis grįžta IŠKART, o lėtas react-pdf generavimas (Hobby plane šaltas
  // startas ~2-3s) nebeblokuoja admino. Idempotentiška; veikia visiems mokėjimo
  // būdams. Jei generavimas nepavyktų — admin'as gali rankiniu būdu spausti
  // „Išrašyti sąskaitą". (Sąskaita atsiranda po keleto sekundžių — gali tekti
  // atnaujinti puslapį.)
  after(async () => {
  if (status === 'paid') {
    const result = await generateInvoiceForOrder(id)
    if (!result.ok) {
      console.error(
        '[admin/uzsakymai/actions] invoice auto-generation failed:',
        result.error
      )
      // Nenutraukiam srauto — statusas jau pakeistas. Admin'as galės
      // rankiniu būdu iš naujo spausti „Išrašyti sąskaitą" užsakymo kortelėje.
      // Bet fone (after) niekas ekrane klaidos nemato — fiksuojam Sentry.
      Sentry.captureMessage(`Invoice auto-generation failed: ${result.error}`, {
        level: 'error',
        tags: { area: 'invoice' },
        extra: { orderId: id },
      })
    } else if (orderData && !result.alreadyExisted) {
      // Laiškas su PDF siunčiamas tik NAUJAI išrašytai sąskaitai — jei ji jau
      // egzistavo (pvz. admin'as pakartotinai spusteli „Apmokėtas" ar grąžina
      // statusą paid→processing→paid), klientas dubliuoto laiško negauna.
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
            isVatInvoice: orderData.vat_cents > 0,
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
        Sentry.captureException(emailErr, {
          tags: { area: 'invoice' },
          extra: { orderId: id },
        })
      }
    }
  }
  })

  // Siunčiam status change email'ą klientui (shipped/cancelled/delivered).
  // „Paid" turi savo atskirą email'ą su PDF priedu (žr. aukščiau).
  if (
    orderData &&
    (status === 'shipped' || status === 'cancelled' || status === 'delivered')
  ) {
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
      // Klientas liks be būsenos pranešimo (shipped/delivered/cancelled) —
      // turim apie tai sužinoti (kaip ir kiti laiškai šiame faile).
      Sentry.captureException(emailErr, {
        tags: { area: 'order-status-email' },
        extra: { orderId: id, status },
      })
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

  // Apsauga: sąskaitos negeneruojam neapprovintam rep užsakymui.
  await assertNotAwaitingApproval(createServerClient(), id)

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
 * Pergeneruoja sąskaitą iš dabartinio užsakymo (po pakeitimų — pridėtos prekės,
 * pataisytų kainų). Tas pats numeris ir data, atnaujintas prekių sąrašas + sumos.
 */
export async function regenerateInvoiceAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = formData.get('id') as string | null
  if (!id) redirect('/admin/uzsakymai?error=invalid-id')

  await assertNotAwaitingApproval(createServerClient(), id)

  const result = await regenerateInvoiceForOrder(id)
  if (!result.ok) {
    console.error('[admin/uzsakymai/actions] regenerateInvoice:', result.error)
    redirect(
      `/admin/uzsakymai/${id}?error=invoice-failed&reason=${encodeURIComponent(result.error)}`
    )
  }

  revalidatePath(`/admin/uzsakymai/${id}`)
  redirect(`/admin/uzsakymai/${id}?invoice=regenerated`)
}

// ============================================
// Užsakymo trynimas
// ============================================

/**
 * Ištrina užsakymą iš DB. Prieš ištrynimą atstato prekes į sandėlį
 * (idempotentiškai per `orders.stock_restored` flag'ą — jei užsakymas
 * jau buvo cancelled ir sandėlis grąžintas, antras kartas nepadės).
 *
 * order_items ištrinami automatiškai per ON DELETE CASCADE.
 * invoices su pdf_path lieka Storage'e (admin'as gali rankiniu būdu išvalyt,
 * jei reikės — paprastai sąskaitas reikia saugot dėl apskaitos).
 */
export async function deleteOrderAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const supabase = createServerClient()

  const id = formData.get('id') as string | null
  if (!id) redirect('/admin/uzsakymai?error=invalid-id')

  // 1) Atstatyti prekes į sandėlį (idempotentiška)
  const { error: restoreErr } = await supabase.rpc(
    'restore_stock_by_order_id',
    { p_order_id: id }
  )
  if (restoreErr) {
    console.error(
      '[admin/uzsakymai/actions] delete: stock restore failed:',
      restoreErr.message
    )
    // Vis tiek bandom ištrint — admin'as gali norėt išvalyt net ir tada,
    // kai sandėlio neįmanoma atstatyt (pvz. produktas jau ištrintas).
  }

  // 2) Ištrint užsakymą (order_items ištrinami per CASCADE)
  const { error: deleteErr } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    console.error('[admin/uzsakymai/actions] deleteOrder:', deleteErr.message)
    redirect(`/admin/uzsakymai/${id}?error=delete-failed`)
  }

  revalidatePath('/admin/uzsakymai', 'layout')
  revalidatePath('/admin')
  redirect('/admin/uzsakymai?deleted=1')
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


// ============================================
// Pridėti prekę prie esamo užsakymo
// ============================================

export type AddOrderItemState = { error?: string; success?: boolean; message?: string }

export async function addOrderItemAction(
  _prev: AddOrderItemState,
  formData: FormData
): Promise<AddOrderItemState> {
  await requireAdmin()
  const supabase = createServerClient()

  const orderId = ((formData.get('order_id') as string) ?? '').trim()
  const productId = ((formData.get('product_id') as string) ?? '').trim()
  const qtyRaw = ((formData.get('qty') as string) ?? '').trim()
  const qty = Number(qtyRaw)

  if (!orderId) return { error: 'Trūksta užsakymo.' }
  if (!productId) return { error: 'Pasirinkite prekę.' }
  if (!Number.isInteger(qty) || qty <= 0) return { error: 'Kiekis turi būti teigiamas skaičius.' }

  // Pending/rejected rep užsakymo pildyti negalima (kaip ir statuso keitimo) —
  // RPC papildomai blokuoja VISUS rep užsakymus ir atšauktus/grąžintus.
  await assertNotAwaitingApproval(supabase, orderId)

  const { data, error } = await supabase.rpc('add_order_item', {
    p_order_id: orderId,
    p_product_id: productId,
    p_qty: qty,
  })

  const res = data as { ok?: boolean; reason?: string; stock?: number } | null
  if (error || !res?.ok) {
    const reason = res?.reason
    const msg =
      reason === 'insufficient_stock'
        ? `Nepakanka likučio (yra ${res?.stock ?? 0}).`
        : reason === 'product_inactive'
          ? 'Prekė neaktyvi.'
          : reason === 'product_not_found'
            ? 'Prekė nerasta.'
            : reason === 'order_not_found'
              ? 'Užsakymas nerastas.'
              : reason === 'order_terminal'
                ? 'Užsakymas atšauktas/grąžintas — prekių pridėti nebegalima.'
                : reason === 'rep_order'
                  ? 'Vadybininkės užsakymo pildyti čia negalima.'
                  : error?.message ?? 'Nepavyko pridėti prekės.'
    console.error('[admin/uzsakymai] addOrderItem:', error?.message ?? reason)
    return { error: msg }
  }

  revalidatePath(`/admin/uzsakymai/${orderId}`)
  revalidatePath('/admin/sandelis', 'layout')
  return { success: true, message: 'Prekė pridėta. Sumos perskaičiuotos.' }
}

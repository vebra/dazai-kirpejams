import 'server-only'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Sąskaitų užklausos — skaitymo operacijos admin puslapiams ir kliento
 * paskyrai. Rašymas (generavimas) yra generate.ts.
 */

const INVOICE_BUCKET = 'invoices'

// 1 val. — pakankamai, kad vartotojas spėtų parsisiųsti, bet pakankamai
// trumpai, kad nuoroda nebūtų „amžinai dalinama".
const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60

export type InvoiceSummary = {
  id: string
  orderId: string
  invoiceNumber: string
  issuedAt: string
  totalCents: number
  pdfPath: string | null
  status: 'issued' | 'cancelled'
}

/**
 * Grąžina vieno užsakymo sąskaitą (jei išrašyta). Null jei dar nėra.
 */
export async function getInvoiceByOrderId(
  orderId: string
): Promise<InvoiceSummary | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('id, order_id, invoice_number, issued_at, total_cents, pdf_path, status')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) {
    console.error('[invoices/queries] getInvoiceByOrderId:', error.message)
    return null
  }
  if (!data) return null

  return {
    id: data.id,
    orderId: data.order_id,
    invoiceNumber: data.invoice_number,
    issuedAt: data.issued_at,
    totalCents: data.total_cents,
    pdfPath: data.pdf_path,
    status: data.status,
  }
}

/**
 * Grąžina visas konkretaus kliento (pagal email) sąskaitas. Naudojama
 * `/paskyra` kliento paskyroje. Joinina orders, kad turėtume order_number.
 */
export type CustomerInvoice = InvoiceSummary & { orderNumber: string }

export async function getInvoicesForEmail(
  email: string
): Promise<CustomerInvoice[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('invoices')
    .select(
      `id, order_id, invoice_number, issued_at, total_cents, pdf_path, status,
       orders!inner(order_number, email)`
    )
    .eq('orders.email', email)
    .order('issued_at', { ascending: false })

  if (error) {
    console.error('[invoices/queries] getInvoicesForEmail:', error.message)
    return []
  }

  type Row = {
    id: string
    order_id: string
    invoice_number: string
    issued_at: string
    total_cents: number
    pdf_path: string | null
    status: 'issued' | 'cancelled'
    orders: { order_number: string; email: string } | { order_number: string; email: string }[]
  }

  return (data as Row[] | null ?? []).map((row) => {
    const orderData = Array.isArray(row.orders) ? row.orders[0] : row.orders
    return {
      id: row.id,
      orderId: row.order_id,
      invoiceNumber: row.invoice_number,
      issuedAt: row.issued_at,
      totalCents: row.total_cents,
      pdfPath: row.pdf_path,
      status: row.status,
      orderNumber: orderData?.order_number ?? '',
    }
  })
}

/**
 * Sugeneruoja signed URL PDF'ui iš privataus bucket'o. Kadangi bucket'as
 * `public=false`, tai VIENINTELIS būdas vartotojui atsisiųsti failą be
 * service role kliento.
 *
 * Naudojama:
 *  - admin puslapyje „Parsisiųsti PDF" (kad turėtume download link'ą be
 *    atskiro API route'o)
 *  - kliento paskyroje po email tapatybės patikros
 *
 * ttlSeconds — kiek laiko URL galios. Pagal nutylėjimą 1 val.
 */
export async function getInvoiceSignedUrl(
  pdfPath: string,
  ttlSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.storage
    .from(INVOICE_BUCKET)
    .createSignedUrl(pdfPath, ttlSeconds, {
      download: true, // „Content-Disposition: attachment" — naršyklė atsisiunčia, neatidaro
    })

  if (error || !data) {
    console.error('[invoices/queries] signed URL:', error?.message)
    return null
  }
  return data.signedUrl
}

/**
 * Parsisiunčia PDF turinį kaip Buffer'į iš privataus bucket'o. Naudojama
 * email priedo siuntimui — Resend API priima `Buffer` arba base64 string'ą.
 */
export async function getInvoicePdfBuffer(
  pdfPath: string
): Promise<Buffer | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.storage
    .from(INVOICE_BUCKET)
    .download(pdfPath)

  if (error || !data) {
    console.error('[invoices/queries] download buffer:', error?.message)
    return null
  }
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

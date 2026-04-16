import 'server-only'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { InvoicePdfDocument } from './pdf-template'
import type {
  InvoiceBrandSnapshot,
  InvoiceBuyerSnapshot,
  InvoiceData,
  InvoiceLineItem,
  InvoiceSellerSnapshot,
} from './types'
import { INVOICE_BRAND_DEFAULTS, DEFAULT_PAYMENT_TERMS_DAYS } from './types'

/**
 * Sąskaitų faktūrų generavimo pipeline — kviečiamas iš admin server action'ų
 * ir iš mokėjimo callback'ų (Paysera, Stripe, rankinis bank_transfer
 * patvirtinimas). Idempotentiškas: jei užsakymui sąskaita jau išrašyta,
 * grąžina esamą, o ne generuoja dublikato.
 *
 * Srautas:
 *   1. Patikrinti, ar sąskaita jau egzistuoja → jei taip, grąžinti
 *   2. Surinkti pardavėjo / pirkėjo / prekių snapshot'ą
 *   3. Atominiškai paimti kitą numerį per `next_invoice_number()` RPC
 *   4. Renderiname PDF į buferį
 *   5. Įkeliam į `invoices` Storage bucket'ą (private)
 *   6. Insert'as į `invoices` lentelę su snapshot + pdf_path
 *
 * Naudoja service role klientą, todėl gali būti saugiai kviečiamas iš
 * bet kurio server-side konteksto (su sąlyga, kad skambinantysis jau
 * patikrino autorizaciją — pvz. requireAdmin arba Paysera signature check).
 */

const INVOICE_BUCKET = 'invoices'
const DEFAULT_VAT_RATE = 21.0

export type GenerateResult =
  | {
      ok: true
      invoiceId: string
      invoiceNumber: string
      pdfPath: string
      alreadyExisted: boolean
    }
  | { ok: false; error: string }

/**
 * Per-invoice admin override'ai. Priima laukus, kuriuos admin'as gali
 * pakeisti /admin/uzsakymai/[id]/saskaita formoje prieš išrašant.
 * Jei nepateikta — naudojami default'ai iš brand nustatymų.
 */
export type InvoiceOverrides = {
  // ISO yyyy-MM-dd; null → mokėtina iš karto; undefined → auto iš terms
  paymentDueDate?: string | null
  customNotes?: string | null
}

type ShopSettingsRow = { key: string; value: unknown }

/**
 * Iš shop_settings lentelės paima įmonės rekvizitus. Analogas
 * `getCompanyInfo()` iš admin/queries.ts, bet naudoja service role klientą —
 * generate.ts turi veikti ir be authenticated sesijos (pvz. Paysera callback).
 */
async function loadSellerSnapshot(
  supabase: SupabaseClient
): Promise<InvoiceSellerSnapshot> {
  const keys = [
    'company_legal_name',
    'company_reg_code',
    'company_vat_code',
    'company_address',
    'company_email',
    'company_phone',
    'bank_recipient',
    'bank_iban',
    'bank_name',
  ] as const

  const { data, error } = await supabase
    .from('shop_settings')
    .select('key, value')
    .in('key', keys as unknown as string[])

  if (error) {
    console.error('[invoices/generate] loadSellerSnapshot:', error.message)
  }

  const map = new Map<string, unknown>()
  for (const row of (data ?? []) as ShopSettingsRow[]) {
    map.set(row.key, row.value)
  }

  const str = (k: string): string => {
    const v = map.get(k)
    return typeof v === 'string' ? v : ''
  }

  return {
    legalName: str('company_legal_name'),
    regCode: str('company_reg_code'),
    vatCode: str('company_vat_code'),
    address: str('company_address'),
    email: str('company_email'),
    phone: str('company_phone'),
    bankRecipient: str('bank_recipient'),
    bankIban: str('bank_iban'),
    bankName: str('bank_name'),
  }
}

/**
 * Brand'o nustatymai + apmokėjimo terminas dienomis. Brand grąžinamas
 * kaip `InvoiceBrandSnapshot` — tiesiai tinka saugoti į `brand_snapshot`
 * stulpelį.
 */
async function loadBrandSettings(
  supabase: SupabaseClient
): Promise<{ brand: InvoiceBrandSnapshot; paymentTermsDays: number }> {
  const keys = [
    'invoice_brand_name',
    'invoice_brand_tagline',
    'invoice_accent_color',
    'invoice_footer_text',
    'invoice_default_notes',
    'invoice_payment_terms_days',
  ] as const

  const { data, error } = await supabase
    .from('shop_settings')
    .select('key, value')
    .in('key', keys as unknown as string[])

  if (error) {
    console.error('[invoices/generate] loadBrandSettings:', error.message)
  }

  const map = new Map<string, unknown>()
  for (const row of (data ?? []) as ShopSettingsRow[]) {
    map.set(row.key, row.value)
  }

  const str = (k: string, fallback: string): string => {
    const v = map.get(k)
    return typeof v === 'string' && v.length > 0 ? v : fallback
  }

  const paymentTermsRaw = map.get('invoice_payment_terms_days')
  const paymentTermsDays =
    typeof paymentTermsRaw === 'number' && Number.isFinite(paymentTermsRaw)
      ? paymentTermsRaw
      : typeof paymentTermsRaw === 'string' &&
          Number.isFinite(Number.parseInt(paymentTermsRaw, 10))
        ? Number.parseInt(paymentTermsRaw, 10)
        : DEFAULT_PAYMENT_TERMS_DAYS

  return {
    brand: {
      brandName: str('invoice_brand_name', INVOICE_BRAND_DEFAULTS.brandName),
      tagline: str('invoice_brand_tagline', INVOICE_BRAND_DEFAULTS.tagline),
      accentColor: str(
        'invoice_accent_color',
        INVOICE_BRAND_DEFAULTS.accentColor
      ),
      footerText: str('invoice_footer_text', INVOICE_BRAND_DEFAULTS.footerText),
      defaultNotes: str(
        'invoice_default_notes',
        INVOICE_BRAND_DEFAULTS.defaultNotes
      ),
    },
    paymentTermsDays,
  }
}

/**
 * Apmokėjimo terminas (yyyy-MM-dd) pagal override'ą arba terms dienas.
 * Override: null → grįžinam null (mokėtina iš karto); string → jį;
 * undefined → skaičiuojam issued_at + terms dienų.
 */
function resolvePaymentDueDate(
  issuedAt: string,
  paymentTermsDays: number,
  override: string | null | undefined
): string | null {
  if (override !== undefined) return override
  if (paymentTermsDays <= 0) return null
  const d = new Date(issuedAt)
  d.setDate(d.getDate() + paymentTermsDays)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

type OrderRow = {
  id: string
  order_number: string
  email: string
  phone: string | null
  first_name: string
  last_name: string
  company_name: string | null
  company_code: string | null
  vat_code: string | null
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  delivery_country: string | null
  payment_method: string
  subtotal_cents: number
  discount_cents: number | null
  delivery_cost_cents: number | null
  vat_cents: number
  total_cents: number
  notes: string | null
  order_items:
    | Array<{
        product_name: string
        product_sku: string | null
        quantity: number
        unit_price_cents: number
        total_cents: number
      }>
    | null
}

async function loadOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, order_number,
       email, phone, first_name, last_name,
       company_name, company_code, vat_code,
       delivery_address, delivery_city, delivery_postal_code, delivery_country,
       payment_method,
       subtotal_cents, discount_cents, delivery_cost_cents, vat_cents, total_cents,
       notes,
       order_items(product_name, product_sku, quantity, unit_price_cents, total_cents)`
    )
    .eq('id', orderId)
    .maybeSingle<OrderRow>()

  if (error) {
    console.error('[invoices/generate] loadOrder:', error.message)
    return null
  }
  return data
}

function buildBuyerSnapshot(order: OrderRow): InvoiceBuyerSnapshot {
  return {
    firstName: order.first_name,
    lastName: order.last_name,
    email: order.email,
    phone: order.phone,
    companyName: order.company_name,
    companyCode: order.company_code,
    vatCode: order.vat_code,
    address: order.delivery_address,
    city: order.delivery_city,
    postalCode: order.delivery_postal_code,
    country: order.delivery_country,
  }
}

function buildItemsSnapshot(order: OrderRow): InvoiceLineItem[] {
  const items = order.order_items ?? []
  return items.map((it) => ({
    name: it.product_name,
    sku: it.product_sku,
    quantity: it.quantity,
    unitPriceCents: it.unit_price_cents,
    totalCents: it.total_cents,
  }))
}

function buildPdfPath(invoiceNumber: string): string {
  // SF-2026-0042 → "2026/SF-2026-0042.pdf"
  const parts = invoiceNumber.split('-')
  const year = parts[1] ?? new Date().getFullYear().toString()
  return `${year}/${invoiceNumber}.pdf`
}

/**
 * Pagrindinis entry point'as. `orderId` — orders.id UUID.
 *
 * Jei sąskaita jau išrašyta, grąžina esamą (idempotent). Jei ne — pilnas
 * pipeline'as.
 */
export async function generateInvoiceForOrder(
  orderId: string,
  overrides: InvoiceOverrides = {}
): Promise<GenerateResult> {
  const supabase = createServerClient()

  // 1. Idempotencijos patikra
  const { data: existing, error: existingError } = await supabase
    .from('invoices')
    .select('id, invoice_number, pdf_path')
    .eq('order_id', orderId)
    .maybeSingle<{ id: string; invoice_number: string; pdf_path: string | null }>()

  if (existingError) {
    console.error('[invoices/generate] existing check:', existingError.message)
  }

  if (existing) {
    // Jei kažkada įrašas atsirado be PDF (pvz. upload'as krito) — regeneruojam
    // tik PDF'ą, bet numerio nekeisim.
    if (!existing.pdf_path) {
      const regen = await regeneratePdfOnly(supabase, orderId, existing.invoice_number)
      if (!regen.ok) return regen
      return {
        ok: true,
        invoiceId: existing.id,
        invoiceNumber: existing.invoice_number,
        pdfPath: regen.pdfPath,
        alreadyExisted: true,
      }
    }

    return {
      ok: true,
      invoiceId: existing.id,
      invoiceNumber: existing.invoice_number,
      pdfPath: existing.pdf_path,
      alreadyExisted: true,
    }
  }

  // 2. Surenkam duomenis
  const order = await loadOrder(supabase, orderId)
  if (!order) {
    return { ok: false, error: 'Užsakymas nerastas.' }
  }
  if (!order.order_items || order.order_items.length === 0) {
    return { ok: false, error: 'Užsakymas neturi prekių — sąskaita negali būti išrašyta.' }
  }

  const seller = await loadSellerSnapshot(supabase)
  if (!seller.legalName) {
    return {
      ok: false,
      error:
        'Įmonės rekvizitai neužpildyti. Eikite į /admin/nustatymai ir užpildykite bent įmonės pavadinimą bei kodą.',
    }
  }

  const { brand, paymentTermsDays } = await loadBrandSettings(supabase)
  const buyer = buildBuyerSnapshot(order)
  const items = buildItemsSnapshot(order)

  // 3. Atominis numeris
  const { data: invoiceNumber, error: rpcError } = await supabase.rpc(
    'next_invoice_number'
  )
  if (rpcError || typeof invoiceNumber !== 'string') {
    console.error('[invoices/generate] next_invoice_number:', rpcError?.message)
    return { ok: false, error: 'Nepavyko sugeneruoti sąskaitos numerio.' }
  }

  const issuedAt = new Date().toISOString()
  const paymentDueDate = resolvePaymentDueDate(
    issuedAt,
    paymentTermsDays,
    overrides.paymentDueDate
  )

  // Pastabų prioritetas: per-invoice custom > užsakymo > brand default.
  const resolvedNotes =
    (overrides.customNotes && overrides.customNotes.trim().length > 0
      ? overrides.customNotes
      : null) ??
    (order.notes && order.notes.trim().length > 0 ? order.notes : null) ??
    (brand.defaultNotes && brand.defaultNotes.trim().length > 0
      ? brand.defaultNotes
      : null)

  const data: InvoiceData = {
    invoiceNumber,
    issuedAt,
    orderNumber: order.order_number,
    seller,
    buyer,
    items,
    brand,
    subtotalCents: order.subtotal_cents,
    discountCents: order.discount_cents ?? 0,
    deliveryCostCents: order.delivery_cost_cents ?? 0,
    vatCents: order.vat_cents,
    vatRate: DEFAULT_VAT_RATE,
    totalCents: order.total_cents,
    paymentMethod: order.payment_method,
    notes: resolvedNotes,
    paymentDueDate,
  }

  // 4. Render PDF
  const pdfBuffer = await renderPdf(data)

  // 5. Upload į Storage
  const pdfPath = buildPdfPath(invoiceNumber)
  const { error: uploadError } = await supabase.storage
    .from(INVOICE_BUCKET)
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
      // 0 — kad regeneravimo atveju admin'as ir klientas iškart gautų
      // šviežią PDF (default Supabase storage cacheControl yra 3600s).
      cacheControl: '0',
    })

  if (uploadError) {
    console.error('[invoices/generate] storage upload:', uploadError.message)
    return { ok: false, error: `Nepavyko įkelti PDF: ${uploadError.message}` }
  }

  // 6. Insert'as į invoices
  const { data: inserted, error: insertError } = await supabase
    .from('invoices')
    .insert({
      order_id: orderId,
      invoice_number: invoiceNumber,
      issued_at: issuedAt,
      seller_snapshot: seller,
      buyer_snapshot: buyer,
      items_snapshot: items,
      brand_snapshot: brand,
      subtotal_cents: data.subtotalCents,
      discount_cents: data.discountCents,
      delivery_cost_cents: data.deliveryCostCents,
      vat_cents: data.vatCents,
      vat_rate: data.vatRate,
      total_cents: data.totalCents,
      payment_due_date: paymentDueDate,
      custom_notes:
        overrides.customNotes && overrides.customNotes.trim().length > 0
          ? overrides.customNotes
          : null,
      pdf_path: pdfPath,
      pdf_generated_at: issuedAt,
      status: 'issued',
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError || !inserted) {
    console.error('[invoices/generate] insert:', insertError?.message)
    // Bandom išvalyti PDF'ą, kad neliktų orphan failo
    await supabase.storage.from(INVOICE_BUCKET).remove([pdfPath]).then(
      () => {},
      () => {}
    )
    return {
      ok: false,
      error: `Nepavyko įrašyti sąskaitos: ${insertError?.message ?? 'nežinoma klaida'}`,
    }
  }

  return {
    ok: true,
    invoiceId: inserted.id,
    invoiceNumber,
    pdfPath,
    alreadyExisted: false,
  }
}

/**
 * Atskiras scenarijus: invoices eilutė egzistuoja (numeris paimtas), bet
 * PDF upload'as kažkada nepavyko. Regeneruojam PDF tuo pačiu numeriu ir
 * atnaujinam pdf_path. Taip išvengiam numeracijos skylės.
 */
async function regeneratePdfOnly(
  supabase: SupabaseClient,
  orderId: string,
  invoiceNumber: string
): Promise<{ ok: true; pdfPath: string } | { ok: false; error: string }> {
  const order = await loadOrder(supabase, orderId)
  if (!order) return { ok: false, error: 'Užsakymas nerastas.' }

  const { data: inv } = await supabase
    .from('invoices')
    .select(
      'seller_snapshot, buyer_snapshot, items_snapshot, brand_snapshot, issued_at, vat_rate, payment_due_date, custom_notes'
    )
    .eq('order_id', orderId)
    .single<{
      seller_snapshot: InvoiceSellerSnapshot
      buyer_snapshot: InvoiceBuyerSnapshot
      items_snapshot: InvoiceLineItem[]
      brand_snapshot: InvoiceBrandSnapshot | null
      issued_at: string
      vat_rate: number
      payment_due_date: string | null
      custom_notes: string | null
    }>()

  if (!inv) return { ok: false, error: 'Sąskaitos įrašas neegzistuoja.' }

  const data: InvoiceData = {
    invoiceNumber,
    issuedAt: inv.issued_at,
    orderNumber: order.order_number,
    seller: inv.seller_snapshot,
    buyer: inv.buyer_snapshot,
    items: inv.items_snapshot,
    brand: inv.brand_snapshot ?? INVOICE_BRAND_DEFAULTS,
    subtotalCents: order.subtotal_cents,
    discountCents: order.discount_cents ?? 0,
    deliveryCostCents: order.delivery_cost_cents ?? 0,
    vatCents: order.vat_cents,
    vatRate: inv.vat_rate,
    totalCents: order.total_cents,
    paymentMethod: order.payment_method,
    notes: inv.custom_notes ?? order.notes,
    paymentDueDate: inv.payment_due_date,
  }

  const pdfBuffer = await renderPdf(data)
  const pdfPath = buildPdfPath(invoiceNumber)

  const { error: uploadError } = await supabase.storage
    .from(INVOICE_BUCKET)
    .upload(pdfPath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
      // 0 — kad regeneravimo atveju admin'as ir klientas iškart gautų
      // šviežią PDF (default Supabase storage cacheControl yra 3600s).
      cacheControl: '0',
    })

  if (uploadError) {
    return { ok: false, error: `Nepavyko įkelti PDF: ${uploadError.message}` }
  }

  await supabase
    .from('invoices')
    .update({
      pdf_path: pdfPath,
      pdf_generated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)

  return { ok: true, pdfPath }
}

/**
 * Wrapper'is aplink renderToBuffer — be JSX, kad šis failas nereikalautų
 * .tsx (likusio serverio pipeline'o nereikia supažindinti su React JSX
 * parser'iu; pdf-template.tsx jau užtenka).
 */
async function renderPdf(data: InvoiceData): Promise<Buffer> {
  // InvoicePdfDocument grąžina <Document>, bet TypeScript per wrapper'į to
  // nemato — renderToBuffer tikisi `ReactElement<DocumentProps>`, todėl
  // cast'inam. Runtime elgsena teisinga.
  const element = createElement(InvoicePdfDocument, { data }) as unknown as
    ReactElement<DocumentProps>
  return renderToBuffer(element)
}

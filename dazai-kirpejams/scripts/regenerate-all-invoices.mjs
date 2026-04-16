/**
 * Pergeneruoja VISŲ invoices lentelėje esančių sąskaitų PDF'us naudojant
 * dabartinį šabloną (src/lib/invoices/pdf-template.tsx). Naudinga po šablono
 * atnaujinimų — LR apskaitos įstatymas leidžia regeneruoti PDF tol, kol
 * nekinta išrašymo data, numeris ir rekvizitai (jie ateina iš snapshot'ų).
 *
 * Paleidimas: npx tsx scripts/regenerate-all-invoices.mjs
 */
import { readFileSync } from 'node:fs'
import { renderToBuffer, Font } from '@react-pdf/renderer'
import React from 'react'
import path from 'node:path'

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.resolve('public/fonts/Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.resolve('public/fonts/Inter-Bold.ttf'), fontWeight: 700 },
  ],
})

const envText = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
}

const { InvoicePdfDocument } = await import('../src/lib/invoices/pdf-template.tsx')

async function fetchInvoices() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/invoices?select=*&order=issued_at.asc`,
    { headers: HEADERS }
  )
  if (!r.ok) throw new Error(`invoices fetch: ${r.status} ${await r.text()}`)
  return r.json()
}

async function fetchOrder(orderId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?select=order_number,payment_method,notes&id=eq.${orderId}`,
    { headers: HEADERS }
  )
  if (!r.ok) throw new Error(`order fetch: ${r.status} ${await r.text()}`)
  const [row] = await r.json()
  return row
}

async function uploadPdf(pdfPath, buffer) {
  const r = await fetch(
    `${SUPABASE_URL}/storage/v1/object/invoices/${pdfPath}`,
    {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/pdf',
        // 0 — kad perrašytus PDF'us naršyklės ir CDN iškart atnaujintų
        // (default 3600s kešą iškvietimo metu matėme seną failą)
        'Cache-Control': 'no-cache, max-age=0',
        'x-upsert': 'true',
      },
      body: buffer,
    }
  )
  if (!r.ok) throw new Error(`upload: ${r.status} ${await r.text()}`)
}

async function updatePdfGeneratedAt(invoiceId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoiceId}`,
    {
      method: 'PATCH',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ pdf_generated_at: new Date().toISOString() }),
    }
  )
  if (!r.ok) throw new Error(`invoice update: ${r.status} ${await r.text()}`)
}

const invoices = await fetchInvoices()
console.log(`Found ${invoices.length} invoices to regenerate.\n`)

const BRAND_FALLBACK = {
  brandName: 'Dažai Kirpėjams',
  tagline: 'Profesionalūs plaukų dažai kirpėjams',
  accentColor: '#E91E8C',
  footerText: '',
  defaultNotes: '',
}

let ok = 0
let failed = 0

for (const inv of invoices) {
  const tag = inv.invoice_number
  try {
    const order = await fetchOrder(inv.order_id)
    if (!order) {
      console.log(`  [SKIP] ${tag} — order not found (${inv.order_id})`)
      failed++
      continue
    }

    const data = {
      invoiceNumber: inv.invoice_number,
      issuedAt: inv.issued_at,
      orderNumber: order.order_number,
      seller: inv.seller_snapshot,
      buyer: inv.buyer_snapshot,
      items: inv.items_snapshot,
      brand: inv.brand_snapshot ?? BRAND_FALLBACK,
      subtotalCents: inv.subtotal_cents,
      discountCents: inv.discount_cents ?? 0,
      deliveryCostCents: inv.delivery_cost_cents ?? 0,
      vatCents: inv.vat_cents,
      vatRate: inv.vat_rate ?? 21,
      totalCents: inv.total_cents,
      paymentMethod: order.payment_method,
      notes: inv.custom_notes ?? order.notes ?? null,
      paymentDueDate: inv.payment_due_date,
    }

    const element = React.createElement(InvoicePdfDocument, { data })
    const buffer = await renderToBuffer(element)

    const pdfPath = inv.pdf_path || `${inv.invoice_number.split('-')[1]}/${inv.invoice_number}.pdf`
    await uploadPdf(pdfPath, buffer)
    await updatePdfGeneratedAt(inv.id)

    console.log(`  [OK]   ${tag} → ${pdfPath} (${buffer.length} B)`)
    ok++
  } catch (err) {
    console.log(`  [FAIL] ${tag} — ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${ok} OK, ${failed} failed.`)

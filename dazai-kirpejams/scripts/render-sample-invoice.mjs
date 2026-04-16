import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
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
  envText.split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')] })
)

const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/invoices?select=*&limit=1`, {
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
})
const [inv] = await res.json()

const r2 = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?select=order_number,payment_method,notes&id=eq.${inv.order_id}`, {
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` }
})
const [order] = await r2.json()

const data = {
  invoiceNumber: inv.invoice_number,
  issuedAt: inv.issued_at,
  orderNumber: order.order_number,
  seller: inv.seller_snapshot,
  buyer: inv.buyer_snapshot,
  items: inv.items_snapshot,
  brand: inv.brand_snapshot ?? { brandName: 'Dažai Kirpėjams', tagline: 'Profesionalūs plaukų dažai kirpėjams', accentColor: '#E91E8C', footerText: '', defaultNotes: '' },
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

const { InvoicePdfDocument } = await import('../src/lib/invoices/pdf-template.tsx')
const element = React.createElement(InvoicePdfDocument, { data })
const buffer = await renderToBuffer(element)
mkdirSync('../screenshots', { recursive: true })
const outPath = '../screenshots/invoice-sample-new.pdf'
writeFileSync(outPath, buffer)
console.log('OK size:', buffer.length)

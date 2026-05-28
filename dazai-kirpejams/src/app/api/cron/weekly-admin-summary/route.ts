import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendEmail, getAdminNotificationEmail } from '@/lib/email/resend'
import { buildWeeklyAdminSummaryEmail } from '@/lib/email/admin-summary-template'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FALLBACK_ADMIN_EMAIL = 'info@dziuljetavebre.lt'

/**
 * Vercel Cron endpoint — savaitinė admin suvestinė.
 *
 * Saugumas: Vercel Cron'as prideda `Authorization: Bearer $CRON_SECRET`.
 * Be jo request'as atmetamas — kad niekas iš interneto negalėtų užplauti
 * admin'o inbox'o.
 *
 * Tvarkaraštis: kiekvieną pirmadienį 06:00 UTC (~08:00 LT vasarą / 09:00
 * žiemą). Konfigūracija — `vercel.json`.
 *
 * Idempotentiškumas: laiškas siunčiamas „šiandien − 7 d." langui, todėl
 * du paleidimai per tą pačią savaitę pasiųstų du laiškus. Vercel Cron
 * negarantuoja exactly-once, bet realiai paleidžia kartą per minutę su
 * < 1% dublikato tikimybe. Jei reikės — pridėsim `weekly_summary_sent_at`
 * lentelę vėliau.
 */

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoIso = weekAgo.toISOString()

  // ----- Užsakymai per 7 d. -----
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, status, total_cents')
    .gte('created_at', weekAgoIso)

  if (ordersErr) {
    console.error('[cron/weekly-summary] orders:', ordersErr.message)
  }

  type StatusKey =
    | 'pending'
    | 'paid'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'

  const byStatus: Record<StatusKey, number> = {
    pending: 0,
    paid: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  }
  let revenueCents = 0

  for (const o of orders ?? []) {
    const s = o.status as StatusKey
    if (byStatus[s] !== undefined) byStatus[s] += 1
    // Apyvarta: skaitom tik faktiškai apmokėtus statusus
    if (
      s === 'paid' ||
      s === 'processing' ||
      s === 'shipped' ||
      s === 'delivered'
    ) {
      revenueCents += o.total_cents ?? 0
    }
  }

  // ----- Populiariausi produktai per 7 d. -----
  // Imam order_items iš tos pačios savaitės užsakymų. order_items neturi
  // created_at filtruoti tiesiogiai pagal datą; jungiamės per orders.id.
  const orderIds = (orders ?? []).map((o) => o.id)
  type TopProduct = { name: string; quantity: number; revenueCents: number }
  const topMap: Record<string, TopProduct> = {}

  if (orderIds.length > 0) {
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('product_name, quantity, total_cents, order_id')
      .in('order_id', orderIds)

    if (itemsErr) {
      console.error('[cron/weekly-summary] order_items:', itemsErr.message)
    }

    for (const it of items ?? []) {
      const key = it.product_name as string
      if (!topMap[key]) {
        topMap[key] = { name: key, quantity: 0, revenueCents: 0 }
      }
      topMap[key].quantity += it.quantity ?? 0
      topMap[key].revenueCents += it.total_cents ?? 0
    }
  }

  const topProducts = Object.values(topMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // ----- Verifikacijos -----
  const { count: pendingVerifications } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'pending')

  const { count: approvedThisWeek } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('verification_status', 'approved')
    .gte('verified_at', weekAgoIso)

  // ----- Žemo sandėlio produktai (≤ 5 vnt., is_active) -----
  const { data: lowStock, error: lowErr } = await supabase
    .from('products')
    .select('name_lt, sku, stock_quantity, slug')
    .eq('is_active', true)
    .lte('stock_quantity', 5)
    .order('stock_quantity', { ascending: true })
    .limit(10)

  if (lowErr) {
    console.error('[cron/weekly-summary] low stock:', lowErr.message)
  }

  // ----- B2B užklausos per 7 d. -----
  const { count: newB2bInquiries } = await supabase
    .from('b2b_inquiries')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgoIso)

  // ----- Email -----
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    'https://www.dazaikirpejams.lt'

  const adminEmail = getAdminNotificationEmail() ?? FALLBACK_ADMIN_EMAIL

  const mail = buildWeeklyAdminSummaryEmail({
    siteUrl,
    weekStartLabel: formatDate(weekAgo),
    weekEndLabel: formatDate(now),
    orders: {
      total: orders?.length ?? 0,
      revenueCents,
      byStatus,
      topProducts,
    },
    pendingVerifications: pendingVerifications ?? 0,
    approvedThisWeek: approvedThisWeek ?? 0,
    lowStock: (lowStock ?? []).map((p) => ({
      name: p.name_lt as string,
      sku: (p.sku as string) ?? null,
      stockQuantity: (p.stock_quantity as number) ?? 0,
      slug: p.slug as string,
    })),
    newB2bInquiries: newB2bInquiries ?? 0,
  })

  const result = await sendEmail({
    to: adminEmail,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  })

  if (!result.ok) {
    console.error('[cron/weekly-summary] sendEmail failed:', result.reason)
    return NextResponse.json(
      { ok: false, error: result.reason },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    sentTo: adminEmail,
    window: { from: formatDate(weekAgo), to: formatDate(now) },
    summary: {
      orders: orders?.length ?? 0,
      revenueEur: revenueCents / 100,
      pendingVerifications: pendingVerifications ?? 0,
      approvedThisWeek: approvedThisWeek ?? 0,
      lowStockCount: lowStock?.length ?? 0,
      newB2bInquiries: newB2bInquiries ?? 0,
    },
  })
}

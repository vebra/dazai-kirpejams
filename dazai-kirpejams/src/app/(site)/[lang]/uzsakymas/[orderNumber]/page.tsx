import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { CheckCircle2, Package, Truck, Building2, ArrowRight } from 'lucide-react'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { PageHeader } from '@/components/ui/PageHeader'
import { Section } from '@/components/ui/Section'
import { formatPrice, langPrefix } from '@/lib/utils'
import { buildPageMetadata } from '@/lib/seo'
import {
  createServerClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server'
import { createServerSupabase } from '@/lib/supabase/ssr'
import { getCompanyInfo } from '@/lib/admin/queries'
import type { DeliveryMethod, PaymentMethod } from '@/lib/commerce/constants'
import { PurchaseTracker } from '@/components/analytics/PurchaseTracker'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/uzsakymas/[orderNumber]'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const dict = await getDictionary(lang)
  return {
    ...buildPageMetadata({
      lang,
      path: '/uzsakymas',
      title: dict.order.confirmationTitle,
      description: dict.order.confirmationDesc,
    }),
    robots: { index: false, follow: false },
  }
}

type OrderSnapshot = {
  orderNumber: string
  email: string
  firstName: string
  lastName: string
  phone: string
  deliveryMethod: DeliveryMethod
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  paymentMethod: PaymentMethod
  items: {
    productId: string
    name: string
    sku: string | null
    priceCents: number
    quantity: number
  }[]
  subtotalCents: number
  discountCode?: string | null
  discountCents?: number
  shippingCents: number
  vatCents: number
  totalCents: number
  createdAt: string
}

/**
 * Užsakymo snapshot'as iš sausainuko, kurį nustatė `createOrder` (greitas
 * kelias; veikia ir be DB — dev aplinka). Jei Supabase sukonfigūruota,
 * papildomai patikriname užsakymo egzistavimą DB (kad nebūtų įmanoma
 * suforge'inti cookie su svetimu numeriu).
 */
async function loadOrderSnapshotFromCookie(
  orderNumber: string
): Promise<OrderSnapshot | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(`dk-order-${orderNumber}`)
  if (!cookie) return null

  try {
    const snapshot = JSON.parse(cookie.value) as OrderSnapshot
    if (snapshot.orderNumber !== orderNumber) return null

    if (isSupabaseServerConfigured) {
      const supabase = createServerClient()
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', orderNumber)
        .maybeSingle()
      if (!data) return null
    }

    return snapshot
  } catch {
    return null
  }
}

/**
 * Atsarginis kelias, kai sausainukas pasibaigė (30 min), klientas grįžo
 * kitame įrenginyje ar po laiko. Užsakymą atstatome iš DB, BET tik jei
 * prisijungęs vartotojas yra to užsakymo savininkas (el. paštas sutampa).
 * Be šios nuosavybės patikros bet kas, atspėjęs užsakymo numerį, matytų
 * pirkėjo PII — todėl numerio vien nepakanka.
 */
async function loadOrderSnapshotFromDb(
  orderNumber: string
): Promise<OrderSnapshot | null> {
  if (!isSupabaseServerConfigured) return null

  try {
    const ssr = await createServerSupabase()
    const {
      data: { user },
    } = await ssr.auth.getUser()
    const userEmail = user?.email?.trim().toLowerCase()
    if (!userEmail) return null

    const supabase = createServerClient()
    const { data: order } = await supabase
      .from('orders')
      .select(
        'id, order_number, email, phone, first_name, last_name, delivery_method, delivery_address, delivery_city, delivery_postal_code, payment_method, subtotal_cents, discount_code, discount_cents, delivery_cost_cents, vat_cents, total_cents, created_at'
      )
      .eq('order_number', orderNumber)
      .maybeSingle()

    if (!order) return null
    if ((order.email ?? '').trim().toLowerCase() !== userEmail) return null

    const { data: itemRows } = await supabase
      .from('order_items')
      .select('product_id, product_name, product_sku, unit_price_cents, quantity')
      .eq('order_id', order.id)

    return {
      orderNumber: order.order_number,
      email: order.email,
      firstName: order.first_name,
      lastName: order.last_name,
      phone: order.phone,
      deliveryMethod: order.delivery_method as DeliveryMethod,
      deliveryAddress: order.delivery_address ?? null,
      deliveryCity: order.delivery_city ?? null,
      deliveryPostalCode: order.delivery_postal_code ?? null,
      paymentMethod: order.payment_method as PaymentMethod,
      items: (itemRows ?? []).map((r) => ({
        productId: r.product_id,
        name: r.product_name,
        sku: r.product_sku ?? null,
        priceCents: r.unit_price_cents,
        quantity: r.quantity,
      })),
      subtotalCents: order.subtotal_cents,
      discountCode: order.discount_code ?? null,
      discountCents: order.discount_cents ?? 0,
      shippingCents: order.delivery_cost_cents ?? 0,
      vatCents: order.vat_cents ?? 0,
      totalCents: order.total_cents,
      createdAt: order.created_at ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

async function loadOrderSnapshot(
  orderNumber: string
): Promise<OrderSnapshot | null> {
  return (
    (await loadOrderSnapshotFromCookie(orderNumber)) ??
    (await loadOrderSnapshotFromDb(orderNumber))
  )
}

export default async function OrderConfirmationPage({
  params,
}: PageProps<'/[lang]/uzsakymas/[orderNumber]'>) {
  const { lang, orderNumber } = await params
  if (!hasLocale(lang)) notFound()
  const dict = await getDictionary(lang)

  const order = await loadOrderSnapshot(orderNumber)
  if (!order) notFound()

  // Įmonės rekvizitai iš Nustatymų — banko pavedimo instrukcijoms.
  // Jei DB nėra arba laukai tušti, degraced'inam į laukimo žinutę.
  const companyInfo = isSupabaseServerConfigured
    ? await getCompanyInfo().catch(() => null)
    : null
  const hasBankInfo = Boolean(
    companyInfo?.bankIban && companyInfo?.bankRecipient
  )

  const deliveryIcon =
    order.deliveryMethod === 'courier'
      ? Truck
      : order.deliveryMethod === 'parcel_locker'
        ? Package
        : Building2

  const deliveryLabel =
    order.deliveryMethod === 'courier'
      ? dict.checkout.courier
      : order.deliveryMethod === 'parcel_locker'
        ? dict.checkout.parcelLocker
        : dict.checkout.pickup

  const DeliveryIcon = deliveryIcon

  return (
    <>
      <PurchaseTracker
        orderNumber={order.orderNumber}
        items={order.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.priceCents / 100,
          quantity: i.quantity,
        }))}
        value={order.totalCents / 100}
        shipping={order.shippingCents / 100}
        tax={order.vatCents / 100}
        locale={lang}
      />
      <PageHeader title={dict.order.confirmationTitle} />

      <Section background="white">
        <Container size="narrow">
          {/* Sėkmės blokas */}
          <div className="flex flex-col items-center text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-brand-magenta/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-brand-magenta" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-brand-gray-900 mb-3">
              {dict.order.confirmationTitle}
            </h2>
            <p className="text-brand-gray-500 max-w-xl">
              {dict.order.confirmationDesc}
            </p>
            <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-brand-gray-50 rounded-full">
              <span className="text-xs font-medium text-brand-gray-500 uppercase tracking-wider">
                {dict.order.orderNumber}
              </span>
              <span className="text-lg font-bold text-brand-gray-900 tabular-nums">
                {order.orderNumber}
              </span>
            </div>
          </div>

          {/* Banko pavedimo instrukcijos — tik jei admin'as užpildė rekvizitus */}
          {order.paymentMethod === 'bank_transfer' && hasBankInfo && (
            <div className="bg-brand-gray-900 text-white rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-bold mb-2">
                {dict.order.bankTransferInstructions}
              </h3>
              <p className="text-sm text-white/70 mb-6 leading-relaxed">
                {dict.order.bankTransferDesc}
              </p>
              <dl className="space-y-4 text-sm">
                <BankRow
                  label={dict.order.recipient}
                  value={companyInfo!.bankRecipient}
                />
                <BankRow
                  label={dict.order.iban}
                  value={companyInfo!.bankIban}
                  mono
                />
                {companyInfo!.bankName && (
                  <BankRow label={dict.order.bankName} value={companyInfo!.bankName} />
                )}
                <BankRow
                  label={dict.order.amount}
                  value={formatPrice(order.totalCents / 100, lang)}
                  highlight
                />
                <BankRow
                  label={dict.order.reference}
                  value={order.orderNumber}
                  mono
                />
              </dl>
            </div>
          )}
          {/* Fallback: bank_transfer, bet rekvizitų dar nėra */}
          {order.paymentMethod === 'bank_transfer' && !hasBankInfo && (
            <div className="bg-brand-gray-50 border border-brand-gray-50 rounded-2xl p-6 mb-8">
              <p className="text-sm text-brand-gray-900 leading-relaxed">
                {dict.order.bankInfoPending}
              </p>
            </div>
          )}

          {/* Užsakymo detalės */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <DetailCard title={dict.order.contactTitle}>
              <div className="text-sm text-brand-gray-900">
                {order.firstName} {order.lastName}
              </div>
              <div className="text-sm text-brand-gray-500">{order.email}</div>
              <div className="text-sm text-brand-gray-500">{order.phone}</div>
            </DetailCard>

            <DetailCard title={dict.order.deliveryTitle}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-magenta/10 flex items-center justify-center flex-shrink-0">
                  <DeliveryIcon className="w-4 h-4 text-brand-magenta" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-brand-gray-900">
                    {deliveryLabel}
                  </div>
                  {order.deliveryAddress && (
                    <div className="text-sm text-brand-gray-500 leading-relaxed">
                      {order.deliveryAddress}
                      {order.deliveryCity && `, ${order.deliveryCity}`}
                      {order.deliveryPostalCode && ` ${order.deliveryPostalCode}`}
                    </div>
                  )}
                </div>
              </div>
            </DetailCard>
          </div>

          {/* Prekės */}
          <div className="bg-white border border-brand-gray-50 rounded-2xl overflow-hidden mb-8">
            <div className="px-6 py-4 bg-brand-gray-50">
              <h3 className="text-sm font-bold text-brand-gray-900 uppercase tracking-wider">
                {dict.order.itemsTitle}
              </h3>
            </div>
            <ul>
              {order.items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between gap-4 px-6 py-4 border-t border-brand-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-brand-gray-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-brand-gray-500 mt-0.5">
                      {formatPrice(item.priceCents / 100, lang)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-brand-gray-900 tabular-nums whitespace-nowrap">
                    {formatPrice((item.priceCents * item.quantity) / 100, lang)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-5 border-t border-brand-gray-50 bg-brand-gray-50/40 space-y-2 text-sm">
              <SummaryRow
                label={dict.cart.subtotal}
                value={formatPrice(order.subtotalCents / 100, lang)}
              />
              {order.discountCents && order.discountCents > 0 ? (
                <SummaryRow
                  label={`${dict.order.discountLabel}${order.discountCode ? ` (${order.discountCode})` : ''}`}
                  value={`−${formatPrice(order.discountCents / 100, lang)}`}
                  accent
                />
              ) : null}
              <SummaryRow
                label={dict.cart.shipping}
                value={
                  order.shippingCents === 0
                    ? dict.cart.freeShipping
                    : formatPrice(order.shippingCents / 100, lang)
                }
              />
              {order.vatCents > 0 && (
                <SummaryRow
                  label={dict.checkout.vat}
                  value={formatPrice(order.vatCents / 100, lang)}
                  muted
                />
              )}
              <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-brand-gray-50">
                <span className="text-base font-bold text-brand-gray-900">
                  {dict.cart.total}
                </span>
                <span className="text-2xl font-bold text-brand-gray-900 tabular-nums">
                  {formatPrice(order.totalCents / 100, lang)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href={`${langPrefix(lang)}/produktai`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-magenta text-white font-semibold rounded-xl hover:bg-brand-magenta/90 transition-colors"
            >
              {dict.order.continueShopping}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  )
}

function BankRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-baseline gap-4 pb-4 border-b border-white/10 last:border-0 last:pb-0">
      <dt className="text-white/60 text-xs uppercase tracking-wider">{label}</dt>
      <dd
        className={`${
          mono ? 'font-mono tabular-nums' : 'font-semibold'
        } ${highlight ? 'text-brand-magenta text-lg' : 'text-white'}`}
      >
        {value}
      </dd>
    </div>
  )
}

function DetailCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-brand-gray-50 rounded-2xl p-6">
      <div className="text-xs font-bold text-brand-gray-500 uppercase tracking-wider mb-3">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  muted,
  accent,
}: {
  label: string
  value: string
  muted?: boolean
  accent?: boolean
}) {
  const colorClass = accent
    ? 'text-brand-magenta'
    : muted
      ? 'text-brand-gray-500'
      : 'text-brand-gray-900'
  return (
    <div className={`flex justify-between ${colorClass}`}>
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

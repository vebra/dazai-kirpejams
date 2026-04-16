import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminOrderById,
  getInvoiceTemplateSettings,
} from '@/lib/admin/queries'
import { getInvoiceByOrderId } from '@/lib/invoices/queries'
import { generateInvoiceAction } from '../../actions'

export const metadata = {
  title: 'Išrašyti sąskaitą',
}

export const dynamic = 'force-dynamic'

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/**
 * Sąskaitos išrašymo puslapis — leidžia prieš generuojant PDF'ą pakeisti
 * apmokėjimo terminą ir pastabas. Brand'o lauku'ai (pavadinimas, spalva)
 * keičiami globaliai per /admin/nustatymai, ne čia.
 *
 * Jei užsakymui sąskaita jau egzistuoja — redirect'inam atgal, nes
 * numeracijos negalima perrašyti.
 */
export default async function IssueInvoicePage({
  params,
}: PageProps<'/admin/uzsakymai/[id]/saskaita'>) {
  await requireAdmin()

  const { id } = await params
  const [order, existing, template] = await Promise.all([
    getAdminOrderById(id),
    getInvoiceByOrderId(id),
    getInvoiceTemplateSettings(),
  ])

  if (!order) notFound()
  if (existing) {
    // Jau išrašyta — grįžtam į užsakymo puslapį su pranešimu
    redirect(`/admin/uzsakymai/${id}?invoice=exists`)
  }

  // Suggest'inamas terminas. Banko pavedimui — šiandien + default terms.
  // Paysera/Stripe — tuščias (mokėta iš karto), bet admin'as gali įrašyti.
  const today = new Date()
  const suggestedDue = new Date(today)
  suggestedDue.setDate(today.getDate() + template.paymentTermsDays)
  const suggestedDueIso =
    order.paymentMethod === 'bank_transfer' && template.paymentTermsDays > 0
      ? formatIsoDate(suggestedDue)
      : ''

  const suggestedNotes =
    (order.notes && order.notes.trim().length > 0
      ? order.notes
      : template.defaultNotes) ?? ''

  const fullName = `${order.firstName} ${order.lastName}`.trim()
  const buyerLabel = order.companyName || fullName || order.email

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="text-[13px] text-brand-gray-500">
        <Link
          href={`/admin/uzsakymai/${id}`}
          className="hover:text-brand-magenta transition-colors"
        >
          ← Atgal į užsakymą
        </Link>
      </div>

      {/* Antraštė */}
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Išrašyti PVM sąskaitą faktūrą
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Užsakymas{' '}
          <span className="font-mono font-semibold text-brand-gray-900">
            {order.orderNumber}
          </span>{' '}
          · {buyerLabel} · {formatCents(order.totalCents)}
        </p>
      </div>

      {/* Informacija apie šabloną */}
      <section className="bg-[#F5F5F7] border border-[#eee] rounded-xl p-5 text-[13px] text-brand-gray-500 space-y-1.5">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-block h-3 w-3 rounded"
            style={{ backgroundColor: template.accentColor }}
            aria-hidden
          />
          <span className="font-semibold text-brand-gray-900">
            {template.brandName}
          </span>
          {template.tagline && (
            <span className="text-brand-gray-500">· {template.tagline}</span>
          )}
        </div>
        <p>
          Šabloną (pavadinimą, šūkį, spalvą, default pastabas, apmokėjimo
          terminą) galite keisti{' '}
          <Link
            href="/admin/nustatymai"
            className="text-brand-magenta hover:underline"
          >
            nustatymuose
          </Link>
          . Žemiau galite pritaikyti tik šią konkrečią sąskaitą.
        </p>
      </section>

      {/* Forma */}
      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <form action={generateInvoiceAction} className="space-y-6">
          <input type="hidden" name="id" value={order.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="payment_due_date"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Apmokėti iki (data)
              </label>
              <input
                type="date"
                id="payment_due_date"
                name="payment_due_date"
                defaultValue={suggestedDueIso}
                min={formatIsoDate(today)}
                className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
              />
              <p className="mt-1 text-[11px] text-brand-gray-500">
                {order.paymentMethod === 'bank_transfer'
                  ? `Banko pavedimui. Default terminas — ${template.paymentTermsDays} d.`
                  : 'Tuščia — mokėtina iš karto (paprastai Paysera/Stripe).'}
              </p>
            </div>

            <div>
              <label
                htmlFor="payment_method_info"
                className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
              >
                Mokėjimo būdas
              </label>
              <div
                id="payment_method_info"
                className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm text-brand-gray-500"
              >
                {order.paymentMethod === 'bank_transfer'
                  ? 'Banko pavedimas'
                  : order.paymentMethod === 'paysera'
                    ? 'Paysera'
                    : order.paymentMethod === 'stripe'
                      ? 'Mokėjimo kortelė'
                      : order.paymentMethod}
              </div>
              <p className="mt-1 text-[11px] text-brand-gray-500">
                Paimta iš užsakymo — keisti negalima.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="custom_notes"
              className="block text-[12px] font-semibold text-brand-gray-900 mb-1"
            >
              Pastabos sąskaitoje
            </label>
            <textarea
              id="custom_notes"
              name="custom_notes"
              defaultValue={suggestedNotes}
              rows={4}
              placeholder="Pvz. „Prekės pristatomos per 3 d.d. po apmokėjimo."
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white resize-y"
            />
            <p className="mt-1 text-[11px] text-brand-gray-500">
              Default'iniai tekstai paimti iš šablono ir užsakymo. Galite juos
              pakeisti ar palikti tuščią.
            </p>
          </div>

          <div className="pt-4 border-t border-[#eee] flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[12px] text-brand-gray-500 max-w-sm">
              Po išrašymo numeris užfiksuojamas — perrašyti nebebus galima (LR
              apskaitos įstatymas).
            </p>
            <div className="flex gap-2">
              <Link
                href={`/admin/uzsakymai/${order.id}`}
                className="px-4 py-2.5 bg-[#F5F5F7] border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-white transition-colors"
              >
                Atšaukti
              </Link>
              <button
                type="submit"
                className="px-6 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark active:scale-[0.98] transition-all"
              >
                Išrašyti sąskaitą
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}

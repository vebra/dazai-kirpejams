import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminCustomers,
  type AdminCustomerListOptions,
} from '@/lib/admin/queries'

export const metadata = {
  title: 'Klientai',
}

export const dynamic = 'force-dynamic'

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso))
}

type CustomerType = 'all' | 'b2c' | 'b2b'
type CustomerSort = NonNullable<AdminCustomerListOptions['sortBy']>

function parseType(raw: string | undefined): CustomerType {
  if (raw === 'b2c' || raw === 'b2b') return raw
  return 'all'
}

function parseSort(raw: string | undefined): CustomerSort {
  if (
    raw === 'spent-desc' ||
    raw === 'orders-desc' ||
    raw === 'recent' ||
    raw === 'name'
  ) {
    return raw
  }
  return 'spent-desc'
}

export default async function AdminCustomersPage({
  searchParams,
}: PageProps<'/admin/klientai'>) {
  await requireAdmin()

  const sp = await searchParams
  const search = typeof sp.q === 'string' ? sp.q : undefined
  const type = parseType(typeof sp.type === 'string' ? sp.type : undefined)
  const sortBy = parseSort(typeof sp.sort === 'string' ? sp.sort : undefined)

  const customers = await getAdminCustomers({
    search,
    type,
    sortBy,
  })

  // Apžvalgos KPI — skaičiuojam iš jau atfiltruoto sąrašo
  const totalCustomers = customers.length
  const totalRevenueCents = customers.reduce(
    (sum, c) => sum + c.totalSpentCents,
    0
  )
  const b2bCount = customers.filter((c) => c.isB2b).length
  const avgLtvCents =
    totalCustomers > 0 ? Math.round(totalRevenueCents / totalCustomers) : 0

  return (
    <div className="space-y-6">
      {/* Antraštė */}
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Klientai</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Visi klientai, užsakę bent kartą — jų pirkimo istorija, kontaktai ir
          LTV.
        </p>
      </div>

      {/* KPI kortelės */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Iš viso klientų
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {totalCustomers}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Bendra apyvarta
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {formatCents(totalRevenueCents)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            Vid. LTV
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {formatCents(avgLtvCents)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
            B2B klientai
          </div>
          <div className="mt-1.5 text-2xl font-bold text-brand-gray-900">
            {b2bCount}
          </div>
        </div>
      </div>

      {/* Tipo tab'ai */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2 flex flex-wrap gap-1">
        <Link
          href={`/admin/klientai?sort=${sortBy}`}
          className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            type === 'all'
              ? 'bg-brand-magenta text-white'
              : 'text-brand-gray-900 hover:bg-[#F5F5F7]'
          }`}
        >
          Visi
        </Link>
        <Link
          href={`/admin/klientai?type=b2c&sort=${sortBy}`}
          className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            type === 'b2c'
              ? 'bg-brand-magenta text-white'
              : 'text-brand-gray-900 hover:bg-[#F5F5F7]'
          }`}
        >
          B2C
        </Link>
        <Link
          href={`/admin/klientai?type=b2b&sort=${sortBy}`}
          className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
            type === 'b2b'
              ? 'bg-brand-magenta text-white'
              : 'text-brand-gray-900 hover:bg-[#F5F5F7]'
          }`}
        >
          B2B salonai
        </Link>
      </div>

      {/* Filtrai */}
      <form
        method="get"
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
      >
        {type !== 'all' && <input type="hidden" name="type" value={type} />}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label
              htmlFor="q"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Paieška
            </label>
            <input
              type="text"
              id="q"
              name="q"
              defaultValue={search ?? ''}
              placeholder="El. paštas, vardas, telefonas, įmonė"
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="sort"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Rūšiavimas
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sortBy}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            >
              <option value="spent-desc">Vertingiausi</option>
              <option value="orders-desc">Daugiausia užsakymų</option>
              <option value="recent">Naujausi</option>
              <option value="name">Pagal pavadinimą</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
            >
              Filtruoti
            </button>
            {search && (
              <Link
                href={`/admin/klientai${type !== 'all' ? `?type=${type}` : ''}`}
                className="px-4 py-2.5 border border-[#ddd] rounded-lg font-semibold text-sm text-brand-gray-900 hover:bg-[#F5F5F7] transition-colors"
              >
                Išvalyti
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Klientų lentelė */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {customers.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-brand-gray-500">
            Klientų nerasta. Jie atsiranda po pirmo užsakymo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Klientas</th>
                  <th className="px-4 py-3 text-left">Telefonas</th>
                  <th className="px-4 py-3 text-center w-[90px]">Užsakymai</th>
                  <th className="px-4 py-3 text-right w-[130px]">LTV</th>
                  <th className="px-4 py-3 text-left w-[110px]">
                    Pirmas pirkimas
                  </th>
                  <th className="px-4 py-3 text-left w-[110px]">
                    Paskutinis pirkimas
                  </th>
                  <th className="px-4 py-3 text-right w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.email}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-brand-gray-900 truncate">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-brand-gray-500 truncate">
                            {c.email}
                          </div>
                        </div>
                        {c.isB2b && (
                          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                            B2B
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">
                      {c.phone ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-brand-gray-900">
                      {c.orderCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                      {formatCents(c.totalSpentCents)}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">
                      {formatDate(c.firstOrderAt)}
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">
                      {formatDate(c.lastOrderAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/klientai/${encodeURIComponent(c.email)}`}
                        className="inline-flex items-center px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[12px] font-semibold text-brand-gray-900 transition-colors"
                      >
                        Atidaryti →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

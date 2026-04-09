import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getAdminProducts,
  getAdminCategories,
  getActiveProductsCount,
  getInactiveProductsCount,
  type AdminProductListOptions,
} from '@/lib/admin/queries'
import {
  DYE_CATEGORIES,
  type DyeCategoryKey,
} from '@/lib/data/dye-categories'
import {
  quickUpdateStockAction,
  toggleProductActiveAction,
  bulkActivateInactiveAction,
  bulkDeactivateActiveAction,
} from './actions'

export const metadata = {
  title: 'Sandėlis',
}

export const dynamic = 'force-dynamic'

const PRICE_FORMATTER = new Intl.NumberFormat('lt-LT', {
  style: 'currency',
  currency: 'EUR',
})

function formatCents(cents: number): string {
  return PRICE_FORMATTER.format(cents / 100)
}

/**
 * Marža % pagal retail su PVM ir savikainą be PVM.
 * LT PVM = 21%. Formulė: (retail/1.21 - cost) / (retail/1.21) × 100
 */
function calculateMarginPct(
  priceCents: number,
  costPriceCents: number | null
): number | null {
  if (costPriceCents === null || costPriceCents === 0) return null
  const retailExclVatCents = priceCents / 1.21
  if (retailExclVatCents <= 0) return null
  return ((retailExclVatCents - costPriceCents) / retailExclVatCents) * 100
}

function parseSort(
  raw: string | undefined
): AdminProductListOptions['sortBy'] {
  if (
    raw === 'stock-asc' ||
    raw === 'stock-desc' ||
    raw === 'price-asc' ||
    raw === 'price-desc' ||
    raw === 'name'
  ) {
    return raw
  }
  return 'name'
}

function parseDyeGroup(raw: string | undefined): DyeCategoryKey | undefined {
  if (!raw || raw === 'all') return undefined
  const found = DYE_CATEGORIES.find((c) => c.key === raw)
  return found?.key
}

export default async function AdminInventoryPage({
  searchParams,
}: PageProps<'/admin/sandelis'>) {
  await requireAdmin()

  const sp = await searchParams
  const search = typeof sp.q === 'string' ? sp.q : undefined
  const categoryId =
    typeof sp.category === 'string' && sp.category !== 'all'
      ? sp.category
      : undefined
  const sortBy = parseSort(typeof sp.sort === 'string' ? sp.sort : undefined)
  const dyeGroup = parseDyeGroup(
    typeof sp.group === 'string' ? sp.group : undefined
  )
  const lowOnly = sp.low === '1'
  const inactiveOnly = sp.inactive === '1'
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const activatedCount = typeof sp.activated === 'string' ? Number(sp.activated) : null
  const deactivatedCount = typeof sp.deactivated === 'string' ? Number(sp.deactivated) : null

  const [products, categories, activeCount, inactiveCount] = await Promise.all([
    getAdminProducts({
      search,
      categoryId,
      dyeGroup,
      sortBy,
      onlyLowStock: lowOnly,
      onlyInactive: inactiveOnly,
    }),
    getAdminCategories(),
    getActiveProductsCount(),
    getInactiveProductsCount(),
  ])

  const errorMessage =
    errorParam === 'invalid-stock'
      ? 'Neteisingas likučio skaičius.'
      : errorParam === 'update-failed'
        ? 'Nepavyko išsaugoti pakeitimų.'
        : errorParam === 'invalid-id'
          ? 'Trūksta produkto ID.'
          : null

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {activatedCount !== null && !Number.isNaN(activatedCount) && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          ✓ Aktyvuota produktų: <strong>{activatedCount}</strong>. Dabar jie
          matomi svetainėje ir gali būti užsakomi.
        </div>
      )}

      {deactivatedCount !== null && !Number.isNaN(deactivatedCount) && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
          ✓ Deaktyvuota produktų: <strong>{deactivatedCount}</strong>. Jie
          nebematomi svetainėje.
        </div>
      )}

      {/* Bulk-activate banner — rodomas tik kol yra išjungtų produktų */}
      {inactiveCount > 0 && (
        <div className="bg-gradient-to-r from-brand-magenta/5 to-brand-magenta/10 border border-brand-magenta/20 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-magenta">
                Masinis aktyvavimas
              </div>
              <h3 className="mt-1 text-base font-bold text-brand-gray-900">
                Turite {inactiveCount} išjungtus produktus
              </h3>
              <p className="mt-1 text-[13px] text-brand-gray-500">
                Po supplier'io importo produktai yra išjungti ir su 0 likučiu.
                Aktyvuokite juos visus iš karto ir nustatykite pradinį likutį,
                arba praeikite sąrašą rankomis.
              </p>
            </div>
            <form
              action={bulkActivateInactiveAction}
              className="flex items-end gap-2 flex-shrink-0"
            >
              <div>
                <label
                  htmlFor="bulk_stock"
                  className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1"
                >
                  Pradinis likutis
                </label>
                <input
                  type="number"
                  id="bulk_stock"
                  name="stock_quantity"
                  min={0}
                  step={1}
                  placeholder="pvz. 10"
                  className="w-[110px] px-3 py-2 bg-white border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors whitespace-nowrap"
              >
                Aktyvuoti visus ({inactiveCount})
              </button>
            </form>
          </div>
          <div className="mt-3 text-[11px] text-brand-gray-500">
            💡 Palikite likutį tuščią, jei norite aktyvuoti nekeičiant esamų
            likučių.
          </div>
        </div>
      )}

      {/* Masinis deaktyvavimas — rodomas tik kai visi aktyvūs (nėra inactive banner'io) */}
      {inactiveCount === 0 && activeCount > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-5 py-3">
          <span className="text-sm text-brand-gray-500">
            Visi <strong className="text-brand-gray-900">{activeCount}</strong>{' '}
            produktai aktyvūs
          </span>
          <form action={bulkDeactivateActiveAction}>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-red-50 hover:text-red-700 border border-[#ddd] hover:border-red-200 rounded-lg text-[12px] font-semibold text-brand-gray-900 transition-colors"
            >
              Deaktyvuoti visus
            </button>
          </form>
        </div>
      )}

      {/* Filtrų juosta */}
      <form
        method="get"
        className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
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
              placeholder="LT / EN / RU pavadinimas, SKU, spalva"
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="category"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Kategorija
            </label>
            <select
              id="category"
              name="category"
              defaultValue={categoryId ?? 'all'}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            >
              <option value="all">Visos kategorijos</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameLt}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="group"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Dažų grupė
            </label>
            <select
              id="group"
              name="group"
              defaultValue={dyeGroup ?? 'all'}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            >
              <option value="all">Visos grupės</option>
              {DYE_CATEGORIES.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label} ({g.slugs.length})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="sort"
              className="block text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500 mb-1.5"
            >
              Rikiavimas
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sortBy}
              className="w-full px-3.5 py-2.5 bg-[#F5F5F7] border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-brand-magenta focus:bg-white"
            >
              <option value="name">Pavadinimas (A-Z)</option>
              <option value="stock-asc">Mažiausias likutis</option>
              <option value="stock-desc">Didžiausias likutis</option>
              <option value="price-asc">Pigiausi</option>
              <option value="price-desc">Brangiausi</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-brand-magenta text-white rounded-lg font-semibold text-sm hover:bg-brand-magenta-dark transition-colors"
            >
              Filtruoti
            </button>
          </div>
        </div>

        {/* Greiti filtrai */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#eee]">
          <label className="flex items-center gap-2 text-sm text-brand-gray-900 cursor-pointer">
            <input
              type="checkbox"
              name="low"
              value="1"
              defaultChecked={lowOnly}
              className="w-4 h-4 rounded border-[#ddd]"
            />
            Tik žemo likučio (&lt; 50)
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-gray-900 cursor-pointer">
            <input
              type="checkbox"
              name="inactive"
              value="1"
              defaultChecked={inactiveOnly}
              className="w-4 h-4 rounded border-[#ddd]"
            />
            Tik išjungti
          </label>
          <span className="ml-auto text-[12px] text-brand-gray-500">
            {products.length} produktai
          </span>
        </div>
      </form>

      {/* Produktų lentelė */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {products.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-brand-gray-500">
            Produktų nerasta pagal pasirinktus filtrus.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Produktas</th>
                  <th className="px-4 py-3 text-left">Kategorija</th>
                  <th className="px-4 py-3 text-right">Kaina</th>
                  <th className="px-4 py-3 text-right w-[90px]">Marža</th>
                  <th className="px-4 py-3 text-center w-[180px]">Likutis</th>
                  <th className="px-4 py-3 text-center w-[110px]">Būsena</th>
                  <th className="px-4 py-3 text-right w-[150px]">Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-[#eee] hover:bg-[#F9F9FB] transition-colors"
                  >
                    {/* Produktas */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.colorHex ? (
                          <div
                            className="flex-shrink-0 w-9 h-9 rounded-lg border border-[#ddd]"
                            style={{ backgroundColor: p.colorHex }}
                            aria-hidden
                          />
                        ) : (
                          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#F5F5F7] border border-[#ddd]" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-brand-gray-900 truncate">
                            {p.nameLt}
                          </div>
                          <div className="text-[11px] text-brand-gray-500 font-mono">
                            {p.colorNumber ?? p.sku ?? p.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kategorija */}
                    <td className="px-4 py-3 text-brand-gray-500">
                      {p.categoryNameLt ?? '—'}
                    </td>

                    {/* Kaina */}
                    <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                      {formatCents(p.priceCents)}
                    </td>

                    {/* Marža % */}
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const margin = calculateMarginPct(
                          p.priceCents,
                          p.costPriceCents
                        )
                        if (margin === null) {
                          return (
                            <span className="text-[12px] text-brand-gray-500">
                              —
                            </span>
                          )
                        }
                        const colorClass =
                          margin >= 60
                            ? 'text-emerald-700'
                            : margin >= 30
                              ? 'text-amber-700'
                              : 'text-red-700'
                        return (
                          <span
                            className={`font-semibold text-[13px] ${colorClass}`}
                            title={
                              p.costPriceCents !== null
                                ? `Savikaina: ${formatCents(p.costPriceCents)}`
                                : undefined
                            }
                          >
                            {margin.toFixed(0)}%
                          </span>
                        )
                      })()}
                    </td>

                    {/* Stock quick-edit */}
                    <td className="px-4 py-3">
                      <form
                        action={quickUpdateStockAction}
                        className="flex items-center justify-center gap-2"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="number"
                          name="stock_quantity"
                          defaultValue={String(p.stockQuantity ?? 0)}
                          min={0}
                          step={1}
                          className={`w-20 px-2 py-1.5 border rounded-md text-sm text-center font-semibold ${
                            p.stockQuantity === 0
                              ? 'border-red-300 text-red-600 bg-red-50'
                              : p.stockQuantity < 10
                                ? 'border-amber-300 text-amber-700 bg-amber-50'
                                : 'border-[#ddd] text-brand-gray-900'
                          }`}
                        />
                        <button
                          type="submit"
                          className="px-2.5 py-1.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[11px] font-semibold text-brand-gray-900 transition-colors"
                          title="Išsaugoti likutį"
                        >
                          ✓
                        </button>
                      </form>
                    </td>

                    {/* Aktyvumo toggle */}
                    <td className="px-4 py-3 text-center">
                      <form action={toggleProductActiveAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input
                          type="hidden"
                          name="next_active"
                          value={p.isActive ? 'false' : 'true'}
                        />
                        <button
                          type="submit"
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                          }`}
                          title={
                            p.isActive
                              ? 'Paspauskite, kad išjungtumėte'
                              : 'Paspauskite, kad įjungtumėte'
                          }
                        >
                          {p.isActive ? '● Aktyvus' : '○ Išjungtas'}
                        </button>
                      </form>
                    </td>

                    {/* Veiksmai */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/sandelis/${p.id}`}
                        className="inline-flex items-center px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#e8e8ec] border border-[#ddd] rounded-md text-[12px] font-semibold text-brand-gray-900 transition-colors"
                      >
                        Redaguoti →
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

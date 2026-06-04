import { requireAdmin } from '@/lib/admin/auth'
import { getRepManagementData } from '@/lib/admin/rep-reports'
import { TIER_LABELS } from '@/lib/admin/rep-orders-shared'
import { CreateRepForm } from './CreateRepForm'

export const metadata = { title: 'Vadybininkės' }
export const dynamic = 'force-dynamic'

const PRICE = new Intl.NumberFormat('lt-LT', { style: 'currency', currency: 'EUR' })
const eur = (c: number) => PRICE.format(c / 100)

export default async function RepManagementPage() {
  await requireAdmin()
  const { reps, clients, totalApprovedSalesCents } = await getRepManagementData()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">Vadybininkės</h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Vadybininkių paskyros ir pardavimų ataskaitos. „Pardavimai“ = patvirtinti
          užsakymai. Iš viso patvirtinta:{' '}
          <strong className="text-brand-gray-900">{eur(totalApprovedSalesCents)}</strong>.
        </p>
      </div>

      <CreateRepForm />

      {/* Vadybininkių lentelė */}
      <div>
        <h3 className="text-sm font-bold text-brand-gray-900 mb-2">Pagal vadybininkę</h3>
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-x-auto">
          {reps.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-brand-gray-500">
              Dar nėra vadybininkių. Sukurkite pirmą aukščiau.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Vadybininkė</th>
                  <th className="px-4 py-3 text-left">El. paštas</th>
                  <th className="px-4 py-3 text-center">Klientų</th>
                  <th className="px-4 py-3 text-center">Laukia</th>
                  <th className="px-4 py-3 text-center">Patvirtinta</th>
                  <th className="px-4 py-3 text-right">Pardavimai</th>
                </tr>
              </thead>
              <tbody>
                {reps.map((r) => (
                  <tr key={r.id} className="border-t border-[#eee]">
                    <td className="px-4 py-3 font-medium text-brand-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">{r.email}</td>
                    <td className="px-4 py-3 text-center text-brand-gray-600">{r.clientCount}</td>
                    <td className="px-4 py-3 text-center text-brand-gray-600">{r.pendingCount}</td>
                    <td className="px-4 py-3 text-center text-brand-gray-600">{r.approvedCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                      {eur(r.approvedSalesCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Klientų pardavimai */}
      <div>
        <h3 className="text-sm font-bold text-brand-gray-900 mb-2">Pagal klientą</h3>
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-x-auto">
          {clients.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-brand-gray-500">
              Dar nėra klientų.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                  <th className="px-4 py-3 text-left">Klientas</th>
                  <th className="px-4 py-3 text-left">Grupė</th>
                  <th className="px-4 py-3 text-left">Vadybininkė</th>
                  <th className="px-4 py-3 text-center">Patvirtinta</th>
                  <th className="px-4 py-3 text-right">Pardavimai</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-t border-[#eee]">
                    <td className="px-4 py-3 font-medium text-brand-gray-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                        {TIER_LABELS[c.tier] ?? c.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-gray-500 text-[13px]">{c.repName}</td>
                    <td className="px-4 py-3 text-center text-brand-gray-600">{c.approvedCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gray-900">
                      {eur(c.approvedSalesCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

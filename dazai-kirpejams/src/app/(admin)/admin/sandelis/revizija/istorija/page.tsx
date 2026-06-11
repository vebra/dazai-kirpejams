import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { createServerClient } from '@/lib/supabase/server'
import { PrintButton } from '@/components/admin/PrintButton'

export const metadata = { title: 'Revizijų istorija' }
export const dynamic = 'force-dynamic'

type DetailItem = {
  productId: string
  name: string
  colorNumber: string | null
  sku: string | null
  system: number
  counted: number
  diff: number
  valueCents: number
}

type RevisionRow = {
  id: string
  created_at: string
  applied_count: number
  total_delta: number
  value_change_cents: number
  details: DetailItem[]
}

const DT = new Intl.DateTimeFormat('lt-LT', {
  dateStyle: 'short',
  timeStyle: 'short',
})

function eur(cents: number): string {
  const v = (Math.abs(cents) / 100).toFixed(2).replace('.', ',')
  return `${cents < 0 ? '−' : cents > 0 ? '+' : ''}${v} €`
}

export default async function RevisionHistoryPage() {
  await requireAdmin()
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('stock_revisions')
    .select('id, created_at, applied_count, total_delta, value_change_cents, details')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[revizija/istorija]', error.message)
  }
  const revisions = (data ?? []) as RevisionRow[]

  return (
    <div className="space-y-6">
      <div className="print-hide flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Revizijų istorija
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Kiekvienos patvirtintos revizijos suvestinė ir neatitikimų sąrašas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton className="px-4 py-2 bg-white border border-[#ddd] rounded-lg text-[13px] font-semibold text-brand-gray-900 hover:bg-[#F5F5F7]" />
          <Link
            href="/admin/sandelis/revizija"
            className="text-[13px] font-semibold text-brand-gray-500 hover:text-brand-magenta"
          >
            ← Į reviziją
          </Link>
        </div>
      </div>

      {revisions.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-brand-gray-500 bg-white border border-[#eee] rounded-xl">
          Revizijų dar nebuvo (istorija pildosi nuo migracijos 071).
        </div>
      ) : (
        <div className="print-area space-y-4">
          {revisions.map((rev) => (
            <details
              key={rev.id}
              className="bg-white rounded-xl border border-[#eee] overflow-hidden group"
            >
              <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3 flex-wrap hover:bg-[#F9F9FB]">
                <span className="font-bold text-brand-gray-900">
                  {DT.format(new Date(rev.created_at))}
                </span>
                <span className="text-sm text-brand-gray-500">
                  Pakeista pozicijų:{' '}
                  <strong className="text-brand-gray-900">{rev.applied_count}</strong>
                  {' · '}Vnt. pokytis:{' '}
                  <strong className={rev.total_delta < 0 ? 'text-red-600' : 'text-emerald-600'}>
                    {rev.total_delta > 0 ? '+' : ''}{rev.total_delta}
                  </strong>
                  {' · '}Vertė (savik.):{' '}
                  <strong className={rev.value_change_cents < 0 ? 'text-red-600' : 'text-emerald-600'}>
                    {eur(rev.value_change_cents)}
                  </strong>
                </span>
              </summary>
              <table className="w-full text-sm border-t border-[#eee]">
                <thead>
                  <tr className="bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.5px] text-brand-gray-500">
                    <th className="px-3 py-2 text-left">Prekė</th>
                    <th className="px-3 py-2 text-center w-20">Buvo</th>
                    <th className="px-3 py-2 text-center w-20">Rasta</th>
                    <th className="px-3 py-2 text-center w-20">Skirt.</th>
                    <th className="px-3 py-2 text-right w-28">Vertė</th>
                  </tr>
                </thead>
                <tbody>
                  {(rev.details ?? []).map((d) => (
                    <tr key={d.productId} className="border-t border-[#f3f3f3]">
                      <td className="px-3 py-1.5">
                        {d.colorNumber ? `${d.colorNumber} · ` : ''}
                        {d.name}
                        {d.sku && (
                          <span className="text-[11px] text-brand-gray-400 font-mono ml-1">
                            {d.sku}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center text-brand-gray-500">{d.system}</td>
                      <td className="px-3 py-1.5 text-center font-semibold">{d.counted}</td>
                      <td className={`px-3 py-1.5 text-center font-bold ${d.diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {d.diff > 0 ? '+' : ''}{d.diff}
                      </td>
                      <td className={`px-3 py-1.5 text-right ${d.valueCents < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {eur(d.valueCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

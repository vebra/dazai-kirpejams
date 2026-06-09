import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getRepManagementData,
  getRepIssuancesByDate,
} from '@/lib/admin/rep-reports'
import { IssuedGoodsView } from './IssuedGoodsView'

export const metadata = { title: 'Išduotos prekės' }
export const dynamic = 'force-dynamic'

export default async function IssuedGoodsPage() {
  await requireAdmin()
  const [repData, issuancesByRep] = await Promise.all([
    getRepManagementData(),
    getRepIssuancesByDate(),
  ])
  const reps = repData.reps.map((r) => ({ id: r.id, name: r.name }))

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Spausdinant rodom TIK ataskaitą (.print-area). */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { background: #fff !important; }
              body * { visibility: hidden !important; }
              .print-area, .print-area * { visibility: visible !important; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; }
              .print-hide { display: none !important; }
              @page { margin: 1.4cm; size: A4; }
            }
          `,
        }}
      />
      <div className="print-hide flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-gray-900">
            Vadybininkei išduotos prekės
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Pasirinkite vadybininkę ir atsispausdinkite jai išduotų prekių sąrašą
            pagal išdavimo dieną.
          </p>
        </div>
        <Link
          href="/admin/sandelis"
          className="px-4 py-2 bg-white border border-[#ddd] text-brand-gray-900 rounded-lg font-semibold text-sm hover:bg-[#F5F5F7] transition-colors whitespace-nowrap"
        >
          ← Sandelis
        </Link>
      </div>

      {reps.length === 0 ? (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
          Vadybininkių dar nėra.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <IssuedGoodsView reps={reps} issuancesByRep={issuancesByRep} />
        </div>
      )}
    </div>
  )
}

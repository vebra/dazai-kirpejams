import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  getRepManagementData,
  getRepHeldInventory,
  getRepIssuancesByDate,
} from '@/lib/admin/rep-reports'
import { ReturnFromRepForm } from './ReturnFromRepForm'

export const metadata = { title: 'Grąžinimas iš vadybininkės' }
export const dynamic = 'force-dynamic'

export default async function ReturnFromRepPage() {
  await requireAdmin()
  const [repData, heldByRep, issuancesByRep] = await Promise.all([
    getRepManagementData(),
    getRepHeldInventory(),
    getRepIssuancesByDate(),
  ])
  const reps = repData.reps.map((r) => ({ id: r.id, name: r.name }))

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Spausdinant rodom TIK grąžinimo lapą (.print-area). */}
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
            Prekių grąžinimas iš vadybininkės
          </h2>
          <p className="mt-1 text-sm text-brand-gray-500">
            Pasirinkite vadybininkę, sudarykite grąžinamų prekių sąrašą ir
            priimkite jas atgal į sandėlį.
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
          Vadybininkių dar nėra. Sukurkite jas{' '}
          <Link href="/admin/vadybininkes" className="underline font-semibold">
            /admin/vadybininkes
          </Link>{' '}
          skiltyje.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <ReturnFromRepForm
            reps={reps}
            heldByRep={heldByRep}
            issuancesByRep={issuancesByRep}
          />
        </div>
      )}
    </div>
  )
}

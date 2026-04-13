import { requireAdmin } from '@/lib/admin/auth'
import { getB2bInquiries } from '@/lib/admin/queries'
import { B2bInquiriesTable } from './B2bInquiriesTable'

export const metadata = {
  title: 'B2B užklausos',
}

export const dynamic = 'force-dynamic'

export default async function AdminB2BPage({
  searchParams,
}: PageProps<'/admin/b2b'>) {
  await requireAdmin()

  const sp = await searchParams
  const errorParam = typeof sp.error === 'string' ? sp.error : undefined
  const errorMessage =
    errorParam === 'invalid-id'
      ? 'Trūksta ID.'
      : errorParam === 'update-failed'
        ? 'Nepavyko atnaujinti.'
        : errorParam === 'delete-failed'
          ? 'Nepavyko ištrinti.'
          : errorParam === 'invalid-status'
            ? 'Neteisingas statusas.'
            : null

  const inquiries = await getB2bInquiries()

  const statusCounts = {
    new: inquiries.filter((i) => i.status === 'new').length,
    contacted: inquiries.filter((i) => i.status === 'contacted').length,
    converted: inquiries.filter((i) => i.status === 'converted').length,
    closed: inquiries.filter((i) => i.status === 'closed').length,
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-brand-gray-900">
          B2B užklausos
        </h2>
        <p className="mt-1 text-sm text-brand-gray-500">
          Salonų bendradarbiavimo užklausos. Peržiūrėkite, susisiekite ir
          konvertuokite į klientus.
        </p>
      </div>

      {errorMessage && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {/* KPI kortelės */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Naujos" value={statusCounts.new} color="blue" />
        <KpiCard
          label="Susisiekta"
          value={statusCounts.contacted}
          color="amber"
        />
        <KpiCard
          label="Konvertuota"
          value={statusCounts.converted}
          color="emerald"
        />
        <KpiCard label="Uždarytos" value={statusCounts.closed} color="gray" />
      </div>

      <section className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <B2bInquiriesTable inquiries={inquiries} />
      </section>
    </div>
  )
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'emerald' | 'gray'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  return (
    <div className={`px-4 py-3 rounded-xl border ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[12px] font-semibold mt-0.5">{label}</div>
    </div>
  )
}

import { requireAdmin } from '@/lib/admin/auth'
import { getReportsData, type ReportPeriod } from '@/lib/admin/queries'
import { ReportsDashboard } from './ReportsDashboard'

export const metadata = {
  title: 'Ataskaitos',
}

export const dynamic = 'force-dynamic'

const VALID_PERIODS = new Set<ReportPeriod>([
  '7d',
  '30d',
  '90d',
  '365d',
  'all',
])

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  await requireAdmin()

  const sp = await searchParams
  const period: ReportPeriod =
    sp.period && VALID_PERIODS.has(sp.period as ReportPeriod)
      ? (sp.period as ReportPeriod)
      : '30d'

  const data = await getReportsData(period)

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Ataskaitos
      </h1>
      <ReportsDashboard data={data} currentPeriod={period} />
    </div>
  )
}

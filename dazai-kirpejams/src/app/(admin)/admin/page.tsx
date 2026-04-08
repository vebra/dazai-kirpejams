import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Apžvalga',
}

/**
 * Apžvalgos (dashboard) puslapis — pagrindinis `/admin` landing'as.
 * Pagal HTML dizaino `dashboard.html` čia bus realaus laiko kortelės:
 * šios dienos užsakymai, pajamos, klientų skaičius, populiariausi produktai.
 */
export default async function AdminOverviewPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Apžvalga"
      description="Realaus laiko parduotuvės statistika — užsakymai, pajamos, klientai ir populiariausi produktai vienoje vietoje."
      icon="📊"
      plannedFeatures={[
        'Šios dienos užsakymai ir pajamos (su palyginimu su praeita savaite)',
        'Populiariausi produktai pagal pardavimus',
        'Naujausi užsakymai (greitas sąrašas)',
        'Atsargų įspėjimai — kas baigiasi sandėlyje',
        'B2B užklausų ir naujienlaiškio prenumeratorių skaičiai',
      ]}
    />
  )
}

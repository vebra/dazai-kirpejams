import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Baneriai',
}

export default async function AdminBannersPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Baneriai"
      description="Pagrindinio puslapio hero ir kampanijų baneriai — vizualai, tekstai, CTA nuorodos."
      icon="🖼️"
      plannedFeatures={[
        'Hero slaiderių valdymas pagrindiniame puslapyje',
        'Kampanijų baneriai kategorijų puslapiuose',
        'Laikotarpio planavimas (pradžia / pabaiga)',
        'A/B testavimas — dviejų variantų palyginimas',
        'Multi-lang turinys (LT / EN / RU)',
        'Paspaudimų statistika',
      ]}
    />
  )
}

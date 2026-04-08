import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Sandėlis',
}

export default async function AdminInventoryPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Sandėlis"
      description="Produktų ir atsargų valdymas — likučių stebėjimas, žemo likučio įspėjimai, produktų redagavimas."
      icon="📋"
      plannedFeatures={[
        'Visų produktų sąrašas su likučiais',
        'Produkto pridėjimas/redagavimas (kainos, nuotraukos, aprašymai)',
        'Atsargų koregavimas (gavimai, nurašymai, inventorizacijos)',
        'Žemo likučio įspėjimai (nustatoma ties 50 vnt.)',
        'CSV importas/eksportas masiniam atnaujinimui',
        'Spalvų paletės valdymas (50 spalvų Color SHOCK)',
      ]}
    />
  )
}

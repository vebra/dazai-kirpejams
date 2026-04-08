import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Ataskaitos',
}

export default async function AdminReportsPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Ataskaitos"
      description="Pardavimų ir veiklos analitika — pajamos, populiariausi produktai, klientų elgsena, konversijos."
      icon="📈"
      plannedFeatures={[
        'Pardavimų ataskaita pagal laikotarpį (diena / savaitė / mėnuo / metai)',
        'Produktų populiarumo reitingas',
        'Spalvų populiarumas Color SHOCK paletėje',
        'B2B vs B2C pajamų palyginimas',
        'Klientų įsigijimo šaltiniai (Google, Facebook, tiesioginis)',
        'CSV eksportas buhalteriui',
      ]}
    />
  )
}

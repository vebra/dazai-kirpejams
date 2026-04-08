import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Užsakymai',
}

export default async function AdminOrdersPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Užsakymai"
      description="Visi parduotuvės užsakymai vienoje vietoje — peržiūra, būsenos keitimas, siuntimo žymos ir sąskaitos."
      icon="📦"
      plannedFeatures={[
        'Užsakymų sąrašas su filtravimu (būsena, data, klientas)',
        'Užsakymo detalių puslapis — prekės, adresas, mokėjimas',
        'Būsenos keitimas (naujas → apmokėtas → išsiųstas → pristatytas)',
        'Siuntimo etikečių generavimas (Omniva, DPD, LP Express)',
        'Automatinis el. laiškų siuntimas klientui',
        'PDF sąskaitų-faktūrų generavimas',
      ]}
    />
  )
}

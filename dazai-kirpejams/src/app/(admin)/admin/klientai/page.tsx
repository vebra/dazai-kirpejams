import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Klientai',
}

export default async function AdminCustomersPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Klientai"
      description="Klientų duomenų bazė — pirkimo istorija, kontaktai, B2B/B2C segmentavimas ir individualūs pasiūlymai."
      icon="👥"
      plannedFeatures={[
        'Klientų sąrašas su paieška ir filtravimu',
        'Kliento kortelė — visa pirkimo istorija vienoje vietoje',
        'B2C / B2B segmentavimas ir individualūs kainoraščiai',
        'Kliento statistika (LTV, užsakymų skaičius, vidutinis krepšelis)',
        'BDAR — duomenų eksportas / ištrynimas pagal kliento prašymą',
      ]}
    />
  )
}

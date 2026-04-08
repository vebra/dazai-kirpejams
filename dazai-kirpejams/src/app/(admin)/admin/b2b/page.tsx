import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'B2B užklausos',
}

export default async function AdminB2BPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="B2B užklausos"
      description="Salonų bendradarbiavimo užklausos — individualūs pasiūlymai, derybos, konversija į B2B klientus."
      icon="🤝"
      plannedFeatures={[
        'Visų gautų užklausų sąrašas su būsenomis',
        'Užklausos detalės (salonas, kontaktai, mėnesinis poreikis)',
        'Individualaus pasiūlymo generavimas ir siuntimas PDF',
        'Užklausos konvertavimas į B2B klientą su individualiu kainoraščiu',
        'Atsakymo terminų stebėjimas (SLA)',
        'Pastabos ir istorija apie bendravimą',
      ]}
    />
  )
}

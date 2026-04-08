import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Naujienlaiškiai',
}

export default async function AdminNewsletterPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Naujienlaiškiai"
      description="Prenumeratorių valdymas ir kampanijų siuntimas — segmentavimas, šablonai, atidarymo statistika."
      icon="📧"
      plannedFeatures={[
        'Prenumeratorių sąrašas su paieška ir eksportu',
        'Segmentai (visi / B2C / B2B / aktyvūs pirkėjai)',
        'Kampanijų kūrimas su drag-and-drop redaktoriumi',
        'Siuntimo planavimas ir testiniai laiškai',
        'Atidarymo / paspaudimų statistika',
        'BDAR — automatinis unsubscribe handling',
      ]}
    />
  )
}

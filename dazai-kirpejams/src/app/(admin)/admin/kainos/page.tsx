import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Kainos ir nuolaidos',
}

export default async function AdminPricingPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Kainos ir nuolaidos"
      description="Kainoraščių ir akcijų valdymas — nuolaidų kodai, B2B kainos, sezoniniai pasiūlymai."
      icon="💰"
      plannedFeatures={[
        'Masinis kainų atnaujinimas (pagal kategoriją ar prekės ženklą)',
        'Nuolaidų kodai (vienkartiniai, procentiniai, pagal krepšelio sumą)',
        'B2B kainoraščiai individualiems salonams',
        'Akcijų kampanijos su pradžia ir pabaiga',
        'Pristatymo nemokamumo ribos nustatymas',
      ]}
    />
  )
}

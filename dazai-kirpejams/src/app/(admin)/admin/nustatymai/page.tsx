import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Nustatymai',
}

export default async function AdminSettingsPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Nustatymai"
      description="Parduotuvės nustatymai — įmonės rekvizitai, mokėjimai, pristatymai, el. pašto šablonai."
      icon="⚙️"
      plannedFeatures={[
        'Įmonės rekvizitai (juridinis pavadinimas, PVM kodas, banko sąskaita)',
        'Mokėjimo būdai — Paysera, Stripe, banko pavedimas',
        'Pristatymo metodai ir kainos (Omniva, DPD, LP Express, kurjeris)',
        'El. pašto šablonai (užsakymo patvirtinimas, išsiuntimas, grąžinimas)',
        'Adminų valdymas — kas turi prieigą prie šios panelės',
        'Svetainės metaduomenys ir SEO',
      ]}
    />
  )
}

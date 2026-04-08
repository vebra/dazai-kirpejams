import { requireAdmin } from '@/lib/admin/auth'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata = {
  title: 'Blogas',
}

export default async function AdminBlogPage() {
  await requireAdmin()

  return (
    <AdminPlaceholder
      title="Blogas"
      description="Straipsnių valdymas — SEO turinys kirpėjams, techninės instrukcijos, naujienos apie produktus."
      icon="✏️"
      plannedFeatures={[
        'Straipsnių sąrašas (juodraščiai, publikuoti, suplanuoti)',
        'Rich-text redaktorius su nuotraukų įkėlimu',
        'Multi-lang turinys (LT / EN / RU)',
        'SEO metaduomenys (title, description, og:image)',
        'Automatinis susijusių produktų blokas straipsnio pabaigoje',
        'Kategorijos ir žymos',
      ]}
    />
  )
}

import { requireAdmin } from '@/lib/admin/auth'
import { BannerForm } from '../BannerForm'

export const metadata = {
  title: 'Naujas baneris',
}

export default async function NewBannerPage() {
  await requireAdmin()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Naujas baneris
      </h1>
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <BannerForm />
      </div>
    </div>
  )
}

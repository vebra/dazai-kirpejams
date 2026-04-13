import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getBannerById } from '@/lib/admin/queries'
import { BannerForm } from '../BannerForm'

export const metadata = {
  title: 'Redaguoti banerį',
}

export const dynamic = 'force-dynamic'

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()

  const { id } = await params
  const banner = await getBannerById(id)
  if (!banner) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Redaguoti: {banner.titleLt}
      </h1>
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <BannerForm banner={banner} />
      </div>
    </div>
  )
}

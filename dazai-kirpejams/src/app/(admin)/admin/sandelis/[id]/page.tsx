import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { getAdminProductById } from '@/lib/admin/queries'
import { ProductEditForm } from './ProductEditForm'

export const metadata = {
  title: 'Produkto redagavimas',
}

export const dynamic = 'force-dynamic'

export default async function AdminProductEditPage({
  params,
}: PageProps<'/admin/sandelis/[id]'>) {
  await requireAdmin()

  const { id } = await params
  const product = await getAdminProductById(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-brand-gray-500">
        <Link
          href="/admin/sandelis"
          className="hover:text-brand-magenta transition-colors"
        >
          ← Atgal į sandėlį
        </Link>
      </div>

      {/* Antraštė */}
      <div className="bg-white rounded-xl border border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start gap-4">
          {product.colorHex ? (
            <div
              className="flex-shrink-0 w-16 h-16 rounded-xl border border-[#ddd]"
              style={{ backgroundColor: product.colorHex }}
              aria-hidden
            />
          ) : (
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#F5F5F7] border border-[#ddd]" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-brand-gray-900">
              {product.nameLt}
            </h2>
            <div className="text-[12px] text-brand-gray-500 font-mono mt-1">
              {product.colorNumber
                ? `Spalva ${product.colorNumber}`
                : product.slug}
              {product.sku && ` · SKU: ${product.sku}`}
            </div>
          </div>
        </div>
      </div>

      <ProductEditForm product={product} />
    </div>
  )
}

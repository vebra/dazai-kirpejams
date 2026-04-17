import Link from 'next/link'
import Image from 'next/image'
import { getProductName, type Product } from '@/lib/types'
import { formatPrice, langPrefix } from '@/lib/utils'
import type { Locale } from '@/i18n/config'
import { AddToCartButton } from '@/components/commerce/AddToCartButton'

type ProductCardProps = {
  product: Product
  lang: Locale
  categorySlug: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  /** When false, price and cart button are hidden — user must be a verified professional */
  isVerified?: boolean
  /** Eager-load image (above-the-fold cards) */
  priority?: boolean
}

export function ProductCard({
  product,
  lang,
  categorySlug,
  dict,
  isVerified = false,
  priority = false,
}: ProductCardProps) {
  const name = getProductName(product, lang)
  const href = `${langPrefix(lang)}/produktai/${categorySlug}/${product.slug}`
  const primaryImage = product.image_urls?.[0]

  return (
    <div className="group bg-white rounded-xl border border-[#E0E0E0] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all">
      {/* Image area */}
      <Link
        href={href}
        className="relative block aspect-square bg-brand-gray-50 flex items-center justify-center overflow-hidden"
      >
        {product.volume_ml === 180 && (
          <span className="absolute top-3 left-3 z-10 px-[10px] py-1 bg-brand-magenta text-white text-[0.7rem] font-bold uppercase tracking-[0.5px] rounded-full">
            180 ml
          </span>
        )}

        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            {...(priority && { priority: true })}
          />
        ) : product.color_hex ? (
          <div
            className="w-[60px] h-[120px] rounded-t-md rounded-b-[30px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            style={{ backgroundColor: product.color_hex }}
            aria-hidden
          />
        ) : (
          <div className="text-brand-gray-500 text-xs font-medium uppercase tracking-wider">
            {product.sku}
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-5">
        <Link href={href}>
          <h3 className="text-[0.95rem] font-semibold text-brand-gray-900 mb-1 leading-[1.4] line-clamp-1 hover:text-brand-magenta transition-colors">
            {product.color_number
              ? `Color SHOCK ${product.color_number}`
              : name}
          </h3>
        </Link>
        {product.color_name && (
          <div className="text-[0.82rem] text-brand-gray-500 mb-3 line-clamp-1">
            {product.color_name}
          </div>
        )}
        {!product.color_name && product.volume_ml && (
          <div className="text-[0.82rem] text-brand-gray-500 mb-3">
            {product.volume_ml} ml
          </div>
        )}

        {isVerified ? (
          <div className="flex items-center justify-between">
            <div className="text-[1.15rem] font-bold text-brand-gray-900">
              {formatPrice(product.price_cents / 100, lang)}
            </div>
            <AddToCartButton
              variant="icon"
              label={dict.popular.addToCart}
              labelAdded={dict.popular.added ?? 'Pridėta'}
              item={{
                productId: product.id,
                slug: product.slug,
                categorySlug,
                sku: product.sku,
                name,
                priceCents: product.price_cents,
                volumeMl: product.volume_ml,
                imageUrl: primaryImage ?? null,
                colorHex: product.color_hex,
                colorNumber: product.color_number,
              }}
            />
          </div>
        ) : (
          <Link
            href={`${langPrefix(lang)}/prisijungimas`}
            className="flex items-center justify-center w-full min-h-[44px] px-4 py-2.5 bg-brand-magenta text-white text-[0.85rem] font-semibold rounded-lg hover:bg-brand-magenta-dark transition-colors"
          >
            Prisijungti dėl kainos
          </Link>
        )}
      </div>
    </div>
  )
}

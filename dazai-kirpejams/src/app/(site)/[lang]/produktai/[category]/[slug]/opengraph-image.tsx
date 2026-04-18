import { ImageResponse } from 'next/og'
import { getProductBySlug } from '@/lib/data/queries'
import { getProductName } from '@/lib/types'
import { hasLocale } from '@/i18n/dictionaries'
import {
  OG_SIZE,
  OgLayout,
  loadFonts,
  truncate,
  formatPriceOg,
  MAGENTA,
  DARK,
  GRAY,
} from '@/lib/og'

export const alt = 'Produkto nuotrauka'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; category: string; slug: string }>
}) {
  const { lang, slug } = await params
  const locale = hasLocale(lang) ? lang : 'lt'

  const product = await getProductBySlug(slug)
  if (!product) {
    return new ImageResponse(
      (
        <OgLayout>
          <div style={{ fontSize: 48, fontWeight: 700, color: DARK }}>
            Produktas nerastas
          </div>
        </OgLayout>
      ),
      { ...size, fonts: await loadFonts() }
    )
  }

  const name = getProductName(product, locale as 'lt' | 'en' | 'ru')
  const imageUrl = product.image_urls?.[0] ?? null

  return new ImageResponse(
    (
      <OgLayout badge="Color SHOCK">
        <div style={{ display: 'flex', gap: 48, alignItems: 'center', flex: 1 }}>
          {/* Product image */}
          {imageUrl && (
            <div
              style={{
                width: 340,
                height: 340,
                borderRadius: 24,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'white',
                border: '1px solid #E0E0E0',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={name}
                width={320}
                height={320}
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Product info */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 38, fontWeight: 700, color: DARK, lineHeight: 1.2 }}>
              {truncate(name, 80)}
            </div>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 20 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: MAGENTA }}>
                {formatPriceOg(product.price_cents)}
              </span>
              {product.compare_price_cents && product.compare_price_cents > product.price_cents && (
                <span
                  style={{
                    fontSize: 24,
                    color: GRAY,
                    textDecoration: 'line-through',
                  }}
                >
                  {formatPriceOg(product.compare_price_cents)}
                </span>
              )}
            </div>

            {/* Volume badge */}
            {product.volume_ml && (
              <div style={{ display: 'flex', marginTop: 20 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: MAGENTA,
                    backgroundColor: '#FDF0F7',
                    padding: '8px 16px',
                    borderRadius: 8,
                  }}
                >
                  {product.volume_ml} ml
                </span>
              </div>
            )}

            {/* Color info */}
            {product.color_number && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                {product.color_hex && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: product.color_hex,
                      border: '2px solid #E0E0E0',
                    }}
                  />
                )}
                <span style={{ fontSize: 18, color: GRAY }}>
                  {product.color_number}
                  {product.color_name ? ` — ${product.color_name}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </OgLayout>
    ),
    { ...size, fonts: await loadFonts() }
  )
}

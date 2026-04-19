export const revalidate = 60

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import {
  getProductBySlug,
  getRelatedProducts,
  getCategoryBySlug,
  getProducts,
  getCategories,
} from '@/lib/data/queries'
import {
  getProductName,
  getProductDescription,
  getCategoryName,
  localizedField,
} from '@/lib/types'
import { formatPrice, langPrefix } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductPriceBlock } from '@/components/products/ProductPriceBlock'
import { JsonLd } from '@/components/seo/JsonLd'
import { productSchema, breadcrumbSchema } from '@/lib/schema'
import { buildCanonicalUrl, buildLanguageAlternates, SITE_URL } from '@/lib/seo'
import { locales } from '@/i18n/config'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/produktai/[category]/[slug]'>): Promise<Metadata> {
  const { lang, category: categorySlug, slug } = await params
  if (!hasLocale(lang)) return {}

  const product = await getProductBySlug(slug)
  const category = await getCategoryBySlug(categorySlug)
  if (!product || !category) return {}

  const name = getProductName(product, lang)
  const description = getProductDescription(product, lang)
  const path = `/produktai/${categorySlug}/${slug}`
  const canonical = buildCanonicalUrl(lang, path)

  return {
    title: name,
    description: description || `${name} — profesionalūs plaukų dažai kirpėjams`,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title: name,
      description: description || undefined,
      url: canonical,
      type: 'article',
    },
  }
}

export async function generateStaticParams() {
  const params: { lang: string; category: string; slug: string }[] = []
  const products = await getProducts()
  const categories = await getCategories()

  for (const lang of locales) {
    for (const p of products) {
      const cat = categories.find((c) => c.id === p.category_id)
      if (cat) {
        params.push({ lang, category: cat.slug, slug: p.slug })
      }
    }
  }
  return params
}

export default async function ProductPage({
  params,
}: PageProps<'/[lang]/produktai/[category]/[slug]'>) {
  const { lang, category: categorySlug, slug } = await params
  if (!hasLocale(lang)) notFound()

  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const category = await getCategoryBySlug(categorySlug)
  if (!category || category.id !== product.category_id) notFound()

  const dict = await getDictionary(lang)
  const t = dict.productPage
  const relatedProducts = await getRelatedProducts(product, 4)
  // Verifikacija tikrinama kliento pusėje per VerificationProvider kontekstą

  const name = getProductName(product, lang)
  const description = getProductDescription(product, lang)
  const ingredients = localizedField(product, 'ingredients', lang)
  const usage = localizedField(product, 'usage', lang)

  const price = product.price_cents / 100
  const comparePrice = product.compare_price_cents
    ? product.compare_price_cents / 100
    : null
  const savings = comparePrice ? comparePrice - price : null
  const pricePerMl = product.volume_ml
    ? (price / product.volume_ml).toFixed(3)
    : null

  const productUrl = buildCanonicalUrl(lang, `/produktai/${categorySlug}/${slug}`)
  const productJsonLd = productSchema(product, category, lang, productUrl)
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: dict.nav.home, url: buildCanonicalUrl(lang, '/') },
    { name: dict.nav.products, url: buildCanonicalUrl(lang, '/produktai') },
    {
      name: getCategoryName(category, lang),
      url: buildCanonicalUrl(lang, `/produktai/${categorySlug}`),
    },
    { name, url: productUrl },
  ])

  const images =
    product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : []

  return (
    <>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Breadcrumb */}
      <section className="py-3 text-[0.85rem] text-brand-gray-500">
        <Container>
          <Link
            href={`${langPrefix(lang) || '/'}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {dict.common.home}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <Link
            href={`${langPrefix(lang)}/produktai/${categorySlug}`}
            className="hover:text-brand-magenta transition-colors"
          >
            {getCategoryName(category, lang)}
          </Link>
          <span className="mx-2 text-[#E0E0E0]">/</span>
          <span className="text-brand-gray-900 font-medium">{name}</span>
        </Container>
      </section>

      {/* Product main */}
      <section className="py-8 lg:py-12 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-[#E0E0E0]">
                {product.volume_ml === 180 && (
                  <span className="absolute top-5 left-5 z-10 px-4 py-1.5 bg-brand-magenta text-white text-[0.78rem] font-bold uppercase tracking-wider rounded-full">
                    180 ml
                  </span>
                )}
                {images[0] ? (
                  <Image
                    src={images[0]}
                    alt={name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain p-10"
                  />
                ) : product.color_hex ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-[140px] h-[260px] rounded-t-lg rounded-b-[60px] shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                      style={{ backgroundColor: product.color_hex }}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-brand-gray-500 text-sm uppercase tracking-wider">
                    {product.sku}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {images.slice(0, 4).map((src, idx) => (
                    <div
                      key={src}
                      className="relative aspect-square rounded-xl overflow-hidden bg-brand-gray-50 border border-[#E0E0E0]"
                    >
                      <Image
                        src={src}
                        alt={`${name} — ${idx + 1}`}
                        fill
                        sizes="12vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="text-[0.78rem] font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                Color SHOCK • RosaNera Cosmetics
              </div>
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold text-brand-gray-900 mb-4 leading-[1.2]">
                {name}
              </h1>

              <ProductPriceBlock
                lang={lang}
                langPrefixStr={langPrefix(lang)}
                price={price}
                comparePrice={comparePrice}
                savings={savings}
                pricePerMl={pricePerMl}
                volumeMl={product.volume_ml}
                cartItem={{
                  productId: product.id,
                  slug: product.slug,
                  categorySlug,
                  sku: product.sku,
                  name,
                  priceCents: product.price_cents,
                  volumeMl: product.volume_ml,
                  imageUrl: images[0] ?? null,
                  colorHex: product.color_hex,
                  colorNumber: product.color_number,
                }}
                labels={{
                  volumeDouble: t.volumeDouble,
                  pricePerMl: t.pricePerMl,
                  priceOnlyPro: t.priceOnlyPro,
                  loginToSeePrice: t.loginToSeePrice,
                  login: t.login,
                  register: t.register,
                  registerPro: t.registerPro,
                  b2bPrice: t.b2bPrice,
                  addToCart: dict.popular.addToCart,
                  addedToCart: dict.popular.added ?? 'Pridėta į krepšelį',
                  youSave: t.youSave,
                  accountPendingTitle: t.accountPendingTitle,
                  accountPendingDesc: t.accountPendingDesc,
                  accountRejectedTitle: t.accountRejectedTitle,
                  accountRejectedDesc: t.accountRejectedDesc,
                  priceLoadingTitle: t.priceLoadingTitle,
                  priceLoadingDesc: t.priceLoadingDesc,
                  refreshPage: t.refreshPage,
                  goToAccount: t.goToAccount,
                }}
              />

              {/* Description */}
              {description && (
                <p className="text-[0.95rem] text-brand-gray-500 leading-[1.7] mb-7">
                  {description}
                </p>
              )}

              {/* Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#E0E0E0]">
                <MetaItem icon="🚚" text={t.deliveryTime} />
                <MetaItem icon="📦" text={t.freeShipping} />
                <MetaItem icon="🔄" text={t.returnPolicy} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Detailed sections */}
      <section className="py-16 bg-brand-gray-50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0]">
              <h2 className="text-[1.35rem] font-bold text-brand-gray-900 mb-4 leading-tight">
                {t.descriptionTitle}
              </h2>
              {description ? (
                <p className="text-[0.95rem] text-brand-gray-500 leading-[1.7] mb-4">
                  {description}
                </p>
              ) : null}
              <ul className="space-y-2.5 text-[0.92rem] text-brand-gray-500 leading-[1.6]">
                <li>
                  <strong className="text-brand-gray-900">{t.feat180ml}</strong>{' '}
                  — {t.feat180mlDesc}
                </li>
                <li>
                  <strong className="text-brand-gray-900">{t.featArgan}</strong>{' '}
                  — {t.featArganDesc}
                </li>
                <li>
                  <strong className="text-brand-gray-900">{t.featRose}</strong>{' '}
                  — {t.featRoseDesc}
                </li>
                <li>
                  <strong className="text-brand-gray-900">{t.featGray}</strong>{' '}
                  — {t.featGrayDesc}
                </li>
                <li>
                  <strong className="text-brand-gray-900">{t.featColor}</strong>{' '}
                  — {t.featColorDesc}
                </li>
              </ul>
            </div>

            {usage && (
              <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0]">
                <h2 className="text-[1.35rem] font-bold text-brand-gray-900 mb-4 leading-tight">
                  {t.usageTitle}
                </h2>
                <p className="text-[0.95rem] text-brand-gray-500 leading-[1.7] whitespace-pre-line">
                  {usage}
                </p>
              </div>
            )}

            {ingredients && (
              <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0] lg:col-span-2">
                <h2 className="text-[1.35rem] font-bold text-brand-gray-900 mb-4 leading-tight">
                  {t.ingredientsTitle}
                </h2>
                <p className="text-[0.85rem] text-brand-gray-500 leading-[1.7]">
                  {ingredients}
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0] lg:col-span-2">
              <h2 className="text-[1.35rem] font-bold text-brand-gray-900 mb-4 leading-tight">
                {t.additionalInfo}
              </h2>
              <table className="w-full text-[0.92rem]">
                <tbody>
                  {[
                    [
                      t.brand,
                      'Color SHOCK / RosaNera Cosmetics',
                    ],
                    [
                      t.volume,
                      product.volume_ml ? `${product.volume_ml} ml` : '—',
                    ],
                    [t.type, t.typeValue],
                    [t.mixingRatio, '1+2'],
                    [t.shelfLife, t.shelfLifeValue],
                    [t.countryOfOrigin, t.countryValue],
                  ].map(([label, value]) => (
                    <tr
                      key={label}
                      className="border-b border-[#E0E0E0] last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-brand-gray-500 w-[40%]">
                        {label}
                      </td>
                      <td className="py-3 text-brand-gray-900 font-semibold">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* Related */}
      {relatedProducts.length > 0 && (
        <section className="py-16 bg-white">
          <Container>
            <div className="text-center max-w-[720px] mx-auto mb-10">
              <span className="inline-block text-xs font-semibold uppercase tracking-[2px] text-brand-magenta mb-3">
                {t.relatedBadge}
              </span>
              <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-brand-gray-900 leading-tight">
                {t.relatedTitle}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  lang={lang}
                  categorySlug={categorySlug}
                  dict={dict}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="pb-20 bg-white">
        <Container>
          <div className="bg-brand-gray-900 text-white rounded-2xl p-10 lg:p-14 text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white mb-4 leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-8 max-w-[600px] mx-auto leading-[1.7]">
              {t.ctaDesc}
            </p>
            <Link
              href={`${langPrefix(lang)}/salonams`}
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] bg-brand-magenta text-white rounded-lg text-[1.1rem] font-semibold hover:bg-brand-magenta-dark hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {t.ctaPrimary}
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}

function MetaItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[1.15rem]" aria-hidden>
        {icon}
      </span>
      <span className="text-[0.85rem] text-brand-gray-900 font-medium leading-snug">
        {text}
      </span>
    </div>
  )
}

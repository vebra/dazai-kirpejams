// STATINIS / ISR (revalidate 60s). Kaina į HTML NEpatenka — puslapis
// renderinamas kaip svečiui (getProduct*Static → kainos nukirptos), tad
// nereikia cookies() ir maršrutas nebėra force-dynamic. Patvirtintas
// profesionalas kainas pasiima naršyklėje (ProductPricesProvider →
// get_product_prices RPC). Anonimas/Google gauna greitą CDN puslapį be kainų.
export const revalidate = 60

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import {
  getProductStaticBySlug,
  getProductVariantsStatic,
  getRelatedProductsStatic,
  getCategoryBySlug,
  getProductsForBuild,
  getCategories,
} from '@/lib/data/queries'
import { ProductPricesProvider } from '@/components/products/ProductPricesProvider'
import {
  getProductName,
  getProductDescription,
  getCategoryName,
  localizedField,
  isOnSale,
  getEffectivePriceCents,
} from '@/lib/types'
import { langPrefix } from '@/lib/utils'
import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductPriceBlock } from '@/components/products/ProductPriceBlock'
import { StickyBuyBar } from '@/components/products/StickyBuyBar'
import { VariantPurchase, type VariantVM } from '@/components/products/VariantPurchase'
import { JsonLd } from '@/components/seo/JsonLd'
import { productSchema, breadcrumbSchema } from '@/lib/schema'
import { buildCanonicalUrl, buildLanguageAlternates } from '@/lib/seo'
import { locales } from '@/i18n/config'

export async function generateMetadata({
  params,
}: PageProps<'/[lang]/produktai/[category]/[slug]'>): Promise<Metadata> {
  const { lang, category: categorySlug, slug } = await params
  if (!hasLocale(lang)) return {}

  const product = await getProductStaticBySlug(slug)
  const category = await getCategoryBySlug(categorySlug)
  if (!product || !category) return {}

  const name = getProductName(product, lang)
  const description = getProductDescription(product, lang)
  const path = `/produktai/${categorySlug}/${slug}`
  const canonical = buildCanonicalUrl(lang, path)
  const dict = await getDictionary(lang)
  const c = dict.common

  const categoryName = getCategoryName(category, lang)
  const volumePart = product.volume_ml
    ? `, ${product.volume_ml} ${c.seoVolumeMl}`
    : ''
  // Brand suffix prideda parent layout'o `title.template` — jei pridėtume jį
  // čia, gausim „X | Dažai Kirpėjams | Dažai Kirpėjams".
  const title = `${name}${volumePart} — ${categoryName}`
  const fallbackDesc = c.seoProductDescFallback.replace('{name}', name)
  const metaDescription = description || fallbackDesc

  return {
    title,
    description: metaDescription,
    alternates: {
      canonical,
      languages: buildLanguageAlternates(path),
    },
    openGraph: {
      title,
      description: metaDescription,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
    },
  }
}

export async function generateStaticParams() {
  const params: { lang: string; category: string; slug: string }[] = []
  const products = await getProductsForBuild()
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

  const product = await getProductStaticBySlug(slug)
  if (!product) notFound()

  const category = await getCategoryBySlug(categorySlug)
  if (!category || category.id !== product.category_id) notFound()

  const dict = await getDictionary(lang)
  const t = dict.productPage
  const relatedProducts = await getRelatedProductsStatic(product, 4)
  // Verifikacija tikrinama kliento pusėje per VerificationProvider kontekstą

  const name = getProductName(product, lang)
  const description = getProductDescription(product, lang)
  const ingredients = localizedField(product, 'ingredients', lang)
  const usage = localizedField(product, 'usage', lang)

  const onSale = isOnSale(product)
  const effectiveCents = getEffectivePriceCents(product)
  const price = effectiveCents / 100
  // Akcijos metu perbraukiama įprasta kaina; kitu atveju — tiekėjo „compare" kaina.
  const comparePrice = onSale
    ? product.price_cents / 100
    : product.compare_price_cents
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

  const cartItem = {
    productId: product.id,
    slug: product.slug,
    categorySlug,
    sku: product.sku,
    name,
    priceCents: effectiveCents,
    volumeMl: product.volume_ml,
    imageUrl: images[0] ?? null,
    colorHex: product.color_hex,
    colorNumber: product.color_number,
  }

  // Variantai (dydžiai). Kiekvienas dydis — atskira prekė su savo likučiu;
  // jei jų yra, vietoj įprasto pirkimo bloko rodom dydžio pasirinkiklį.
  const variantProducts = product.variant_group
    ? await getProductVariantsStatic(product.variant_group)
    : []
  const variants: VariantVM[] = variantProducts.map((vp) => ({
    id: vp.id,
    slug: vp.slug,
    size: vp.variant_size ?? '',
    priceCents: getEffectivePriceCents(vp),
    comparePriceCents: isOnSale(vp)
      ? vp.price_cents
      : vp.compare_price_cents ?? null,
    stock: vp.stock_quantity ?? 0,
    sku: vp.sku,
    imageUrl: vp.image_urls?.[0] ?? null,
    colorHex: vp.color_hex,
    colorNumber: vp.color_number,
    volumeMl: vp.volume_ml,
  }))
  const hasVariants = variants.length > 1

  // Bendri „Į krepšelį" / kainos bloko tekstai — naudojami ir varianto, ir
  // įprasto pirkimo bloke.
  const priceLabels = {
    volumeDouble: t.volumeDouble,
    pricePerMl: t.pricePerMl,
    priceOnlyPro: t.priceOnlyPro,
    loginToSeePrice: t.loginToSeePrice,
    verifyNote: t.verifyNote,
    login: t.login,
    register: t.register,
    registerPro: t.registerPro,
    b2bPrice: t.b2bPrice,
    addToCart: dict.popular.addToCart,
    addedToCart: dict.popular.added,
    youSave: t.youSave,
    accountPendingTitle: t.accountPendingTitle,
    accountPendingDesc: t.accountPendingDesc,
    accountRejectedTitle: t.accountRejectedTitle,
    accountRejectedDesc: t.accountRejectedDesc,
    priceLoadingTitle: t.priceLoadingTitle,
    priceLoadingDesc: t.priceLoadingDesc,
    refreshPage: t.refreshPage,
    goToAccount: t.goToAccount,
  }

  // Visų matomų prekių ID — provider'is vienu RPC kvietimu paims jų kainas
  // patvirtintam profesionalui (pati prekė + dydžiai + susiję produktai).
  const priceIds = Array.from(
    new Set([
      product.id,
      ...variantProducts.map((v) => v.id),
      ...relatedProducts.map((p) => p.id),
    ])
  )

  return (
    <ProductPricesProvider ids={priceIds}>
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
                {product.info_brand?.trim() ||
                  (categorySlug === 'dazai'
                    ? 'Color SHOCK'
                    : 'RosaNera Cosmetic')}
              </div>
              <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold text-brand-gray-900 mb-4 leading-[1.2]">
                {name}
              </h1>

              {hasVariants ? (
                <VariantPurchase
                  lang={lang}
                  langPrefixStr={langPrefix(lang)}
                  categorySlug={categorySlug}
                  name={name}
                  variants={variants}
                  sizeLabel={t.sizeLabel}
                  outOfStockLabel={t.outOfStock}
                  labels={priceLabels}
                />
              ) : (
                <ProductPriceBlock
                  lang={lang}
                  langPrefixStr={langPrefix(lang)}
                  price={price}
                  comparePrice={comparePrice}
                  savings={savings}
                  pricePerMl={pricePerMl}
                  volumeMl={product.volume_ml}
                  cartItem={cartItem}
                  labels={priceLabels}
                />
              )}

              {/* Sticky juostos slenkstis — kai nuslenkama žemiau, parodoma juosta */}
              <div id="buybar-anchor" aria-hidden className="h-px w-full" />

              {/* Pilnas aprašymas rodomas tik „Aprašymas" bloke žemiau —
                  čia nedubliuojam. */}

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
            <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0] lg:col-span-2">
              <h2 className="text-[1.35rem] font-bold text-brand-gray-900 mb-4 leading-tight">
                {t.descriptionTitle}
              </h2>
              {description ? (
                <p className="text-[0.95rem] text-brand-gray-500 leading-[1.7] mb-4 whitespace-pre-line">
                  {description}
                </p>
              ) : null}
              {categorySlug === 'dazai' && (
                <>
                  <p className="text-[0.95rem] text-brand-gray-500 leading-[1.7] mb-5 whitespace-pre-line">
                    {t.dyeIntro}
                  </p>
                  <h3 className="text-[1.05rem] font-bold text-brand-gray-900 mb-3">
                    {t.dyeBenefitsTitle}
                  </h3>
                  <ul className="space-y-2.5 text-[0.92rem] text-brand-gray-500 leading-[1.6]">
                    {t.dyeBenefits.map((benefit) => (
                      <li key={benefit} className="flex gap-2.5">
                        <span className="text-brand-magenta mt-0.5" aria-hidden>
                          ✓
                        </span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {categorySlug === 'dazai' && (
              <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0] lg:col-span-2">
                <h2 className="text-[1.35rem] font-bold text-brand-gray-900 mb-5 leading-tight">
                  {t.dyeMixing.title}
                </h2>
                <div className="space-y-5 text-[0.92rem] text-brand-gray-500 leading-[1.6]">
                  <div>
                    <h3 className="font-semibold text-brand-gray-900 mb-1">
                      {t.dyeMixing.standardTitle}
                    </h3>
                    <p>{t.dyeMixing.standardRatio}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-gray-900 mb-1">
                      {t.dyeMixing.examplesTitle}
                    </h3>
                    <ul className="space-y-1 list-disc pl-5">
                      {t.dyeMixing.examples.map((example) => (
                        <li key={example}>{example}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-gray-900 mb-1">
                      {t.dyeMixing.superliftTitle}
                    </h3>
                    <p>{t.dyeMixing.superliftRatio}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-gray-900 mb-1">
                      {t.dyeMixing.oxidantTitle}
                    </h3>
                    <ul className="space-y-1 list-disc pl-5">
                      {t.dyeMixing.oxidants.map((oxidant) => (
                        <li key={oxidant}>{oxidant}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {usage && (
              <div className="bg-white rounded-2xl p-8 border border-[#E0E0E0] lg:col-span-2">
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
                  {/* Dažams rodom numatytas reikšmes (Tipas/Maišymas/Galiojimas/
                      Kilmė), kitoms prekėms (pvz. pirštinėms) — tik tuos laukus,
                      kuriuos admin'as užpildė, kad nesimatytų klaidingų dažų
                      reikšmių. Tušti laukai praleidžiami. */}
                  {(
                    [
                      [t.brand, product.info_brand || 'Color SHOCK / RosaNera Cosmetics'],
                      [t.volume, product.volume_ml ? `${product.volume_ml} ml` : ''],
                      [t.type, product.info_type || (categorySlug === 'dazai' ? t.typeValue : '')],
                      [t.mixingRatio, product.info_mixing_ratio || (categorySlug === 'dazai' ? '1+2' : '')],
                      [t.shelfLife, product.info_shelf_life || (categorySlug === 'dazai' ? t.shelfLifeValue : '')],
                      [t.countryOfOrigin, product.info_country || (categorySlug === 'dazai' ? t.countryValue : '')],
                    ] as [string, string][]
                  )
                    .filter(([, value]) => value)
                    .map(([label, value]) => (
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
              className="inline-flex items-center justify-center gap-2 px-10 py-[18px] btn-shine bg-brand-gradient text-white rounded-lg text-[1.1rem] font-semibold hover:brightness-110 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(233,30,140,0.3)] transition-all"
            >
              {t.ctaPrimary}
            </Link>
          </div>
        </Container>
      </section>

      {/* Sticky juosta — slepiam variantų prekei, nes joje nėra dydžio
          pasirinkimo (pirkimas vyksta per dydžio pasirinkiklį viršuje). */}
      {!hasVariants && (
        <StickyBuyBar
          lang={lang}
          langPrefixStr={langPrefix(lang)}
          price={price}
          cartItem={cartItem}
          labels={{
            addToCart: dict.popular.addToCart,
            addedToCart: dict.popular.added,
            login: t.login,
            priceOnlyPro: t.priceOnlyPro,
          }}
        />
      )}
    </ProductPricesProvider>
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

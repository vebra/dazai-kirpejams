import type { Locale } from '@/i18n/config'
import type { Product, Category } from '@/lib/types'
import {
  getProductName,
  getProductDescription,
  getCategoryName,
} from '@/lib/types'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { CONTACT, COMPANY, SOCIAL } from '@/lib/site'
import { langPrefix } from '@/lib/utils'

/**
 * Schema.org JSON-LD generatoriai. Visi tipai atitinka schema.org žodyną.
 * Šis turinys pateikiamas Google/Bing crawler'iams rich result'ams ir
 * AI paieškos varikliams (ChatGPT, Perplexity).
 */

export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ['Dazai Kirpejams', 'Color SHOCK'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description:
      'Profesionalūs plaukų dažai kirpėjams ir koloristams. Didesnė 180 ml talpa — daugiau vertės darbui salone.',
    legalName: COMPANY.legalName,
    taxID: COMPANY.code,
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.street,
      addressLocality: CONTACT.city,
      postalCode: CONTACT.postalCode,
      addressCountry: CONTACT.country,
    },
    sameAs: [
      SOCIAL.facebook,
      SOCIAL.instagram,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: CONTACT.phone,
      email: CONTACT.email,
      availableLanguage: ['Lithuanian', 'English', 'Russian'],
    },
  }
}

const LOCALE_MAP: Record<string, string> = {
  lt: 'lt',
  en: 'en-US',
  ru: 'ru',
}

export function websiteSchema(lang = 'lt'): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: LOCALE_MAP[lang] ?? lang,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}${langPrefix(lang)}/produktai?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function productSchema(
  product: Product,
  category: Category | null,
  lang: Locale,
  productUrl: string
): Record<string, unknown> {
  const name = getProductName(product, lang)
  const description = getProductDescription(product, lang)
  const priceEur = (product.price_cents / 100).toFixed(2)
  const hasImages = product.image_urls && product.image_urls.length > 0

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(hasImages && { image: product.image_urls }),
    sku: product.sku || product.id,
    ...(product.color_number && { mpn: product.color_number }),
    brand: {
      '@type': 'Brand',
      name: category?.slug === 'dazai' ? 'Color SHOCK' : SITE_NAME,
    },
    ...(product.volume_ml && {
      additionalProperty: {
        '@type': 'PropertyValue',
        name: 'Volume',
        value: `${product.volume_ml} ml`,
      },
    }),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'EUR',
      price: priceEur,
      availability: product.is_in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  }
}

export function itemListSchema(
  products: Product[],
  categorySlug: string,
  lang: Locale
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${SITE_URL}${langPrefix(lang)}/produktai/${categorySlug}/${product.slug}`,
      name: getProductName(product, lang),
    })),
  }
}

/**
 * BlogPosting schema — naudojama straipsnio puslapyje, kad Google galėtų
 * rodyti rich result'us su straipsnio antrašte, autoriumi ir data.
 */
export function blogPostingSchema({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  author,
}: {
  title: string
  description: string
  url: string
  imageUrl?: string | null
  datePublished: string
  author?: string | null
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    image: imageUrl || `${SITE_URL}/og-image.jpg`,
    datePublished,
    dateModified: datePublished,
    author: {
      '@type': author ? 'Person' : 'Organization',
      name: author || SITE_NAME,
      ...(author ? {} : { '@id': `${SITE_URL}/#organization` }),
    },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

export { getCategoryName }

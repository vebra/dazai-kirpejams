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

function toAbsoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}`
}

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

export function localBusinessSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/#store`,
    name: SITE_NAME,
    url: SITE_URL,
    telephone: CONTACT.phone,
    email: CONTACT.email,
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.street,
      addressLocality: CONTACT.city,
      postalCode: CONTACT.postalCode,
      addressCountry: CONTACT.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 54.8985,
      longitude: 23.9036,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    priceRange: '€€',
    image: `${SITE_URL}/logo.png`,
    sameAs: [SOCIAL.facebook, SOCIAL.instagram],
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
    ...(hasImages && { image: product.image_urls.map(toAbsoluteUrl) }),
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
      priceValidUntil: `${new Date().getFullYear()}-12-31`,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.is_in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#organization` },
      shippingDetails: { '@id': `${SITE_URL}/#shipping` },
      hasMerchantReturnPolicy: { '@id': `${SITE_URL}/#return-policy` },
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
 *
 * Jei perduodamas `authorUrl`, autorius linkuojamas į `Person` įrašą per
 * `@id` — tai sustiprina E-E-A-T signalą (Google supranta, kad tai ne tik
 * vardas string'as, o profilio puslapis su biografija ir credentials'ais).
 */
export function blogPostingSchema({
  title,
  description,
  url,
  imageUrl,
  datePublished,
  author,
  authorUrl,
}: {
  title: string
  description: string
  url: string
  imageUrl?: string | null
  datePublished: string
  author?: string | null
  authorUrl?: string | null
}): Record<string, unknown> {
  const authorNode = author
    ? {
        '@type': 'Person',
        name: author,
        ...(authorUrl
          ? { '@id': `${authorUrl}#person`, url: authorUrl }
          : {}),
      }
    : {
        '@type': 'Organization',
        name: SITE_NAME,
        '@id': `${SITE_URL}/#organization`,
      }

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    image: imageUrl ? toAbsoluteUrl(imageUrl) : `${SITE_URL}/og-image.jpg`,
    datePublished,
    dateModified: datePublished,
    author: authorNode,
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

/**
 * Person schema — autoriaus puslapyje. Pateikiamas pilnas profilis su
 * jobTitle, knowsAbout, sameAs, worksFor — Google naudoja šią info E-E-A-T
 * vertinimui ir gali rodyti Knowledge Panel'us paieškos rezultatuose.
 */
export function personSchema({
  url,
  name,
  jobTitle,
  description,
  imageUrl,
  sameAs,
  knowsAbout,
}: {
  url: string
  name: string
  jobTitle: string
  description: string
  imageUrl?: string | null
  sameAs?: string[]
  knowsAbout?: string[]
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    url,
    name,
    jobTitle,
    description,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
    ...(knowsAbout && knowsAbout.length > 0 ? { knowsAbout } : {}),
    worksFor: { '@id': `${SITE_URL}/#organization` },
  }
}

/**
 * OfferShippingDetails — nurodoma Product Offer'e per @id nuorodą.
 * Google naudoja merchant rich results generavimui.
 */
export function shippingDetailsSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferShippingDetails',
    '@id': `${SITE_URL}/#shipping`,
    shippingRate: {
      '@type': 'MonetaryAmount',
      value: '0',
      currency: 'EUR',
    },
    shippingDestination: {
      '@type': 'DefinedRegion',
      addressCountry: 'LT',
    },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: {
        '@type': 'QuantitativeValue',
        minValue: 0,
        maxValue: 1,
        unitCode: 'DAY',
      },
      transitTime: {
        '@type': 'QuantitativeValue',
        minValue: 1,
        maxValue: 3,
        unitCode: 'DAY',
      },
    },
  }
}

/**
 * MerchantReturnPolicy — nurodoma Product Offer'e per @id nuorodą.
 */
export function returnPolicySchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MerchantReturnPolicy',
    '@id': `${SITE_URL}/#return-policy`,
    applicableCountry: 'LT',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  }
}

/**
 * WebPage schema — naudojama pagrindiniame puslapyje.
 */
export function webPageSchema(lang = 'lt'): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${langPrefix(lang) || '/'}#webpage`,
    url: `${SITE_URL}${langPrefix(lang) || '/'}`,
    name: SITE_NAME,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    inLanguage: LOCALE_MAP[lang] ?? lang,
  }
}

export { getCategoryName }

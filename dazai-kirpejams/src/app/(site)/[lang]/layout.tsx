import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import '../../globals.css'
import { locales } from '@/i18n/config'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, websiteSchema } from '@/lib/schema'
import {
  SITE_URL,
  buildCanonicalUrl,
  buildLanguageAlternates,
} from '@/lib/seo'

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}

  const dict = await getDictionary(lang)
  const canonical = buildCanonicalUrl(lang, '/')

  return {
    title: {
      default: dict.meta.title,
      template: `%s | Dažai Kirpėjams`,
    },
    description: dict.meta.description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: buildLanguageAlternates('/'),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      url: canonical,
      siteName: 'Dažai Kirpėjams',
      type: 'website',
      locale: lang === 'lt' ? 'lt_LT' : lang === 'en' ? 'en_US' : 'ru_RU',
      images: [
        {
          url: `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: dict.meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.meta.title,
      description: dict.meta.description,
      images: [`${SITE_URL}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    formatDetection: {
      telephone: false,
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <html lang={lang} className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden">
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema(lang)} />
        <Header lang={lang} dict={dict} />
        <main className="flex-1 pt-[72px] lg:pt-[100px]">{children}</main>
        <Footer lang={lang} dict={dict} />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DS608JQ7CV"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DS608JQ7CV');
          `}
        </Script>
      </body>
    </html>
  )
}

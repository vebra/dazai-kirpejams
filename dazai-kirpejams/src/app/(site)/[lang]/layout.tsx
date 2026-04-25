import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import '../../globals.css'
import { locales } from '@/i18n/config'
import { getDictionary, hasLocale } from '@/i18n/dictionaries'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'
import { Suspense } from 'react'
import { VerificationProvider } from '@/components/auth/VerificationProvider'
import { CookieConsent } from '@/components/cookies/CookieConsent'
import { RouteTracker } from '@/components/analytics/RouteTracker'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  organizationSchema,
  websiteSchema,
  shippingDetailsSchema,
  returnPolicySchema,
} from '@/lib/schema'
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
      alternateLocale: ['lt_LT', 'en_US', 'ru_RU'].filter(
        (l) => l !== (lang === 'lt' ? 'lt_LT' : lang === 'en' ? 'en_US' : 'ru_RU')
      ),
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.meta.title,
      description: dict.meta.description,
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
    verification: {
      other: {
        'facebook-domain-verification': 'x9gp3k08zznrunuqeey31bxwne795t',
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-touch-icon.png',
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
      <head>
        <link rel="preconnect" href="https://bylzloadhsodqkhziime.supabase.co" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden">
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema(lang)} />
        <JsonLd data={shippingDetailsSchema()} />
        <JsonLd data={returnPolicySchema()} />
        <VerificationProvider>
          <Header lang={lang} dict={dict} />
          <main className="flex-1 pt-[72px] lg:pt-[100px]">{children}</main>
          <Footer lang={lang} dict={dict} />
          <Suspense fallback={null}>
            <RouteTracker />
          </Suspense>
        </VerificationProvider>
        <WhatsAppButton
          lang={lang}
          ariaLabel={dict.common.whatsappAria}
          tooltip={dict.common.whatsappTooltip}
          prefill={dict.common.whatsappPrefill}
        />
        <CookieConsent lang={lang} dict={dict.cookies} />
        <Script id="analytics-host-guard" strategy="beforeInteractive">
          {`
            (function(){
              var allowed = ['dazaikirpejams.lt','www.dazaikirpejams.lt'];
              window.__DK_ANALYTICS_ENABLED = allowed.indexOf(
                (location.hostname || '').toLowerCase()
              ) !== -1;
            })();
          `}
        </Script>
        <Script id="gtag-consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            var stored = null;
            try { stored = localStorage.getItem('cookie-consent-v1'); } catch(e) {}
            var granted = stored === 'accepted' ? 'granted' : 'denied';
            gtag('consent', 'default', {
              ad_storage: granted,
              ad_user_data: granted,
              ad_personalization: granted,
              analytics_storage: granted,
              wait_for_update: 500
            });
          `}
        </Script>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DS608JQ7CV"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            if (window.__DK_ANALYTICS_ENABLED) {
              gtag('config', 'G-DS608JQ7CV');
            }
          `}
        </Script>
        {process.env.NEXT_PUBLIC_META_PIXEL_ID ? (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                if (window.__DK_ANALYTICS_ENABLED) {
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  var stored = null;
                  try { stored = localStorage.getItem('cookie-consent-v1'); } catch(e) {}
                  if (stored !== 'accepted') fbq('consent', 'revoke');
                  fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                }
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                alt=""
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  )
}

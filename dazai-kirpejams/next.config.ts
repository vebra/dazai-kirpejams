import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next'

/**
 * Supabase Storage paveikslėlių host'as — ištraukiam iš URL aplinkos
 * kintamojo, kad remote images veiktų bet kurioje aplinkoje.
 */
function getSupabaseHost(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url.includes('your-supabase')) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

const supabaseHost = getSupabaseHost()

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://region1.google-analytics.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  experimental: {
    // Default Server Action body limit = 1MB. Produktų nuotraukos gali
    // siekti iki 10MB (taip nustatyta 'products' storage bucket'e).
    // Paliekam 12MB kad telpa multipart overhead.
    serverActions: {
      bodySizeLimit: '12mb',
    },
    // Reikalingas, nes turim kelis root layout'us ((admin)/admin + (site)/[lang])
    // ir top-level dynamic segmentą [lang]. Be šio flag'o nežinomi URL'ai
    // gauna 500 vietoj 404 (Next.js 16 docs / not-found.md).
    globalNotFound: true,
  },
  // @react-pdf/renderer naudoja Node-specific API (pdfkit, fs, fonts) —
  // Next.js negali jo bundle'inti į server components build'ą. Paliekam jį
  // kaip išorinį paketą, kad server runtime jį resolve'intų per require().
  serverExternalPackages: ['@react-pdf/renderer'],
  async redirects() {
    return [
      // Non-www → www kanoninė versija. Be šito abi atsiveria su status 200,
      // Google gauna dubliuotą turinį, o svetainės canonical signal'ai
      // skyla tarp dviejų hostnamų.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dazaikirpejams.lt' }],
        destination: 'https://www.dazaikirpejams.lt/:path*',
        permanent: true,
      },
      // Senas slug, į kurį rodo išoriniai linkai / Google indeksas. Be šito
      // crawler'is gauna 404 ir prarandam visą URL equity.
      {
        source: '/blogas/dazymo-technikos-profesionalams',
        destination: '/blogas/dazymo-technikos',
        permanent: true,
      },
      {
        source: '/:lang(lt|en|ru)/blogas/dazymo-technikos-profesionalams',
        destination: '/:lang/blogas/dazymo-technikos',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|svg|ico|webp|woff2|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      // Supabase Storage
      ...(supabaseHost
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHost,
              pathname: '/storage/v1/object/public/**',
            },
          ]
        : []),
      // Bendras fallback — visi Supabase project'ai (gamybinei aplinkai,
      // kol NEXT_PUBLIC_SUPABASE_URL dar nenurodytas build'o metu)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
 // For all available options, see:
 // https://www.npmjs.com/package/@sentry/webpack-plugin#options

 org: "mb-comfort-and-beauty",

 project: "javascript-nextjs",

 // Only print logs for uploading source maps in CI
 silent: !process.env.CI,

 // For all available options, see:
 // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

 // Upload a larger set of source maps for prettier stack traces (increases build time)
 widenClientFileUpload: true,

 // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
 // This can increase your server load as well as your hosting bill.
 // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
 // side errors will fail.
 tunnelRoute: "/monitoring",

 webpack: {
   // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
   // See the following for more information:
   // https://docs.sentry.io/product/crons/
   // https://vercel.com/docs/cron-jobs
   automaticVercelMonitors: true,

   // Tree-shaking options for reducing bundle size
   treeshake: {
     // Automatically tree-shake Sentry logger statements to reduce bundle size
     removeDebugLogging: true,
   },
 },
});

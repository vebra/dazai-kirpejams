import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/*/krepselis',
          '/*/apmokejimas',
          '/admin',
          '/admin/',
        ],
      },
      // Bulk training-only crawler'iai be aiškios B2B vertės — paliekam užblokuotus.
      // CCBot = Common Crawl (feed'ina daug modelių, jokio referral'o atgal).
      // Bytespider = ByteDance/TikTok (agresyvus, prastas fit'as profesionaliai nišai).
      {
        userAgent: ['CCBot', 'Bytespider'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

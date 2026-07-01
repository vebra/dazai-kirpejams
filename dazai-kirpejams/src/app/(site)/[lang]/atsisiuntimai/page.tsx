import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from '@/i18n/dictionaries'
import { Container } from '@/components/ui/Container'
import { getDownloads } from '@/lib/data/queries'
import { langPrefix } from '@/lib/utils'
import { buildPageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n/config'

export const dynamic = 'force-dynamic'

const STR: Record<
  Locale,
  {
    title: string
    subtitle: string
    pro: string
    download: string
    empty: string
  }
> = {
  lt: {
    title: 'Atsisiuntimai',
    subtitle:
      'Kainoraščiai, katalogai, spalvų paletė ir naudingi dokumentai profesionalams.',
    pro: 'Tik profesionalams',
    download: 'Atsisiųsti',
    empty: 'Failų kol kas nėra.',
  },
  en: {
    title: 'Downloads',
    subtitle: 'Price lists, catalogues, colour palette and useful documents.',
    pro: 'Professionals only',
    download: 'Download',
    empty: 'No files yet.',
  },
  ru: {
    title: 'Скачать',
    subtitle: 'Прайс-листы, каталоги, палитра цветов и полезные документы.',
    pro: 'Только для профессионалов',
    download: 'Скачать',
    empty: 'Файлов пока нет.',
  },
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale = (hasLocale(lang) ? lang : 'lt') as Locale
  const t = STR[locale]
  // buildPageMetadata (kaip kituose statiniuose puslapiuose) — be jo puslapis
  // per Next.js shallow-merge paveldėdavo layout'o canonical į home ('/') ir
  // Google jį laikė homepage duplikatu.
  return buildPageMetadata({
    lang: locale,
    path: '/atsisiuntimai',
    title: t.title,
    description: t.subtitle,
  })
}

export default async function DownloadsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const t = STR[lang as Locale]
  const items = await getDownloads()
  const p = langPrefix(lang as Locale)

  return (
    <section className="py-12 lg:py-16 bg-white">
      <Container>
        <div className="max-w-2xl mb-10">
          <h1 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold text-brand-gray-900 mb-3 leading-tight">
            {t.title}
          </h1>
          <p className="text-[1.05rem] text-brand-gray-500 leading-[1.7]">
            {t.subtitle}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="py-16 text-center text-brand-gray-500">{t.empty}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
            {items.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-4 p-5 bg-brand-gray-50 rounded-xl border border-[#E0E0E0] hover:border-brand-magenta hover:shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[1.02rem] font-bold text-brand-gray-900">
                      {d.title}
                    </span>
                    {d.visibility === 'pro' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-magenta/10 text-brand-magenta border border-brand-magenta/20">
                        🔒 {t.pro}
                      </span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-[0.88rem] text-brand-gray-500 mt-1 leading-snug">
                      {d.description}
                    </p>
                  )}
                  {fmtSize(d.fileSizeBytes) && (
                    <p className="text-[0.78rem] text-brand-gray-400 mt-1">
                      {fmtSize(d.fileSizeBytes)}
                    </p>
                  )}
                </div>
                <a
                  href={`${p}/atsisiuntimai/failas/${d.id}`}
                  className="shrink-0 btn-shine bg-brand-gradient text-white px-5 py-2.5 rounded-lg text-[0.9rem] font-semibold hover:brightness-110 transition-all whitespace-nowrap"
                >
                  {t.download} ↓
                </a>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
